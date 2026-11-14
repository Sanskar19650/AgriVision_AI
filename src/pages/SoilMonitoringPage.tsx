import React, { useEffect, useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { WorkspaceLayout } from '../components/Layout';
import { useAgri } from '../context/AgriContext';
import { evaluateSoilHealth } from '../utils/agriMath';

export function SoilMonitoringPage() {
  const { farms, soilReadings, iotDevices, addSoilReading } = useAgri();
  const [tab, setTab] = useState<'monitor' | 'hardware'>('monitor');
  const [livePackets, setLivePackets] = useState<any[]>([]);
  const [simulating, setSimulating] = useState(false);

  const [manual, setManual] = useState({
    farmId: farms[0]?.id || '',
    moisture: '46.5',
    temperature: '27.8',
    humidity: '64',
    ph: '6.6',
    nitrogen: '125',
    phosphorus: '52',
    potassium: '94',
    ec: '0.78',
  });

  const fetchServerTelemetry = async () => {
    try {
      const res = await fetch('/api/iot/telemetry');
      const data = await res.json();
      setLivePackets(data.packets || []);
    } catch {
      // Ignore transient network issue
    }
  };

  useEffect(() => {
    fetchServerTelemetry();
  }, []);

  const latest = soilReadings[0];
  const evaluation = latest
    ? evaluateSoilHealth({
        moisture: latest.moisture,
        ph: latest.ph,
        nitrogen: latest.nitrogen,
        phosphorus: latest.phosphorus,
        potassium: latest.potassium,
        temperature: latest.temperature,
        ec: latest.ec,
      })
    : null;

  const chartData = [...soilReadings]
    .slice(0, 10)
    .reverse()
    .map((r, i) => ({
      time: r.createdAt ? r.createdAt.slice(11, 16) || `R${i + 1}` : `R${i + 1}`,
      moisture: r.moisture,
      nitrogen: r.nitrogen,
      phosphorus: r.phosphorus,
      potassium: r.potassium,
    }));

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const farmId = manual.farmId || farms[0]?.id;
    if (!farmId) return;
    await addSoilReading({
      farmId,
      source: 'manual',
      moisture: Number(manual.moisture),
      temperature: Number(manual.temperature),
      humidity: Number(manual.humidity),
      ph: Number(manual.ph),
      nitrogen: Number(manual.nitrogen),
      phosphorus: Number(manual.phosphorus),
      potassium: Number(manual.potassium),
      ec: Number(manual.ec),
    });
  };

  const handleSendSimulatedArduinoPacket = async () => {
    setSimulating(true);
    try {
      const farmId = manual.farmId || farms[0]?.id || 'farm_demo_1';
      const payload = {
        deviceId: 'ARDUINO-UNO-001',
        farmId,
        plotId: 'plot_demo_1',
        source: 'simulated',
        moisture: Number((34 + Math.random() * 28).toFixed(1)),
        temperature: Number((24 + Math.random() * 8).toFixed(1)),
        humidity: Number((54 + Math.random() * 22).toFixed(1)),
        ph: Number((6.1 + Math.random() * 1.4).toFixed(2)),
        nitrogen: Math.round(90 + Math.random() * 60),
        phosphorus: Math.round(35 + Math.random() * 30),
        potassium: Math.round(70 + Math.random() * 55),
        ec: Number((0.45 + Math.random() * 0.7).toFixed(2)),
      };
      const res = await fetch('/api/iot/telemetry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        await addSoilReading({
          farmId,
          deviceId: payload.deviceId,
          source: 'simulated',
          moisture: payload.moisture,
          temperature: payload.temperature,
          humidity: payload.humidity,
          ph: payload.ph,
          nitrogen: payload.nitrogen,
          phosphorus: payload.phosphorus,
          potassium: payload.potassium,
          ec: payload.ec,
        });
        await fetchServerTelemetry();
      }
    } finally {
      setSimulating(false);
    }
  };

  return (
    <WorkspaceLayout
      title="Soil Monitoring & Arduino IoT"
      subtitle="Real-time moisture, pH, NPK, EC tracking with Arduino Uno/Mega hardware telemetry"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex p-1 bg-white border border-[#E0E0E0] rounded-lg">
            <button
              type="button"
              onClick={() => setTab('monitor')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md ${
                tab === 'monitor' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'text-[#546E7A]'
              }`}
            >
              Sensor Readings &amp; Charts
            </button>
            <button
              type="button"
              onClick={() => setTab('hardware')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md ${
                tab === 'hardware' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'text-[#546E7A]'
              }`}
            >
              Arduino Uno / Mega Wiring &amp; Calibration
            </button>
          </div>

          <button
            type="button"
            disabled={simulating}
            onClick={handleSendSimulatedArduinoPacket}
            className="px-4 py-2 text-xs font-semibold bg-[#2E7D32] text-white rounded-lg hover:bg-[#246628] disabled:opacity-60"
          >
            {simulating ? 'Sending Packet...' : 'Simulate Arduino Telemetry Packet'}
          </button>
        </div>

        {tab === 'monitor' ? (
          <>
            {/* Parameter Evaluation Table */}
            {evaluation && (
              <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="font-display font-semibold text-base text-[#263238]">
                      Latest Soil Evaluation ({latest?.source === 'simulated' ? 'Simulated Sensor Data' : latest?.source})
                    </h2>
                    <p className="text-xs text-[#546E7A]">
                      Overall Soil Health:{' '}
                      <strong
                        className={
                          evaluation.overallStatus === 'Healthy'
                            ? 'text-[#2E7D32]'
                            : evaluation.overallStatus === 'Warning'
                            ? 'text-[#D97706]'
                            : 'text-[#E53935]'
                        }
                      >
                        {evaluation.overallStatus}
                      </strong>
                    </p>
                  </div>
                </div>

                {evaluation.alerts.length > 0 && (
                  <div className="p-3 rounded-lg bg-[#FFF8E1] border border-[#FFE082] text-xs text-[#6D4C00] space-y-1">
                    {evaluation.alerts.map((a) => (
                      <p key={a}>{a}</p>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                  {evaluation.parameters.map((p) => (
                    <div key={p.parameter} className="p-3 rounded-lg bg-[#F5F7F5] border border-[#E0E0E0]">
                      <p className="text-xs text-[#546E7A]">{p.parameter}</p>
                      <p className="mt-1 font-mono font-bold text-base tabular-nums text-[#263238]">
                        {p.value} {p.unit}
                      </p>
                      <p className="text-[11px] text-[#546E7A] mt-0.5">Opt: {p.normalRange}</p>
                      <p
                        className={`text-xs font-semibold mt-1 ${
                          p.status === 'Optimal'
                            ? 'text-[#2E7D32]'
                            : p.status === 'Low'
                            ? 'text-[#D97706]'
                            : 'text-[#E53935]'
                        }`}
                      >
                        {p.status}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Chart + Manual Entry */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white border border-[#E0E0E0] rounded-xl p-5">
                <h2 className="font-display font-semibold text-base text-[#263238] mb-3">
                  Historical Moisture &amp; NPK Levels
                </h2>
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                      <XAxis dataKey="time" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="moisture" name="Moisture %" stroke="#2E7D32" strokeWidth={2} />
                      <Line type="monotone" dataKey="nitrogen" name="N (kg/ha)" stroke="#66BB6A" strokeWidth={2} />
                      <Line type="monotone" dataKey="potassium" name="K (kg/ha)" stroke="#D97706" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="lg:col-span-5 bg-white border border-[#E0E0E0] rounded-xl p-5">
                <h2 className="font-display font-semibold text-base text-[#263238] mb-3">
                  Log Manual Soil Test Reading
                </h2>
                <form onSubmit={handleManualSubmit} className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label htmlFor="soil-farm" className="block text-xs font-medium mb-1">
                      Farm
                    </label>
                    <select
                      id="soil-farm"
                      value={manual.farmId || farms[0]?.id || ''}
                      onChange={(e) => setManual({ ...manual, farmId: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
                    >
                      {farms.map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.farmName}
                        </option>
                      ))}
                    </select>
                  </div>
                  {[
                    { id: 'soil-moist', key: 'moisture', label: 'Moisture (%)' },
                    { id: 'soil-ph', key: 'ph', label: 'Soil pH' },
                    { id: 'soil-n', key: 'nitrogen', label: 'Nitrogen (kg/ha)' },
                    { id: 'soil-p', key: 'phosphorus', label: 'Phosphorus (kg/ha)' },
                    { id: 'soil-k', key: 'potassium', label: 'Potassium (kg/ha)' },
                    { id: 'soil-ec', key: 'ec', label: 'EC (dS/m)' },
                  ].map((fld) => (
                    <div key={fld.key}>
                      <label htmlFor={fld.id} className="block text-xs font-medium mb-1">
                        {fld.label}
                      </label>
                      <input
                        id={fld.id}
                        type="number"
                        step="0.1"
                        value={(manual as any)[fld.key]}
                        onChange={(e) => setManual({ ...manual, [fld.key]: e.target.value })}
                        className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg font-mono tabular-nums"
                      />
                    </div>
                  ))}
                  <div className="col-span-2 pt-1">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628]"
                    >
                      Save Manual Reading
                    </button>
                  </div>
                </form>
              </div>
            </div>

            {/* Express /api/iot/telemetry Stream */}
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold text-base text-[#263238]">
                  Backend IoT Telemetry Ingest (<code className="text-xs">POST /api/iot/telemetry</code>)
                </h2>
                <span className="text-xs text-[#546E7A] font-mono">
                  {iotDevices.length} registered node(s)
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E0E0E0] text-[#546E7A]">
                      <th className="py-2 pr-3">Device ID</th>
                      <th className="py-2 pr-3">Source</th>
                      <th className="py-2 pr-3">Moisture</th>
                      <th className="py-2 pr-3">pH</th>
                      <th className="py-2 pr-3">N / P / K</th>
                      <th className="py-2 pr-3">Status</th>
                      <th className="py-2 text-right">Received</th>
                    </tr>
                  </thead>
                  <tbody>
                    {livePackets.slice(0, 8).map((pkt) => (
                      <tr key={pkt.id} className="border-b border-[#E0E0E0] last:border-0">
                        <td className="py-2 pr-3 font-mono font-semibold">{pkt.deviceId}</td>
                        <td className="py-2 pr-3 capitalize">{pkt.source}</td>
                        <td className="py-2 pr-3 font-mono tabular-nums">{pkt.moisture}%</td>
                        <td className="py-2 pr-3 font-mono tabular-nums">{pkt.ph}</td>
                        <td className="py-2 pr-3 font-mono tabular-nums">
                          {pkt.nitrogen} / {pkt.phosphorus} / {pkt.potassium}
                        </td>
                        <td className="py-2 pr-3">{pkt.overallStatus}</td>
                        <td className="py-2 text-right font-mono text-[#546E7A] tabular-nums">
                          {new Date(pkt.receivedAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : (
          /* Arduino Hardware Architecture & Wiring Tab */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-6 bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-4">
              <h2 className="font-display font-semibold text-base text-[#263238]">
                Arduino Uno / Mega Hardware Architecture
              </h2>
              <p className="text-xs text-[#546E7A] leading-relaxed">
                Arduino Uno or Arduino Mega 2560 serves as the primary microcontroller. ESP8266-01 operates strictly as an optional AT-command Wi-Fi UART bridge. Do not power ESP8266 from 5V directly; use a 3.3V regulator and a 1kΩ / 2kΩ resistive voltage divider on Arduino TX → ESP RX.
              </p>

              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E0E0E0] text-[#546E7A]">
                    <th className="py-2 pr-3">Sensor / Module</th>
                    <th className="py-2 pr-3">Arduino Pin</th>
                    <th className="py-2">Voltage &amp; Interface</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E0E0E0]">
                  <tr>
                    <td className="py-2 pr-3 font-medium">Capacitive Soil Moisture v1.2</td>
                    <td className="py-2 pr-3 font-mono">A0</td>
                    <td className="py-2">5V Analog ADC</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-medium">Analog Soil pH Probe (BNC)</td>
                    <td className="py-2 pr-3 font-mono">A1</td>
                    <td className="py-2">5V Analog (calibrate pH 4.0 &amp; 7.0)</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-medium">DHT22 Temp &amp; Humidity</td>
                    <td className="py-2 pr-3 font-mono">D2</td>
                    <td className="py-2">5V Digital + 10kΩ pull-up</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-medium">RS485 MAX485 → NPK Probe</td>
                    <td className="py-2 pr-3 font-mono">D7 (DE/RE), D8 (RO), D9 (DI)</td>
                    <td className="py-2">Modbus RTU 4800 baud · 12V probe power</td>
                  </tr>
                  <tr>
                    <td className="py-2 pr-3 font-medium">ESP8266-01 Wi-Fi Bridge</td>
                    <td className="py-2 pr-3 font-mono">D10 (RX), D11 (TX via divider)</td>
                    <td className="py-2">3.3V regulated supply (AT HTTP POST)</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="lg:col-span-6 bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-3">
              <h2 className="font-display font-semibold text-base text-[#263238]">
                Python Simulator &amp; Calibration Guide
              </h2>
              <p className="text-xs text-[#546E7A]">
                Complete firmware is stored in <code className="bg-[#F5F7F5] px-1 rounded">arduino/agrivision.ino</code> and testing simulator in <code className="bg-[#F5F7F5] px-1 rounded">arduino/simulator.py</code>.
              </p>
              <pre className="p-3 rounded-lg bg-[#F5F7F5] border border-[#E0E0E0] text-xs overflow-x-auto">
{`# Run Python hardware-free IoT simulator:
python3 arduino/simulator.py --url http://localhost:3000/api/iot/telemetry --count 5

# Calibration Steps:
1. Measure dry air ADC (DRY_SOIL_ADC) and water-submerged ADC (WET_SOIL_ADC).
2. Immerse pH probe in pH 7.0 buffer and adjust PH_OFFSET until voltage reads 2.50V.
3. Supply external 12V DC to RS485 NPK probe before polling register 0x001E.`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  );
}
