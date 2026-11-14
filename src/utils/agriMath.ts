export type AreaUnit = 'Acres' | 'Hectares' | 'Guntha';

// Maharashtra standard: 1 Acre = 40 Guntha, 1 Hectare = 2.4710538 Acres = 98.84215 Guntha
const ACRES_PER_HECTARE = 2.471053814671653;
const GUNTHA_PER_ACRE = 40;
const SQ_METERS_PER_ACRE = 4046.8564224;

export function convertArea(value: number, from: AreaUnit, to: AreaUnit): number {
  if (!Number.isFinite(value) || value < 0) return 0;
  let acres = value;
  if (from === 'Hectares') {
    acres = value * ACRES_PER_HECTARE;
  } else if (from === 'Guntha') {
    acres = value / GUNTHA_PER_ACRE;
  }

  if (to === 'Acres') return Number(acres.toFixed(4));
  if (to === 'Hectares') return Number((acres / ACRES_PER_HECTARE).toFixed(4));
  return Number((acres * GUNTHA_PER_ACRE).toFixed(2));
}

export interface LatLngPoint {
  lat: number;
  lng: number;
}

export interface PolygonMeasurement {
  sqMeters: number;
  acres: number;
  hectares: number;
  guntha: number;
  centroid: LatLngPoint;
}

/**
 * Computes geodesic polygon area on WGS84 sphere using spherical excess approximation
 * suitable for agricultural parcel measurement.
 */
export function calculatePolygonMeasurement(points: LatLngPoint[]): PolygonMeasurement {
  if (points.length < 3) {
    const centroid =
      points.length > 0
        ? {
            lat: points.reduce((s, p) => s + p.lat, 0) / points.length,
            lng: points.reduce((s, p) => s + p.lng, 0) / points.length,
          }
        : { lat: 18.5204, lng: 73.8567 };
    return { sqMeters: 0, acres: 0, hectares: 0, guntha: 0, centroid };
  }

  const EARTH_RADIUS_M = 6378137;
  const toRad = (deg: number) => (deg * Math.PI) / 180;

  let areaRad = 0;
  for (let i = 0; i < points.length; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % points.length];
    areaRad +=
      toRad(p2.lng - p1.lng) *
      (2 + Math.sin(toRad(p1.lat)) + Math.sin(toRad(p2.lat)));
  }

  const sqMeters = Math.abs((areaRad * EARTH_RADIUS_M * EARTH_RADIUS_M) / 2);
  const acres = sqMeters / SQ_METERS_PER_ACRE;
  const hectares = acres / ACRES_PER_HECTARE;
  const guntha = acres * GUNTHA_PER_ACRE;

  const centroid = {
    lat: Number((points.reduce((s, p) => s + p.lat, 0) / points.length).toFixed(6)),
    lng: Number((points.reduce((s, p) => s + p.lng, 0) / points.length).toFixed(6)),
  };

  return {
    sqMeters: Number(sqMeters.toFixed(1)),
    acres: Number(acres.toFixed(3)),
    hectares: Number(hectares.toFixed(3)),
    guntha: Number(guntha.toFixed(2)),
    centroid,
  };
}

export function buildPolygonGeoJSON(
  points: LatLngPoint[],
  properties: Record<string, string | number>
) {
  if (points.length < 3) return null;
  const ring = [...points, points[0]].map((p) => [
    Number(p.lng.toFixed(6)),
    Number(p.lat.toFixed(6)),
  ]);
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties,
        geometry: {
          type: 'Polygon',
          coordinates: [ring],
        },
      },
    ],
  };
}

export type ParameterStatus = 'Optimal' | 'Low' | 'High';

export interface SoilParameterEvaluation {
  parameter: string;
  value: number;
  unit: string;
  normalRange: string;
  status: ParameterStatus;
}

export interface SoilHealthEvaluation {
  overallStatus: 'Healthy' | 'Warning' | 'Critical';
  parameters: SoilParameterEvaluation[];
  alerts: string[];
}

