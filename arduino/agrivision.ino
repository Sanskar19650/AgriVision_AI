/*
 * AgriVision AI - Arduino Uno / Mega Field Telemetry Node
 * Main Controller: Arduino Uno / Arduino Mega 2560 (ATmega328P / ATmega2560)
 * Communication Module: ESP8266-01 Wi-Fi (AT-Command UART Bridge only, NOT main controller)
 *
 * Pin Configuration (Arduino Uno / Mega):
 * - Soil Moisture Sensor (Analog Capacitive v1.2, 5V): A0
 * - Soil pH Sensor Module (Analog BNC Probe, 5V): A1
 * - DHT22 Temp & Humidity Sensor (Data pin w/ 10k pull-up): D2
 * - RS485 MAX485 Module for NPK Sensor (12V external supply for probe):
 *     RO -> D8 (SoftwareSerial RX)
 *     DI -> D9 (SoftwareSerial TX)
 *     DE & RE -> D7 (Direction Control: HIGH = Transmit, LOW = Receive)
 * - ESP8266 Wi-Fi Module (3.3V regulated supply! Use 1k/2k voltage divider on Arduino TX -> ESP RX):
 *     ESP TX -> D10 (SoftwareSerial RX)
 *     ESP RX -> D11 (SoftwareSerial TX via voltage divider)
 *
 * Required Libraries:
 * - DHT sensor library by Adafruit
 * - Adafruit Unified Sensor
 * - ArduinoJson by Benoit Blanchon (v6+)
 */

#include <DHT.h>
#include <SoftwareSerial.h>

#define DHTPIN 2
#define DHTTYPE DHT22
#define MOISTURE_PIN A0
#define PH_PIN A1
#define RS485_DE_RE 7

// Calibration Constants (Adjust using dry/wet and pH 4.0/7.0 buffer tests)
const int DRY_SOIL_ADC = 620;
const int WET_SOIL_ADC = 260;
const float PH_OFFSET = 0.12;

// Wi-Fi & Backend Configuration
const char* WIFI_SSID = "YOUR_FARM_WIFI_SSID";
const char* WIFI_PASS = "YOUR_FARM_WIFI_PASSWORD";
const char* SERVER_HOST = "192.168.1.100";
const int SERVER_PORT = 3000;
const char* DEVICE_ID = "ARDUINO-UNO-001";
const char* FARM_ID = "FARM-MH-001";
const char* PLOT_ID = "PLOT-A1";

DHT dht(DHTPIN, DHTTYPE);
SoftwareSerial rs485Serial(8, 9);    // RX, TX for RS485 NPK sensor
SoftwareSerial espSerial(10, 11);    // RX, TX for ESP8266 AT bridge

// Standard Modbus RTU inquiry frame for 3-in-1 Soil NPK Sensor (Addr 0x01, Reg 0x001E, Len 3)
const byte npkQueryFrame[] = {0x01, 0x03, 0x00, 0x1E, 0x00, 0x03, 0x65, 0xCD};
byte npkResponse[11];

void setup() {
  Serial.begin(9600);
  rs485Serial.begin(4800);
  espSerial.begin(9600);
  dht.begin();

  pinMode(RS485_DE_RE, OUTPUT);
  digitalWrite(RS485_DE_RE, LOW);

  Serial.println(F("AgriVision AI Node Booting (Arduino Main Controller)..."));
  connectWiFi();
}

void loop() {
  float moisture = readSoilMoisture();
  float ph = readSoilPH();
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();

  if (isnan(humidity) || isnan(temperature)) {
    Serial.println(F("DHT22 read failed; skipping cycle."));
    delay(5000);
    return;
  }

  int nitrogen = 0, phosphorus = 0, potassium = 0;
  readRS485NPK(&nitrogen, &phosphorus, &potassium);

  String payload = "{";
  payload += "\"deviceId\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"farmId\":\"" + String(FARM_ID) + "\",";
  payload += "\"plotId\":\"" + String(PLOT_ID) + "\",";
  payload += "\"source\":\"arduino\",";
  payload += "\"moisture\":" + String(moisture, 1) + ",";
  payload += "\"temperature\":" + String(temperature, 1) + ",";
  payload += "\"humidity\":" + String(humidity, 1) + ",";
  payload += "\"ph\":" + String(ph, 2) + ",";
  payload += "\"nitrogen\":" + String(nitrogen) + ",";
  payload += "\"phosphorus\":" + String(phosphorus) + ",";
  payload += "\"potassium\":" + String(potassium);
  payload += "}";

  Serial.println(payload);
  sendTelemetryHTTP(payload);

  // Sample every 30 seconds
  delay(30000);
}

float readSoilMoisture() {
  int raw = analogRead(MOISTURE_PIN);
  float pct = map(raw, DRY_SOIL_ADC, WET_SOIL_ADC, 0, 100);
  return constrain(pct, 0.0, 100.0);
}

float readSoilPH() {
  long sum = 0;
  for (int i = 0; i < 10; i++) {
    sum += analogRead(PH_PIN);
    delay(20);
  }
  float voltage = (sum / 10.0) * (5.0 / 1024.0);
  float phValue = 3.5 * voltage + PH_OFFSET;
  return constrain(phValue, 0.0, 14.0);
}

void readRS485NPK(int* n, int* p, int* k) {
  rs485Serial.listen();
  digitalWrite(RS485_DE_RE, HIGH);
  delay(10);
  rs485Serial.write(npkQueryFrame, sizeof(npkQueryFrame));
  rs485Serial.flush();
  digitalWrite(RS485_DE_RE, LOW);

  unsigned long start = millis();
  int idx = 0;
  while (millis() - start < 500 && idx < 11) {
    if (rs485Serial.available()) {
      npkResponse[idx++] = rs485Serial.read();
    }
  }
  if (idx >= 9 && npkResponse[0] == 0x01 && npkResponse[1] == 0x03) {
    *n = (npkResponse[3] << 8) | npkResponse[4];
    *p = (npkResponse[5] << 8) | npkResponse[6];
    *k = (npkResponse[7] << 8) | npkResponse[8];
  } else {
    Serial.println(F("RS485 NPK read timeout; check 12V probe power."));
  }
}

void connectWiFi() {
  espSerial.listen();
  espSerial.println("AT+RST");
  delay(2000);
  espSerial.println("AT+CWMODE=1");
  delay(500);
  espSerial.println("AT+CWJAP=\"" + String(WIFI_SSID) + "\",\"" + String(WIFI_PASS) + "\"");
  delay(6000);
}

void sendTelemetryHTTP(const String& jsonBody) {
  espSerial.listen();
  espSerial.println("AT+CIPSTART=\"TCP\",\"" + String(SERVER_HOST) + "\"," + String(SERVER_PORT));
  delay(1500);

  String req = "POST /api/iot/telemetry HTTP/1.1\r\n";
  req += "Host: " + String(SERVER_HOST) + ":" + String(SERVER_PORT) + "\r\n";
  req += "Content-Type: application/json\r\n";
  req += "Content-Length: " + String(jsonBody.length()) + "\r\n";
  req += "Connection: close\r\n\r\n";
  req += jsonBody;

  espSerial.println("AT+CIPSEND=" + String(req.length()));
  delay(500);
  espSerial.print(req);
  delay(1000);
  espSerial.println("AT+CIPCLOSE");
}
