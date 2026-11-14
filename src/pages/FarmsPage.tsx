import React, { useState } from 'react';
import { Trash2, Pencil, Plus } from 'lucide-react';
import { WorkspaceLayout } from '../components/Layout';
import { useAgri } from '../context/AgriContext';
import { convertArea } from '../utils/agriMath';
import type { Farm } from '../types/agri';

const EMPTY_FORM = {
  farmName: '',
  satbaraNumber: '',
  surveyNumber: '',
  gatNumber: '',
  village: '',
  taluka: '',
  district: 'Pune',
  state: 'Maharashtra',
  areaValue: '2.5',
  areaUnit: 'Acres' as Farm['areaUnit'],
  soilType: 'Black Cotton Soil',
  waterSource: 'Borewell & Canal',
  irrigationMethod: 'Drip',
  latitude: '18.1517',
  longitude: '74.5767',
};

export function FarmsPage() {
  const { farms, plots, addFarm, updateFarm, deleteFarm, addPlot } = useAgri();
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formError, setFormError] = useState('');
  const [plotForm, setPlotForm] = useState({
    farmId: farms[0]?.id || '',
    plotName: '',
    areaAcres: '1.5',
    assignedCrop: 'Sugarcane',
    soilType: 'Black Cotton Soil',
  });

  const areaNum = Number(form.areaValue) || 0;

  const handleSubmitFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.farmName.trim() || !form.village.trim() || areaNum <= 0) {
      setFormError('Farm name, village, and positive land area are required.');
      return;
    }

    const payload = {
      farmName: form.farmName.trim(),
      satbaraNumber: form.satbaraNumber.trim(),
      surveyNumber: form.surveyNumber.trim(),
      gatNumber: form.gatNumber.trim(),
      village: form.village.trim(),
      taluka: form.taluka.trim(),
      district: form.district.trim(),
      state: form.state.trim(),
      areaValue: areaNum,
      areaUnit: form.areaUnit,
      soilType: form.soilType,
      waterSource: form.waterSource,
      irrigationMethod: form.irrigationMethod,
      latitude: Number(form.latitude) || 18.1517,
      longitude: Number(form.longitude) || 74.5767,
    };

    if (editingId) {
      await updateFarm(editingId, payload);
      setEditingId(null);
    } else {
      await addFarm(payload);
    }
    setForm(EMPTY_FORM);
  };

  const handleEdit = (farm: Farm) => {
    setEditingId(farm.id);
    setForm({
      farmName: farm.farmName,
      satbaraNumber: farm.satbaraNumber,
      surveyNumber: farm.surveyNumber,
      gatNumber: farm.gatNumber,
      village: farm.village,
      taluka: farm.taluka,
      district: farm.district,
      state: farm.state,
      areaValue: String(farm.areaValue),
      areaUnit: farm.areaUnit,
      soilType: farm.soilType,
      waterSource: farm.waterSource,
      irrigationMethod: farm.irrigationMethod,
      latitude: String(farm.latitude),
      longitude: String(farm.longitude),
    });
  };

  const handleSubmitPlot = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetFarmId = plotForm.farmId || farms[0]?.id;
    if (!targetFarmId || !plotForm.plotName.trim()) return;
    await addPlot({
      farmId: targetFarmId,
      plotName: plotForm.plotName.trim(),
      areaAcres: Math.max(0.1, Number(plotForm.areaAcres) || 1),
      assignedCrop: plotForm.assignedCrop,
      soilType: plotForm.soilType,
    });
    setPlotForm({ ...plotForm, plotName: '' });
  };

  return (
    <WorkspaceLayout
      title="Farms & Plots"
      subtitle="Register farms with Maharashtra 7/12 references, Acres/Hectares/Guntha units, and sub-plots"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Add / Edit Farm Form */}
        <div className="lg:col-span-5 bg-white border border-[#E0E0E0] rounded-xl p-5">
          <h2 className="font-display font-semibold text-base text-[#263238] mb-3">
            {editingId ? 'Edit Registered Farm' : 'Register New Farm'}
          </h2>
          {formError && (
            <p className="mb-3 text-xs text-[#E53935] font-medium">{formError}</p>
          )}
          <form onSubmit={handleSubmitFarm} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="farm-name" className="block text-xs font-medium mb-1">
                Farm Name
              </label>
              <input
                id="farm-name"
                type="text"
                value={form.farmName}
                onChange={(e) => setForm({ ...form, farmName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
                placeholder="e.g. Krishna River Sugarcane Plot"
              />
            </div>
            <div>
              <label htmlFor="farm-satbara" className="block text-xs font-medium mb-1">
                7/12 Number
              </label>
              <input
                id="farm-satbara"
                type="text"
                value={form.satbaraNumber}
                onChange={(e) => setForm({ ...form, satbaraNumber: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
                placeholder="7/12-MH-..."
              />
            </div>
            <div>
              <label htmlFor="farm-survey" className="block text-xs font-medium mb-1">
                Survey / Gat No.
              </label>
              <input
                id="farm-survey"
                type="text"
                value={form.gatNumber}
                onChange={(e) =>
                  setForm({ ...form, gatNumber: e.target.value, surveyNumber: e.target.value })
                }
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
                placeholder="e.g. 142/2A"
              />
            </div>
            <div>
              <label htmlFor="farm-village" className="block text-xs font-medium mb-1">
                Village
              </label>
              <input
                id="farm-village"
                type="text"
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="farm-taluka" className="block text-xs font-medium mb-1">
                Taluka
              </label>
              <input
                id="farm-taluka"
                type="text"
                value={form.taluka}
                onChange={(e) => setForm({ ...form, taluka: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="farm-district" className="block text-xs font-medium mb-1">
                District
              </label>
              <input
                id="farm-district"
                type="text"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="farm-state" className="block text-xs font-medium mb-1">
                State
              </label>
              <input
                id="farm-state"
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="farm-area" className="block text-xs font-medium mb-1">
                Land Area
              </label>
              <input
                id="farm-area"
                type="number"
                step="0.01"
                value={form.areaValue}
                onChange={(e) => setForm({ ...form, areaValue: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="farm-unit" className="block text-xs font-medium mb-1">
                Unit
              </label>
              <select
                id="farm-unit"
                value={form.areaUnit}
                onChange={(e) =>
                  setForm({ ...form, areaUnit: e.target.value as Farm['areaUnit'] })
                }
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
              >
                <option value="Acres">Acres</option>
                <option value="Hectares">Hectares</option>
                <option value="Guntha">Guntha</option>
              </select>
            </div>

            {areaNum > 0 && (
              <div className="sm:col-span-2 text-xs text-[#546E7A] bg-[#F5F7F5] px-3 py-2 rounded-lg font-mono tabular-nums">
                Equivalent: {convertArea(areaNum, form.areaUnit, 'Acres')} Acres ·{' '}
                {convertArea(areaNum, form.areaUnit, 'Hectares')} Ha ·{' '}
                {convertArea(areaNum, form.areaUnit, 'Guntha')} Guntha
              </div>
            )}

            <div>
              <label htmlFor="farm-soil" className="block text-xs font-medium mb-1">
                Soil Type
              </label>
              <select
                id="farm-soil"
                value={form.soilType}
                onChange={(e) => setForm({ ...form, soilType: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
              >
                <option>Black Cotton Soil</option>
                <option>Medium Black</option>
                <option>Red Soil</option>
                <option>Lateritic</option>
                <option>Loamy</option>
                <option>Clay Loam</option>
              </select>
            </div>
            <div>
              <label htmlFor="farm-irrigation" className="block text-xs font-medium mb-1">
                Irrigation Method
              </label>
              <select
                id="farm-irrigation"
                value={form.irrigationMethod}
                onChange={(e) => setForm({ ...form, irrigationMethod: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
              >
                <option>Drip</option>
                <option>Sprinkler</option>
                <option>Furrow / Canal</option>
                <option>Rainfed</option>
              </select>
            </div>
            <div>
              <label htmlFor="farm-lat" className="block text-xs font-medium mb-1">
                Latitude
              </label>
              <input
                id="farm-lat"
                type="number"
                step="0.0001"
                value={form.latitude}
                onChange={(e) => setForm({ ...form, latitude: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg font-mono"
              />
            </div>
            <div>
              <label htmlFor="farm-lng" className="block text-xs font-medium mb-1">
                Longitude
              </label>
              <input
                id="farm-lng"
                type="number"
                step="0.0001"
                value={form.longitude}
                onChange={(e) => setForm({ ...form, longitude: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg font-mono"
              />
            </div>

            <div className="sm:col-span-2 flex gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 px-4 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628]"
              >
                {editingId ? 'Save Farm Changes' : 'Add Farm'}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(null);
                    setForm(EMPTY_FORM);
                  }}
                  className="px-4 py-2.5 text-sm border border-[#E0E0E0] rounded-lg"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Registered Farms Table & Sub-Plots */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
            <h2 className="font-display font-semibold text-base text-[#263238] mb-3">
              Registered Farms ({farms.length})
            </h2>
            {farms.length === 0 ? (
              <p className="text-sm text-[#546E7A]">No farms registered yet. Add your first farm on the left.</p>
            ) : (
              <div className="space-y-3">
                {farms.map((farm) => (
                  <div
                    key={farm.id}
                    className="p-4 rounded-lg border border-[#E0E0E0] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <p className="font-display font-semibold text-sm text-[#263238]">
                        {farm.farmName}
                      </p>
                      <p className="text-xs text-[#546E7A] mt-0.5">
                        {farm.village}, Tal. {farm.taluka}, Dist. {farm.district} · 7/12:{' '}
                        <span className="font-mono">{farm.satbaraNumber || 'Pending'}</span>
                      </p>
                      <p className="text-xs text-[#546E7A] mt-1 font-mono tabular-nums">
                        {farm.areaValue} {farm.areaUnit} (
                        {convertArea(farm.areaValue, farm.areaUnit, 'Guntha')} Guntha) ·{' '}
                        {farm.soilType} · {farm.irrigationMethod}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleEdit(farm)}
                        aria-label={`Edit ${farm.farmName}`}
                        className="p-2 border border-[#E0E0E0] rounded-lg hover:bg-[#F5F7F5]"
                      >
                        <Pencil className="w-4 h-4 text-[#263238]" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteFarm(farm.id)}
                        aria-label={`Delete ${farm.farmName}`}
                        className="p-2 border border-[#E0E0E0] rounded-lg hover:bg-[#FFEBEE]"
                      >
                        <Trash2 className="w-4 h-4 text-[#E53935]" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Sub-Plots */}
          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-base text-[#263238]">
              Farm Plots &amp; Crop Assignments ({plots.length})
            </h2>
            <form onSubmit={handleSubmitPlot} className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              <select
                aria-label="Select farm for plot"
                value={plotForm.farmId || farms[0]?.id || ''}
                onChange={(e) => setPlotForm({ ...plotForm, farmId: e.target.value })}
                className="px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
              >
                {farms.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.farmName}
                  </option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Plot name (e.g. Block B2)"
                value={plotForm.plotName}
                onChange={(e) => setPlotForm({ ...plotForm, plotName: e.target.value })}
                className="px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
              <input
                type="number"
                step="0.1"
                placeholder="Acres"
                value={plotForm.areaAcres}
                onChange={(e) => setPlotForm({ ...plotForm, areaAcres: e.target.value })}
                className="px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg tabular-nums"
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628]"
              >
                <Plus className="w-4 h-4" />
                <span>Add Plot</span>
              </button>
            </form>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E0E0E0] text-[#546E7A]">
                    <th className="py-2 pr-3">Plot Name</th>
                    <th className="py-2 pr-3">Farm</th>
                    <th className="py-2 pr-3">Assigned Crop</th>
                    <th className="py-2 text-right">Area (Acres)</th>
                  </tr>
                </thead>
                <tbody>
                  {plots.map((p) => (
                    <tr key={p.id} className="border-b border-[#E0E0E0] last:border-0">
                      <td className="py-2.5 pr-3 font-medium text-[#263238]">{p.plotName}</td>
                      <td className="py-2.5 pr-3 text-[#546E7A]">
                        {farms.find((f) => f.id === p.farmId)?.farmName || p.farmId}
                      </td>
                      <td className="py-2.5 pr-3">{p.assignedCrop}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums">{p.areaAcres}</td>
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
