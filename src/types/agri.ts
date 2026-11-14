export type UserRole = 'farmer' | 'admin';

export interface UserProfile {
  uid: string;
  fullName: string;
  email: string;
  mobile: string;
  role: UserRole;
  state: string;
  district: string;
  taluka: string;
  village: string;
  address: string;
  photoUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Farm {
  id: string;
  userId: string;
  farmName: string;
  satbaraNumber: string;
  surveyNumber: string;
  gatNumber: string;
  village: string;
  taluka: string;
  district: string;
  state: string;
  areaValue: number;
  areaUnit: 'Acres' | 'Hectares' | 'Guntha';
  soilType: string;
  waterSource: string;
  irrigationMethod: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  updatedAt: string;
}

export interface Plot {
  id: string;
  userId: string;
  farmId: string;
  plotName: string;
  areaAcres: number;
  assignedCrop: string;
  soilType: string;
  createdAt: string;
  updatedAt: string;
}

export interface LandRecord {
  id: string;
  userId: string;
  farmId: string;
  satbaraNumber: string;
  surveyNumber: string;
  gatNumber: string;
  village: string;
  taluka: string;
  district: string;
  state?: string;
  verificationStatus: 'pending_manual' | 'verified' | 'needs_review';
  calculatedAcres: number;
  geojsonText: string;
  ocrNotes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Crop {
  id: string;
  userId: string;
  farmId: string;
  plotId?: string;
  cropName: string;
  variety: string;
  sowingDate: string;
  expectedHarvestDate: string;
  cultivationArea: number;
  season: string;
  seedQuantityKg: number;
  stage: string;
  healthStatus: 'Healthy' | 'Monitor' | 'At Risk' | 'Harvested';
  yieldTonnes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CropActivity {
  id: string;
  userId: string;
  farmId: string;
  cropId: string;
  stage: string;
  activityDate: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface SoilReading {
  id: string;
  userId: string;
  farmId: string;
  plotId?: string;
  deviceId?: string;
  source: 'arduino' | 'manual' | 'simulated';
  moisture: number;
  temperature: number;
  humidity: number;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ec?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IotDevice {
  id: string;
  userId: string;
  farmId: string;
  deviceId: string;
  controller: string;
  status: 'online' | 'offline' | 'simulated';
  lastSeen: string;
  createdAt: string;
  updatedAt: string;
}

export interface DiseaseDetection {
  id: string;
  userId: string;
  farmId?: string;
  cropType: string;
  predictedDisease: string;
  confidence: number;
  engineUsed: string;
  treatment: string;
  createdAt: string;
  updatedAt: string;
}

export interface DamageDetection {
  id: string;
  userId: string;
  farmId?: string;
  damageCategory: string;
  detectionCount: number;
  confidence: number;
  severity: string;
  createdAt: string;
  updatedAt: string;
}

export interface CropRecommendation {
  id: string;
  userId: string;
  farmId?: string;
  recommendedCrop: string;
  confidence: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  ph: number;
  rainfall: number;
  createdAt: string;
  updatedAt: string;
}

export interface IrrigationRecord {
  id: string;
  userId: string;
  farmId: string;
  method: string;
  waterLiters: number;
  durationMinutes: number;
  scheduledDate: string;
  status: 'scheduled' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

export interface FertilizerRecord {
  id: string;
  userId: string;
  farmId: string;
  productName: string;
  category: string;
  quantity: string;
  applicationDate: string;
  applicationMethod: string;
  cropName: string;
  costInr: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  farmId?: string;
  category: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BlockchainRecord {
  id: string;
  userId: string;
  farmId?: string;
  documentType: string;
  documentTitle: string;
  sha256Hash: string;
  txHash: string;
  networkMode: string;
  verified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WeatherRecord {
  id: string;
  userId: string;
  farmId: string;
  temperatureC: number;
  humidity: number;
  windSpeedKmh: number;
  rainProbabilityPct?: number;
  condition: string;
  source?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReportRecord {
  id: string;
  userId: string;
  farmId?: string;
  reportType: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}
