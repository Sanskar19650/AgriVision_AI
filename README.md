# AgriVision AI — Agricultural Monitoring & Blockchain Verification

Full-stack precision agriculture platform featuring Maharashtra 7/12 land registration, Leaflet satellite boundary mapping, Arduino Uno/Mega IoT soil telemetry, CNN disease classification, YOLOv8 crop damage detection, Random Forest crop recommendation, real-time weather advisories, and SHA-256 blockchain document verification.

## Run Web Application (Express + React + Firebase)
```bash
npm install
npm run dev
```
Server listens on `http://localhost:3000`.

## Run Unit Tests
```bash
npx --yes tsx --test src/utils/agriMath.test.ts
```

## Optional Companion Services
- **Arduino Simulator**: `python3 arduino/simulator.py --url http://localhost:3000/api/iot/telemetry --count 3`
- **Arduino Firmware**: Flash `arduino/agrivision.ino` to Arduino Uno/Mega with DHT22, Soil Moisture, pH, RS485 NPK, and ESP8266 AT bridge.
- **Python FastAPI ML Service**: Install `ai-backend/requirements.txt` and launch `uvicorn main:app --port 8000` inside `ai-backend/`, then set `AI_BACKEND_URL=http://localhost:8000`.
- **Smart Contract**: Deploy `blockchain/AgriVision.sol` (`^0.8.19`) to an EVM testnet/RPC.
