"""
AgriVision AI - Arduino Hardware Telemetry Simulator (Testing without physical Arduino)
Clearly tags all emitted packets with source='simulated'.
"""
import argparse
import json
import random
import time
import urllib.request


def emit_packet(endpoint: str, device_id: str, farm_id: str, plot_id: str) -> dict:
    payload = {
        "deviceId": device_id,
        "farmId": farm_id,
        "plotId": plot_id,
        "source": "simulated",
        "moisture": round(random.uniform(32.0, 66.0), 1),
        "temperature": round(random.uniform(24.0, 34.5), 1),
        "humidity": round(random.uniform(52.0, 82.0), 1),
        "ph": round(random.uniform(6.0, 7.6), 2),
        "nitrogen": random.randint(85, 165),
        "phosphorus": random.randint(35, 75),
        "potassium": random.randint(65, 145),
        "ec": round(random.uniform(0.35, 1.25), 2),
    }
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        endpoint,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode("utf-8"))


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AgriVision AI Arduino Telemetry Simulator")
    parser.add_argument("--url", default="http://localhost:3000/api/iot/telemetry")
    parser.add_argument("--device", default="ARDUINO-UNO-SIM-01")
    parser.add_argument("--farm", default="farm_demo_1")
    parser.add_argument("--plot", default="plot_demo_1")
    parser.add_argument("--count", type=int, default=3)
    parser.add_argument("--interval", type=float, default=3.0)
    args = parser.parse_args()

    for idx in range(args.count):
        res = emit_packet(args.url, args.device, args.farm, args.plot)
        print(f"[{idx + 1}/{args.count}] Dispatched simulated telemetry -> {res.get('status')}")
        if idx + 1 < args.count:
            time.sleep(args.interval)
