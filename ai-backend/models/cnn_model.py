"""
AgriVision AI - PyTorch CNN Crop Disease Classification Architecture & Training Pipeline
Supported Priority Crops: Sugarcane, Mango, Banana, Coconut
"""
from pathlib import Path
import cv2
import numpy as np
import torch
import torch.nn as nn
from torchvision import transforms

SUPPORTED_DISEASE_CLASSES = [
    "Sugarcane___Healthy",
    "Sugarcane___Red_Rot",
    "Sugarcane___Rust",
    "Mango___Healthy",
    "Mango___Anthracnose",
    "Mango___Powdery_Mildew",
    "Banana___Healthy",
    "Banana___Sigatoka_Leaf_Spot",
    "Banana___Panama_Wilt",
    "Coconut___Healthy",
    "Coconut___Bud_Rot",
    "Coconut___Leaf_Blight",
]

TREATMENT_GUIDE = {
    "Healthy": ("No disease symptoms observed.", "Continue routine nutrient and drip schedule.", "Inspect field weekly."),
    "Red_Rot": ("Reddish internal stalk lesions and drying top leaves.", "Remove infected clumps; drench with Carbendazim 0.1%.", "Use disease-free setts and crop rotation."),
    "Rust": ("Orange-brown pustules on lower leaf surfaces.", "Spray Propiconazole 25 EC (1 ml/L) at 15-day intervals.", "Avoid excess nitrogen; plant resistant varieties."),
    "Anthracnose": ("Dark sunken necrotic spots on leaves and panicles.", "Apply Copper Oxychloride (2.5 g/L) or Azoxystrobin.", "Prune dead twigs and improve canopy airflow."),
    "Powdery_Mildew": ("White powdery fungal growth on blossoms and young leaves.", "Apply Wettable Sulphur (2 g/L) before flowering peak.", "Avoid overhead irrigation during humid evenings."),
    "Sigatoka_Leaf_Spot": ("Yellow streaks turning brown-black along leaf margins.", "De-leaf severely affected leaves; spray Mancozeb (2.5 g/L).", "Ensure proper drainage and spacing."),
    "Panama_Wilt": ("Yellowing of older leaves progressing inward with vascular browning.", "Isolate affected mats; apply Trichoderma viride bio-control.", "Use tissue-culture disease-free suckers."),
    "Bud_Rot": ("Yellowing of spindle leaf and foul-smelling crown rot.", "Clean crown and apply Bordeaux paste (1%).", "Provide prophylactic spray before monsoon onset."),
    "Leaf_Blight": ("Greyish-brown elongated lesions coalescing on leaflets.", "Spray Carbendazim + Mancozeb (2 g/L).", "Maintain balanced potassium nutrition."),
}


class AgriDiseaseCNN(nn.Module):
    def __init__(self, num_classes: int = len(SUPPORTED_DISEASE_CLASSES)):
        super().__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 32, kernel_size=3, padding=1),
            nn.BatchNorm2d(32),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(32, 64, kernel_size=3, padding=1),
            nn.BatchNorm2d(64),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.BatchNorm2d(128),
            nn.ReLU(inplace=True),
            nn.AdaptiveAvgPool2d((4, 4)),
        )
        self.classifier = nn.Sequential(
            nn.Flatten(),
            nn.Dropout(0.3),
            nn.Linear(128 * 4 * 4, 256),
            nn.ReLU(inplace=True),
            nn.Linear(256, num_classes),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.classifier(self.features(x))


PREPROCESS = transforms.Compose([
    transforms.ToPILImage(),
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
])


def load_trained_cnn(weights_path: str = "weights/agri_disease_cnn.pt"):
    path = Path(weights_path)
    if not path.exists():
        return None
    model = AgriDiseaseCNN()
    model.load_state_dict(torch.load(path, map_location="cpu"))
    model.eval()
    return model


def predict_leaf_disease(image_bytes: bytes, crop_hint: str = "Sugarcane", weights_path: str = "weights/agri_disease_cnn.pt"):
    arr = np.frombuffer(image_bytes, np.uint8)
    bgr = cv2.imdecode(arr, cv2.IMREAD_COLOR)
    if bgr is None:
        raise ValueError("Invalid image data")

    model = load_trained_cnn(weights_path)
    if model is not None:
        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        tensor = PREPROCESS(rgb).unsqueeze(0)
        with torch.no_grad():
            probs = torch.softmax(model(tensor), dim=1)[0]
            conf, idx = torch.max(probs, dim=0)
        label = SUPPORTED_DISEASE_CLASSES[int(idx)]
        crop_name, disease_key = label.split("___")
        symptoms, treatment, prevention = TREATMENT_GUIDE[disease_key]
        return {
            "crop": crop_name,
            "disease": disease_key.replace("_", " "),
            "confidence": round(float(conf) * 100, 1),
            "symptoms": symptoms,
            "treatment": treatment,
            "prevention": prevention,
            "modelLoaded": True,
        }

    raise RuntimeError(
        "Trained weights weights/agri_disease_cnn.pt not found. Run train_cnn() on labeled PlantVillage/Maharashtra crop leaf datasets before enabling PyTorch inference."
    )
