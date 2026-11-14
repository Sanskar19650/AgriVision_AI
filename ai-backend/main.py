"""
AgriVision AI - Python FastAPI AI & Web3 Microservice
"""
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from pydantic import BaseModel
from models.cnn_model import predict_leaf_disease
from models.random_forest import predict_crop
from models.yolov8_model import detect_crop_damage

app = FastAPI(title="AgriVision AI ML Microservice", version="1.0.0")


class CropInput(BaseModel):
    nitrogen: float
    phosphorus: float
    potassium: float
    temperature: float
    humidity: float
    ph: float
    rainfall: float


@app.get("/api/health")
def health():
    return {"status": "ok", "service": "agrivision-ai-python-ml"}


@app.post("/api/ai/crop-recommendation")
def api_crop_recommendation(payload: CropInput):
    try:
        return predict_crop(payload.model_dump())
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))


@app.post("/api/ai/disease-detection")
async def api_disease_detection(cropType: str = Form("Sugarcane"), image: UploadFile = File(...)):
    raw = await image.read()
    try:
        return predict_leaf_disease(raw, crop_hint=cropType)
    except (ValueError, RuntimeError) as exc:
        raise HTTPException(status_code=400 if isinstance(exc, ValueError) else 503, detail=str(exc))


@app.post("/api/ai/damage-detection")
async def api_damage_detection(image: UploadFile = File(...)):
    raw = await image.read()
    try:
        return {"detections": detect_crop_damage(raw)}
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
