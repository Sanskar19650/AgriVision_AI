"""
AgriVision AI - Scikit-learn Random Forest Crop Recommendation Training & Inference
"""
from pathlib import Path
import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split


def train_random_forest(csv_path: str, output_model: str = "weights/crop_rf.joblib"):
    df = pd.read_csv(csv_path)
    features = ["N", "P", "K", "temperature", "humidity", "ph", "rainfall"]
    X = df[features]
    y = df["label"]

    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    clf = RandomForestClassifier(n_estimators=150, max_depth=16, random_state=42)
    clf.fit(X_train, y_train)

    preds = clf.predict(X_test)
    report = classification_report(y_test, preds, output_dict=True)
    cm = confusion_matrix(y_test, preds).tolist()
    acc = accuracy_score(y_test, preds)

    Path(output_model).parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(clf, output_model)

    return {
        "accuracy": round(acc * 100, 2),
        "macro_f1": round(report["macro avg"]["f1-score"] * 100, 2),
        "confusion_matrix": cm,
        "model_path": output_model,
    }


def predict_crop(payload: dict, model_path: str = "weights/crop_rf.joblib"):
    path = Path(model_path)
    if not path.exists():
        raise RuntimeError(
            "Serialized Random Forest model weights/crop_rf.joblib not found. Run train_random_forest(csv_path) first."
        )
    clf = joblib.load(path)
    row = np.array([[
        payload["nitrogen"],
        payload["phosphorus"],
        payload["potassium"],
        payload["temperature"],
        payload["humidity"],
        payload["ph"],
        payload["rainfall"],
    ]])
    probs = clf.predict_proba(row)[0]
    classes = clf.classes_
    top_idx = int(np.argmax(probs))
    return {
        "recommendedCrop": str(classes[top_idx]),
        "confidence": round(float(probs[top_idx]) * 100, 1),
    }