export function evaluateSoilHealth(input: {
  moisture: number;
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  temperature?: number;
  ec?: number;
}): SoilHealthEvaluation {
  const evalRange = (
    parameter: string,
    value: number,
    unit: string,
    min: number,
    max: number
  ): SoilParameterEvaluation => {
    let status: ParameterStatus = 'Optimal';
    if (value < min) status = 'Low';
    else if (value > max) status = 'High';
    return {
      parameter,
      value: Number(value.toFixed(2)),
      unit,
      normalRange: `${min}–${max} ${unit}`,
      status,
    };
  };

  const parameters: SoilParameterEvaluation[] = [
    evalRange('Soil Moisture', input.moisture, '%', 35, 70),
    evalRange('Soil pH', input.ph, 'pH', 6.0, 7.5),
    evalRange('Nitrogen (N)', input.nitrogen, 'kg/ha', 80, 180),
    evalRange('Phosphorus (P)', input.phosphorus, 'kg/ha', 30, 80),
    evalRange('Potassium (K)', input.potassium, 'kg/ha', 60, 160),
  ];

  if (typeof input.temperature === 'number') {
    parameters.push(evalRange('Soil Temperature', input.temperature, '°C', 18, 34));
  }
  if (typeof input.ec === 'number') {
    parameters.push(evalRange('Electrical Conductivity', input.ec, 'dS/m', 0.2, 1.5));
  }

  const alerts: string[] = [];
  for (const p of parameters) {
    if (p.status === 'Low') {
      alerts.push(`${p.parameter} is low (${p.value} ${p.unit}; optimal ${p.normalRange}).`);
    } else if (p.status === 'High') {
      alerts.push(`${p.parameter} is high (${p.value} ${p.unit}; optimal ${p.normalRange}).`);
    }
  }

  const abnormalCount = alerts.length;
  const criticalMoistureOrPh =
    input.moisture < 25 || input.moisture > 85 || input.ph < 5.2 || input.ph > 8.4;

  let overallStatus: 'Healthy' | 'Warning' | 'Critical' = 'Healthy';
  if (criticalMoistureOrPh || abnormalCount >= 3) {
    overallStatus = 'Critical';
  } else if (abnormalCount >= 1) {
    overallStatus = 'Warning';
  }

  return { overallStatus, parameters, alerts };
}

export interface IrrigationSuggestion {
  shouldIrrigate: boolean;
  urgency: 'Immediate' | 'Scheduled' | 'Hold';
  recommendedLiters: number;
  suggestedDurationMinutes: number;
  suggestedWindow: string;
  reason: string;
}

export function suggestIrrigation(input: {
  moisturePct: number;
  areaAcres: number;
  rainProbabilityPct: number;
  method: string;
}): IrrigationSuggestion {
  const area = Math.max(0.1, input.areaAcres);
  const dripEfficiency = input.method.toLowerCase().includes('drip') ? 0.65 : 1.0;

  if (input.rainProbabilityPct >= 65 && input.moisturePct >= 30) {
    return {
      shouldIrrigate: false,
      urgency: 'Hold',
      recommendedLiters: 0,
      suggestedDurationMinutes: 0,
      suggestedWindow: 'Defer 24–48 hrs due to forecast rainfall',
      reason: `Rain probability is ${input.rainProbabilityPct}% with adequate moisture (${input.moisturePct}%).`,
    };
  }

  if (input.moisturePct < 32) {
    const liters = Math.round(area * 18000 * dripEfficiency);
    return {
      shouldIrrigate: true,
      urgency: 'Immediate',
      recommendedLiters: liters,
      suggestedDurationMinutes: Math.round(90 * dripEfficiency),
      suggestedWindow: '06:00 AM – 08:30 AM (Low evaporation)',
      reason: `Soil moisture (${input.moisturePct}%) is below critical threshold (32%).`,
    };
  }

  if (input.moisturePct < 45) {
    const liters = Math.round(area * 12000 * dripEfficiency);
    return {
      shouldIrrigate: true,
      urgency: 'Scheduled',
      recommendedLiters: liters,
      suggestedDurationMinutes: Math.round(60 * dripEfficiency),
      suggestedWindow: '06:30 AM – 07:30 AM tomorrow',
      reason: `Moisture (${input.moisturePct}%) is trending toward lower optimal bound.`,
    };
  }

  return {
    shouldIrrigate: false,
    urgency: 'Hold',
    recommendedLiters: 0,
    suggestedDurationMinutes: 0,
    suggestedWindow: 'No irrigation needed today',
    reason: `Soil moisture (${input.moisturePct}%) is inside optimal agricultural range.`,
  };
}

export function shouldAutoStoreWeather(
  records: Array<{ farmId: string; createdAt?: string }>,
  farmId: string,
  nowMs: number = Date.now(),
  minIntervalMs: number = 15 * 60 * 1000
): boolean {
  if (!farmId) return false;
  let latestMs = -Infinity;
  for (const r of records) {
    if (r.farmId !== farmId || !r.createdAt) continue;
    const t = Date.parse(r.createdAt);
    if (Number.isFinite(t) && t > latestMs) {
      latestMs = t;
    }
  }
  if (!Number.isFinite(latestMs)) return true;
  return nowMs - latestMs >= minIntervalMs;
}
