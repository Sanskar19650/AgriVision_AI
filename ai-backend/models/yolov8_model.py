"""
AgriVision AI - Ultralytics YOLOv8 Agricultural Crop Damage Detection Pipeline
Trained categories: Leaf_Damage, Pest_Damage, Broken_Plant_Parts, Crop_Deterioration
Do NOT use generic COCO weights as a finished agricultural damage detector.
"""
from pathlib import Path
import cv2
import numpy as np
from ultralytics import YOLO

TRAINED_DAMAGE_CLASSES = [
    "Leaf Damage",
    "Pest Damage",
    "Broken Plant Parts",
    "Visible Crop Deterioration",
]


def train_yolov8_damage(data_yaml: str = "data/agri_damage.yaml", epochs: int = 50):
    model = YOLO("yolov8n.pt")
    results = model.train(data=data_yaml, epochs=epochs, imgsz=640, project="weights", name="damage_yolo")
    return results


def detect_crop_damage(image_bytes: bytes, weights_path: str = "weights/damage_yolo/weights/best.pt"):
    path = Path(weights_path)
    if not path.exists():
        raise RuntimeError(
            "Custom-trained agricultural YOLOv8 weights not found at weights/damage_yolo/weights/best.pt. Train on annotated agricultural damage dataset first."
        )
    arr = np.frombuffer(image_bytes, np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    model = YOLO(str(path))
    preds = model.predict(source=img, conf=0.25, verbose=False)[0]

    detections = []
    for box in preds.boxes:
        x1, y1, x2, y2 = [float(v) for v in box.xyxyn[0]]
        cls_id = int(box.cls[0])
        conf = float(box.conf[0])
        detections.append({
            "category": TRAINED_DAMAGE_CLASSES[cls_id] if cls_id < len(TRAINED_DAMAGE_CLASSES) else "Visible Crop Deterioration",
            "confidence": round(conf * 100, 1),
            "bboxNormalized": [x1, y1, x2 - x1, y2 - y1],
        })
    return detections
