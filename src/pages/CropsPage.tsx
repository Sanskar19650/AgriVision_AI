import React, { useState } from 'react';
import { WorkspaceLayout } from '../components/Layout';
import { useAgri } from '../context/AgriContext';
import type { Crop } from '../types/agri';

const CROP_OPTIONS = [
  'Sugarcane',
  'Mango',
  'Banana',
  'Coconut',
  'Rice',
  'Wheat',
  'Cotton',
  'Soybean',
  'Maize',
  'Other',
];

const LIFECYCLE_STAGES = [
  'Land preparation',
  'Soil testing',
  'Seed selection',
  'Sowing',
  'Fertilizer application',
  'Irrigation',
  'Weed management',
  'Pest management',
  'Disease monitoring',
  'Crop growth',
  'Harvesting',
  'Production recording',
];

export function CropsPage() {
  const { farms, crops, cropActivities, addCrop, updateCrop, addCropActivity } = useAgri();

  const [form, setForm] = useState({
    farmId: farms[0]?.id || '',
    cropName: 'Sugarcane',
    variety: 'Co-86032',
    sowingDate: '2026-11-01',
    expectedHarvestDate: '2027-11-01',
    cultivationArea: '2.0',
    season: 'Kharif',
    seedQuantityKg: '1500',
  });

  const [actForm, setActForm] = useState({
    cropId: crops[0]?.id || '',
    stage: 'Fertilizer application',
    activityDate: new Date().toISOString().slice(0, 10),
    notes: '',
  });

  const handleAddCrop = async (e: React.FormEvent) => {
    e.preventDefault();
    const farmId = form.farmId || farms[0]?.id;
    if (!farmId) return;
    await addCrop({
      farmId,
      cropName: form.cropName,
      variety: form.variety,
      sowingDate: form.sowingDate,
      expectedHarvestDate: form.expectedHarvestDate,
      cultivationArea: Number(form.cultivationArea) || 1,
      season: form.season,
      seedQuantityKg: Number(form.seedQuantityKg) || 0,
      stage: 'Land preparation',
      healthStatus: 'Healthy',
      yieldTonnes: 0,
    });
  };

  const handleAddActivity = async (e: React.FormEvent) => {
    e.preventDefault();
    const crop = crops.find((c) => c.id === (actForm.cropId || crops[0]?.id));
    if (!crop || !actForm.notes.trim()) return;
    await addCropActivity({
      farmId: crop.farmId,
      cropId: crop.id,
      stage: actForm.stage,
      activityDate: actForm.activityDate,
      notes: actForm.notes.trim(),
    });
    await updateCrop(crop.id, {
      stage: actForm.stage,
      healthStatus: actForm.stage === 'Harvesting' ? 'Harvested' : crop.healthStatus,
    });
    setActForm({ ...actForm, notes: '' });
  };

  return (
    <WorkspaceLayout
      title="Crop Management & 12-Stage Lifecycle"
      subtitle="Track crop varieties, sowing & harvest dates, lifecycle milestones, and production yield"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Register Crop */}
          <div className="lg:col-span-5 bg-white border border-[#E0E0E0] rounded-xl p-5">
            <h2 className="font-display font-semibold text-base text-[#263238] mb-3">
              Register Crop Cycle
            </h2>
            <form onSubmit={handleAddCrop} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="crop-farm" className="block text-xs font-medium mb-1">
                  Farm
                </label>
                <select
                  id="crop-farm"
                  value={form.farmId || farms[0]?.id || ''}
                  onChange={(e) => setForm({ ...form, farmId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.farmName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="crop-name" className="block text-xs font-medium mb-1">
                  Crop
                </label>
                <select
                  id="crop-name"
                  value={form.cropName}
                  onChange={(e) => setForm({ ...form, cropName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
                >
                  {CROP_OPTIONS.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="crop-variety" className="block text-xs font-medium mb-1">
                  Variety
                </label>
                <input
                  id="crop-variety"
                  type="text"
                  value={form.variety}
                  onChange={(e) => setForm({ ...form, variety: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="crop-sow" className="block text-xs font-medium mb-1">
                  Sowing Date
                </label>
                <input
                  id="crop-sow"
                  type="date"
                  value={form.sowingDate}
                  onChange={(e) => setForm({ ...form, sowingDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="crop-harvest" className="block text-xs font-medium mb-1">
                  Expected Harvest
                </label>
                <input
                  id="crop-harvest"
                  type="date"
                  value={form.expectedHarvestDate}
                  onChange={(e) => setForm({ ...form, expectedHarvestDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
                />
              </div>
              <div>
                <label htmlFor="crop-area" className="block text-xs font-medium mb-1">
                  Area (Acres)
                </label>
                <input
                  id="crop-area"
                  type="number"
                  step="0.1"
                  value={form.cultivationArea}
                  onChange={(e) => setForm({ ...form, cultivationArea: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg tabular-nums"
                />
              </div>
              <div>
                <label htmlFor="crop-season" className="block text-xs font-medium mb-1">
                  Season
                </label>
                <select
                  id="crop-season"
                  value={form.season}
                  onChange={(e) => setForm({ ...form, season: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
                >
                  <option>Kharif</option>
                  <option>Rabi</option>
                  <option>Zaid / Summer</option>
                  <option>Adsali</option>
                  <option>Perennial</option>
                </select>
              </div>
              <div className="sm:col-span-2 pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628]"
                >
                  Register Crop
                </button>
              </div>
            </form>
          </div>

          {/* Log Activity / Lifecycle Update */}
          <div className="lg:col-span-7 bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-base text-[#263238]">
              12-Stage Lifecycle &amp; Activity History
            </h2>

            <form onSubmit={handleAddActivity} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                aria-label="Select crop for activity"
                value={actForm.cropId || crops[0]?.id || ''}
                onChange={(e) => setActForm({ ...actForm, cropId: e.target.value })}
                className="px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
              >
                {crops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.cropName} ({c.variety})
                  </option>
                ))}
              </select>
              <select
                aria-label="Select lifecycle stage"
                value={actForm.stage}
                onChange={(e) => setActForm({ ...actForm, stage: e.target.value })}
                className="px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
              >
                {LIFECYCLE_STAGES.map((st, idx) => (
                  <option key={st} value={st}>
                    {idx + 1}. {st}
                  </option>
                ))}
              </select>
              <input
                type="date"
                aria-label="Activity date"
                value={actForm.activityDate}
                onChange={(e) => setActForm({ ...actForm, activityDate: e.target.value })}
                className="px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
              <input
                type="text"
                placeholder="Notes (e.g. Applied 50 kg Urea, weeding completed...)"
                value={actForm.notes}
                onChange={(e) => setActForm({ ...actForm, notes: e.target.value })}
                className="sm:col-span-2 px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628]"
              >
                Log Activity
              </button>
            </form>

            <div className="space-y-2 max-h-60 overflow-y-auto pt-2 border-t border-[#E0E0E0]">
              {cropActivities.map((act) => {
                const crop = crops.find((c) => c.id === act.cropId);
                return (
                  <div key={act.id} className="p-3 rounded-lg bg-[#F5F7F5] border border-[#E0E0E0] text-xs">
                    <div className="flex justify-between font-medium">
                      <span className="text-[#263238]">
                        {crop?.cropName || 'Crop'} · {act.stage}
                      </span>
                      <span className="font-mono text-[#546E7A] tabular-nums">{act.activityDate}</span>
                    </div>
                    <p className="text-[#546E7A] mt-1">{act.notes}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Crops Table */}
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
          <h2 className="font-display font-semibold text-base text-[#263238] mb-3">
            Registered Crops ({crops.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E0E0E0] text-[#546E7A]">
                  <th className="py-2 pr-3">Crop &amp; Variety</th>
                  <th className="py-2 pr-3">Farm</th>
                  <th className="py-2 pr-3">Season</th>
                  <th className="py-2 pr-3">Current Stage</th>
                  <th className="py-2 pr-3">Health</th>
                  <th className="py-2 text-right">Area (Ac)</th>
                  <th className="py-2 text-right">Yield (t)</th>
                </tr>
              </thead>
              <tbody>
                {crops.map((c) => (
                  <tr key={c.id} className="border-b border-[#E0E0E0] last:border-0">
                    <td className="py-2.5 pr-3 font-medium text-[#263238]">
                      {c.cropName} · <span className="text-[#546E7A]">{c.variety}</span>
                    </td>
                    <td className="py-2.5 pr-3 text-[#546E7A]">
                      {farms.find((f) => f.id === c.farmId)?.farmName || c.farmId}
                    </td>
                    <td className="py-2.5 pr-3">{c.season}</td>
                    <td className="py-2.5 pr-3">{c.stage}</td>
                    <td className="py-2.5 pr-3">
                      <select
                        aria-label={`Health status for ${c.cropName}`}
                        value={c.healthStatus}
                        disabled={c.healthStatus === 'Harvested'}
                        onChange={(e) =>
                          updateCrop(c.id, { healthStatus: e.target.value as Crop['healthStatus'] })
                        }
                        className="px-2 py-1 border border-[#E0E0E0] rounded bg-white text-xs"
                      >
                        <option value="Healthy">Healthy</option>
                        <option value="Monitor">Monitor</option>
                        <option value="At Risk">At Risk</option>
                        <option value="Harvested">Harvested</option>
                      </select>
                    </td>
                    <td className="py-2.5 text-right font-mono tabular-nums">{c.cultivationArea}</td>
                    <td className="py-2.5 text-right font-mono tabular-nums">{c.yieldTonnes || 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}
