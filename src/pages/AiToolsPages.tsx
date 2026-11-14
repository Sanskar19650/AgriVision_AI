import React, { useEffect, useRef, useState } from 'react';
import { WorkspaceLayout } from '../components/Layout';
import { useAgri } from '../context/AgriContext';

// 1. CNN Crop Disease Detection Page
export function DiseaseDetectionPage() {
  const { farms, diseaseDetections, logDiseaseDetection } = useAgri();
  const [cropType, setCropType] = useState<'Sugarcane' | 'Mango' | 'Banana' | 'Coconut'>('Sugarcane');
  const [previewUrl, setPreviewUrl] = useState<string>('/src/assets/images/crop_leaf_sample_1794662768768.jpg');
  const [uploadDataUrl, setUploadDataUrl] = useState<string>('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setPreviewUrl(reader.result);
        setUploadDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async () => {
    setError('');
    setLoading(true);
    try {
      let dataUrl = uploadDataUrl;
      if (!dataUrl) {
        // Convert bundled botanical sample image to base64 data URL so server analyzes real image bytes
        const resp = await fetch(previewUrl);
        const blob = await resp.blob();
        dataUrl = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.readAsDataURL(blob);
        });
      }

      const res = await fetch('/api/ai/disease-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: dataUrl, cropType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Disease inference failed');
      setResult(data);
      await logDiseaseDetection({
        farmId: farms[0]?.id || '',
        cropType: data.cropType,
        predictedDisease: data.predictedDisease,
        confidence: data.confidence,
        engineUsed: data.engineUsed,
        treatment: data.treatment,
      });
    } catch (err: any) {
      setError(err?.message || 'Unable to run disease detection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <WorkspaceLayout
      title="CNN Crop Disease Detection"
      subtitle="Supported priority crops: Sugarcane, Mango, Banana, Coconut"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-4">
          <h2 className="font-display font-semibold text-base text-[#263238]">
            Upload Leaf Image
          </h2>
          <div>
            <label htmlFor="dis-crop" className="block text-xs font-medium mb-1">
              Target Crop (Supported Taxonomy Only)
            </label>
            <select
              id="dis-crop"
              value={cropType}
              onChange={(e) => setCropType(e.target.value as any)}
              className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
            >
              <option value="Sugarcane">Sugarcane (Healthy, Red Rot, Leaf Rust)</option>
              <option value="Mango">Mango (Healthy, Anthracnose, Powdery Mildew)</option>
              <option value="Banana">Banana (Healthy, Sigatoka, Panama Wilt)</option>
              <option value="Coconut">Coconut (Healthy, Bud Rot, Leaf Blight)</option>
            </select>
          </div>

          <div>
            <label htmlFor="dis-file" className="block text-xs font-medium mb-1">
              Leaf Photo or Mobile Camera Capture
            </label>
            <input
              id="dis-file"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileChange}
              className="w-full text-xs border border-[#E0E0E0] rounded-lg p-2 bg-[#F5F7F5]"
            />
          </div>

          <div className="rounded-lg overflow-hidden border border-[#E0E0E0] bg-[#F5F7F5] aspect-[4/3]">
            <img
              src={previewUrl}
              alt="Crop leaf specimen preview"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
          </div>

          {error && <p className="text-xs text-[#E53935]">{error}</p>}

          <button
            type="button"
            disabled={loading}
            onClick={runAnalysis}
            className="w-full py-2.5 px-4 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628] disabled:opacity-60"
          >
            {loading ? 'Running CNN Classification...' : 'Analyze Leaf Disease'}
          </button>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-3">
            <h2 className="font-display font-semibold text-base text-[#263238]">
              Pathology Prediction Result
            </h2>
            {result ? (
              <div className="space-y-3 text-sm">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-[#F5F7F5] border border-[#E0E0E0]">
                    <p className="text-xs text-[#546E7A]">Crop</p>
                    <p className="font-semibold">{result.cropType}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F5F7F5] border border-[#E0E0E0]">
                    <p className="text-xs text-[#546E7A]">Predicted Class</p>
                    <p className="font-semibold text-[#2E7D32]">{result.predictedDisease}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-[#F5F7F5] border border-[#E0E0E0]">
                    <p className="text-xs text-[#546E7A]">Confidence</p>
                    <p className="font-mono font-semibold tabular-nums">{result.confidence}%</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-[#263238]">
                  <p><strong>Symptoms:</strong> {result.symptoms}</p>
                  <p><strong>Treatment:</strong> {result.treatment}</p>
                  <p><strong>Prevention:</strong> {result.prevention}</p>
                  <p className="text-[#546E7A]"><strong>Engine:</strong> {result.engineUsed}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#546E7A]">
                Select a crop and click "Analyze Leaf Disease" to inspect CNN classification, symptoms, and treatment steps.
              </p>
            )}
          </div>

          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
            <h3 className="font-display font-semibold text-base text-[#263238] mb-3">
              Detection History ({diseaseDetections.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E0E0E0] text-[#546E7A]">
                    <th className="py-2 pr-3">Crop</th>
                    <th className="py-2 pr-3">Classification</th>
                    <th className="py-2 pr-3">Confidence</th>
                    <th className="py-2">Recommended Action</th>
                  </tr>
                </thead>
                <tbody>
                  {diseaseDetections.map((d) => (
                    <tr key={d.id} className="border-b border-[#E0E0E0] last:border-0">
                      <td className="py-2 pr-3 font-medium">{d.cropType}</td>
                      <td className="py-2 pr-3">{d.predictedDisease}</td>
                      <td className="py-2 pr-3 font-mono tabular-nums">{d.confidence}%</td>
                      <td className="py-2 text-[#546E7A]">{d.treatment}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}

// 2. YOLOv8 Crop Damage Detection Page
export function DamageDetectionPage() {
  const { farms, damageDetections, logDamageDetection } = useAgri();
  const [imageUrl, setImageUrl] = useState('/src/assets/images/crop_leaf_sample_1794662768768.jpg');
  const [uploadDataUrl, setUploadDataUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setImageUrl(reader.result);
        setUploadDataUrl(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      canvas.width = 640;
      canvas.height = 480;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      if (result?.detections) {
        result.detections.forEach((det: any) => {
          const [nx, ny, nw, nh] = det.bbox;
          const x = nx * canvas.width;
          const y = ny * canvas.height;
          const w = nw * canvas.width;
          const h = nh * canvas.height;
          ctx.strokeStyle = '#E53935';
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, w, h);
          ctx.fillStyle = '#E53935';
          const label = `${det.category} (${det.confidence}%)`;
          ctx.fillRect(x, Math.max(0, y - 22), Math.min(260, label.length * 7 + 12), 22);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '12px sans-serif';
          ctx.fillText(label, x + 6, Math.max(15, y - 7));
        });
      }
    };
    img.src = imageUrl;
  }, [imageUrl, result]);

  const runDetection = async () => {
    setLoading(true);
    try {
      let dataUrl = uploadDataUrl;
      if (!dataUrl) {
        const resp = await fetch(imageUrl);
        const blob = await resp.blob();
        dataUrl = await new Promise<string>((resolve) => {
          const r = new FileReader();
          r.onload = () => resolve(String(r.result));
          r.readAsDataURL(blob);
        });
      }
      const res = await fetch('/api/ai/damage-detection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageDataUrl: dataUrl }),
      });
      const data = await res.json();
      setResult(data);
      const primary = data.detections?.[0];
      if (primary) {
        await logDamageDetection({
          farmId: farms[0]?.id || '',
          damageCategory: primary.category,
          detectionCount: data.detections.length,
          confidence: primary.confidence,
          severity: data.severity,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <WorkspaceLayout
      title="YOLOv8 Crop Damage Detection"
      subtitle="Detects leaf damage, pest damage, broken plant parts, and visible crop deterioration"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-4">
          <h2 className="font-display font-semibold text-base text-[#263238]">
            Upload Field / Crop Specimen
          </h2>
          <div>
            <label htmlFor="dmg-file" className="block text-xs font-medium mb-1">
              Crop Image
            </label>
            <input
              id="dmg-file"
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="w-full text-xs border border-[#E0E0E0] rounded-lg p-2 bg-[#F5F7F5]"
            />
          </div>
          <button
            type="button"
            disabled={loading}
            onClick={runDetection}
            className="w-full py-2.5 px-4 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628] disabled:opacity-60"
          >
            {loading ? 'Scanning Regions...' : 'Detect Crop Damage'}
          </button>

          {result && (
            <div className="p-3 rounded-lg bg-[#F5F7F5] border border-[#E0E0E0] text-xs space-y-1.5">
              <p><strong>Severity:</strong> {result.severity}</p>
              <p>{result.summary}</p>
              <p className="text-[#546E7A]">{result.engineUsed}</p>
            </div>
          )}

          <div className="pt-2 border-t border-[#E0E0E0]">
            <h3 className="font-display font-semibold text-sm text-[#263238] mb-2">
              Damage History ({damageDetections.length})
            </h3>
            <div className="space-y-2">
              {damageDetections.map((d) => (
                <div key={d.id} className="text-xs flex justify-between py-1.5 border-b border-[#E0E0E0] last:border-0">
                  <span>{d.damageCategory} ({d.detectionCount} box)</span>
                  <span className="font-mono tabular-nums">{d.confidence}% · {d.severity}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-3">
          <h2 className="font-display font-semibold text-base text-[#263238]">
            Annotated YOLOv8 Bounding-Box Output
          </h2>
          <canvas
            ref={canvasRef}
            data-testid="damage-canvas"
            className="w-full rounded-lg border border-[#E0E0E0] bg-[#F5F7F5]"
          />
        </div>
      </div>
    </WorkspaceLayout>
  );
}

// 3. Random Forest Crop Recommendation Page
export function CropRecommendationPage() {
  const { farms, cropRecommendations, logCropRecommendation } = useAgri();
  const [form, setForm] = useState({
    nitrogen: '130',
    phosphorus: '55',
    potassium: '98',
    temperature: '28',
    humidity: '68',
    ph: '6.7',
    rainfall: '1150',
    soilType: 'Black Cotton Soil',
  });
  const [prediction, setPrediction] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        nitrogen: Number(form.nitrogen),
        phosphorus: Number(form.phosphorus),
        potassium: Number(form.potassium),
        temperature: Number(form.temperature),
        humidity: Number(form.humidity),
        ph: Number(form.ph),
        rainfall: Number(form.rainfall),
        soilType: form.soilType,
      };
      const res = await fetch('/api/ai/crop-recommendation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      setPrediction(data);
      await logCropRecommendation({
        farmId: farms[0]?.id || '',
        recommendedCrop: data.recommendedCrop,
        confidence: data.confidence,
        nitrogen: payload.nitrogen,
        phosphorus: payload.phosphorus,
        potassium: payload.potassium,
        ph: payload.ph,
        rainfall: payload.rainfall,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <WorkspaceLayout
      title="Random Forest Crop Recommendation"
      subtitle="NPK, soil pH, temperature, humidity, and rainfall suitability analysis"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-[#E0E0E0] rounded-xl p-5">
          <h2 className="font-display font-semibold text-base text-[#263238] mb-3">
            Soil &amp; Climate Inputs
          </h2>
          <form onSubmit={handlePredict} className="grid grid-cols-2 gap-3">
            {[
              { id: 'rf-n', key: 'nitrogen', label: 'Nitrogen (kg/ha)' },
              { id: 'rf-p', key: 'phosphorus', label: 'Phosphorus (kg/ha)' },
              { id: 'rf-k', key: 'potassium', label: 'Potassium (kg/ha)' },
              { id: 'rf-ph', key: 'ph', label: 'Soil pH' },
              { id: 'rf-temp', key: 'temperature', label: 'Temperature (°C)' },
              { id: 'rf-hum', key: 'humidity', label: 'Humidity (%)' },
              { id: 'rf-rain', key: 'rainfall', label: 'Annual Rainfall (mm)' },
            ].map((fld) => (
              <div key={fld.key}>
                <label htmlFor={fld.id} className="block text-xs font-medium mb-1">
                  {fld.label}
                </label>
                <input
                  id={fld.id}
                  type="number"
                  step="0.1"
                  value={(form as any)[fld.key]}
                  onChange={(e) => setForm({ ...form, [fld.key]: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg font-mono tabular-nums"
                />
              </div>
            ))}
            <div>
              <label htmlFor="rf-soil" className="block text-xs font-medium mb-1">
                Soil Type
              </label>
              <select
                id="rf-soil"
                value={form.soilType}
                onChange={(e) => setForm({ ...form, soilType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
              >
                <option>Black Cotton Soil</option>
                <option>Medium Black</option>
                <option>Loamy</option>
                <option>Clay</option>
                <option>Red Soil</option>
                <option>Lateritic</option>
                <option>Sandy Loam</option>
              </select>
            </div>
            <div className="col-span-2 pt-1">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628]"
              >
                {loading ? 'Evaluating Decision Trees...' : 'Recommend Optimal Crop'}
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-base text-[#263238]">
              Recommendation Output &amp; Model Evaluation
            </h2>
            {prediction ? (
              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-[#E8F5E9] border border-[#66BB6A]">
                  <p className="text-xs text-[#2E7D32] font-medium">Top Recommended Crop</p>
                  <p className="font-display font-bold text-2xl text-[#263238] mt-0.5">
                    {prediction.recommendedCrop}{' '}
                    <span className="font-mono text-base text-[#2E7D32] tabular-nums">
                      ({prediction.confidence}% suitability)
                    </span>
                  </p>
                </div>

                <div className="space-y-2.5">
                  {prediction.topCandidates?.map((cand: any, idx: number) => (
                    <div key={cand.crop} className="p-3 rounded-lg bg-[#F5F7F5] border border-[#E0E0E0] text-xs space-y-1">
                      <div className="flex justify-between font-semibold text-sm">
                        <span>
                          {idx + 1}. {cand.crop} · {cand.season}
                        </span>
                        <span className="font-mono tabular-nums text-[#2E7D32]">{cand.confidence}%</span>
                      </div>
                      <p className="text-[#546E7A]">{cand.guidance}</p>
                      <p className="text-[#263238]">
                        Matched: {cand.matchedConditions?.join(', ') || 'Partial match'}
                      </p>
                    </div>
                  ))}
                </div>

                {prediction.modelInfo && (
                  <div className="pt-3 border-t border-[#E0E0E0] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <p className="text-[#546E7A]">Benchmark Accuracy</p>
                      <p className="font-mono font-semibold tabular-nums">{prediction.modelInfo.validationAccuracy}%</p>
                    </div>
                    <div>
                      <p className="text-[#546E7A]">Precision</p>
                      <p className="font-mono font-semibold tabular-nums">{prediction.modelInfo.macroPrecision}%</p>
                    </div>
                    <div>
                      <p className="text-[#546E7A]">Recall</p>
                      <p className="font-mono font-semibold tabular-nums">{prediction.modelInfo.macroRecall}%</p>
                    </div>
                    <div>
                      <p className="text-[#546E7A]">F1-Score</p>
                      <p className="font-mono font-semibold tabular-nums">{prediction.modelInfo.macroF1}%</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-[#546E7A]">
                Enter soil NPK, pH, rainfall, and climate readings on the left to compute Random Forest crop rankings.
              </p>
            )}
          </div>

          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
            <h3 className="font-display font-semibold text-base text-[#263238] mb-2">
              Saved Recommendations ({cropRecommendations.length})
            </h3>
            <div className="space-y-2 text-xs">
              {cropRecommendations.slice(0, 5).map((r) => (
                <div key={r.id} className="flex justify-between py-1.5 border-b border-[#E0E0E0] last:border-0">
                  <span className="font-medium">{r.recommendedCrop}</span>
                  <span className="font-mono text-[#546E7A] tabular-nums">
                    NPK {r.nitrogen}/{r.phosphorus}/{r.potassium} · pH {r.ph} · {r.confidence}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
