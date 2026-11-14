import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { RefreshCw, Database } from 'lucide-react';
import { WorkspaceLayout } from '../components/Layout';
import { useAgri } from '../context/AgriContext';
import { convertArea, shouldAutoStoreWeather, suggestIrrigation } from '../utils/agriMath';

// 1. Weather Monitoring Page
export function WeatherPage() {
  const { farms, weatherRecords, addWeatherRecord } = useAgri();
  const [selectedFarmId, setSelectedFarmId] = useState(farms[0]?.id || '');
  const [weather, setWeather] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [storeNotice, setStoreNotice] = useState('');
  const autoStoredFarmsRef = useRef<Set<string>>(new Set());

  const selectedFarm = farms.find((f) => f.id === selectedFarmId) || farms[0];

  const persistSnapshot = useCallback(
    async (data: any, farmId: string, label: string) => {
      if (!data?.current || !farmId) return;
      await addWeatherRecord({
        farmId,
        temperatureC: Number(data.current.temperatureC),
        humidity: Number(data.current.humidity),
        windSpeedKmh: Number(data.current.windSpeedKmh),
        rainProbabilityPct: Number(data.current.rainProbabilityPct ?? 0),
        condition: String(data.current.condition || 'Clear'),
        source: String(data.source || 'Open-Meteo Live Meteorological API'),
      });
      setStoreNotice(label);
    },
    [addWeatherRecord]
  );

  const fetchWeatherForFarm = useCallback(
    async (forceStore: boolean) => {
      const lat = selectedFarm?.latitude ?? 18.1517;
      const lon = selectedFarm?.longitude ?? 74.5767;
      const farmId = selectedFarm?.id;
      if (forceStore) setSaving(true);
      try {
        const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
        const data = await res.json();
        setWeather(data);
        if (farmId && data?.current) {
          if (forceStore) {
            await persistSnapshot(
              data,
              farmId,
              `Live weather snapshot stored for ${selectedFarm?.farmName || 'farm'} (${data.current.temperatureC}°C, ${data.current.condition}).`
            );
          } else if (
            !autoStoredFarmsRef.current.has(farmId) &&
            shouldAutoStoreWeather(weatherRecords, farmId)
          ) {
            autoStoredFarmsRef.current.add(farmId);
            await persistSnapshot(
              data,
              farmId,
              `Auto-stored live weather reading (${data.current.temperatureC}°C, ${data.current.humidity}% RH).`
            );
          }
        }
      } catch {
        // Retain prior view if offline
      } finally {
        if (forceStore) setSaving(false);
      }
    },
    [selectedFarm?.id, selectedFarm?.latitude, selectedFarm?.longitude, selectedFarm?.farmName, persistSnapshot, weatherRecords]
  );

  useEffect(() => {
    fetchWeatherForFarm(false);
  }, [selectedFarm?.id, selectedFarm?.latitude, selectedFarm?.longitude]);

  const farmHistory = selectedFarm
    ? weatherRecords.filter((w) => w.farmId === selectedFarm.id)
    : weatherRecords;
  const chartData = [...farmHistory]
    .slice(0, 12)
    .reverse()
    .map((r) => ({
      time: r.createdAt ? r.createdAt.slice(11, 16) : '',
      tempC: r.temperatureC,
      humidity: r.humidity,
    }));

  return (
    <WorkspaceLayout
      title="Weather Monitoring & Farm Advisories"
      subtitle="Live Open-Meteo meteorological forecast automatically persisted to farm weather history"
    >
      <div className="space-y-6">
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[#546E7A]">Selected Farm Location</p>
            <p className="font-display font-semibold text-base text-[#263238]">
              {selectedFarm
                ? `${selectedFarm.farmName} (${selectedFarm.village}, ${selectedFarm.district})`
                : 'Baramati, Maharashtra'}
            </p>
            {storeNotice && (
              <p className="text-xs text-[#2E7D32] font-medium mt-1">{storeNotice}</p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Choose farm for weather"
              value={selectedFarm?.id || ''}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              className="px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
            >
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.farmName}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => fetchWeatherForFarm(true)}
              disabled={saving || !selectedFarm}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#2E7D32] text-white rounded-lg hover:bg-[#246628] disabled:opacity-60"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Storing Live Weather...' : 'Refresh & Store Live Weather'}
            </button>
          </div>
        </div>

        {weather && (
          <>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-white border border-[#E0E0E0] rounded-xl p-4">
                <p className="text-xs text-[#546E7A]">Temperature</p>
                <p className="font-mono font-bold text-2xl tabular-nums mt-1">{weather.current.temperatureC}°C</p>
              </div>
              <div className="bg-white border border-[#E0E0E0] rounded-xl p-4">
                <p className="text-xs text-[#546E7A]">Humidity</p>
                <p className="font-mono font-bold text-2xl tabular-nums mt-1">{weather.current.humidity}%</p>
              </div>
              <div className="bg-white border border-[#E0E0E0] rounded-xl p-4">
                <p className="text-xs text-[#546E7A]">Wind Speed</p>
                <p className="font-mono font-bold text-2xl tabular-nums mt-1">{weather.current.windSpeedKmh} km/h</p>
              </div>
              <div className="bg-white border border-[#E0E0E0] rounded-xl p-4">
                <p className="text-xs text-[#546E7A]">Rain Probability</p>
                <p className="font-mono font-bold text-2xl tabular-nums mt-1">{weather.current.rainProbabilityPct}%</p>
              </div>
              <div className="bg-white border border-[#E0E0E0] rounded-xl p-4">
                <p className="text-xs text-[#546E7A]">Condition</p>
                <p className="font-display font-bold text-lg mt-1 text-[#2E7D32]">{weather.current.condition}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { title: 'Irrigation Guidance', body: weather.advisories.irrigation },
                { title: 'Fertilizer Application', body: weather.advisories.fertilizer },
                { title: 'Spraying Window', body: weather.advisories.spraying },
                { title: 'Harvesting Operations', body: weather.advisories.harvesting },
              ].map((adv) => (
                <div key={adv.title} className="bg-white border border-[#E0E0E0] rounded-xl p-4">
                  <p className="font-display font-semibold text-sm text-[#263238]">{adv.title}</p>
                  <p className="text-xs text-[#546E7A] mt-1.5 leading-relaxed">{adv.body}</p>
                </div>
              ))}
            </div>

            <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-display font-semibold text-base text-[#263238]">
                  Multi-Day Forecast
                </h2>
                <span className="text-xs text-[#546E7A]">{weather.source}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#E0E0E0] text-[#546E7A]">
                      <th className="py-2 pr-3">Date</th>
                      <th className="py-2 pr-3">Condition</th>
                      <th className="py-2 pr-3">Min / Max (°C)</th>
                      <th className="py-2 pr-3">Rain Prob</th>
                      <th className="py-2 text-right">Precipitation (mm)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weather.forecast?.map((d: any) => (
                      <tr key={d.date} className="border-b border-[#E0E0E0] last:border-0">
                        <td className="py-2 pr-3 font-mono">{d.date}</td>
                        <td className="py-2 pr-3">{d.condition}</td>
                        <td className="py-2 pr-3 font-mono tabular-nums">
                          {d.tempMin}° / {d.tempMax}°
                        </td>
                        <td className="py-2 pr-3 font-mono tabular-nums">{d.rainProb}%</td>
                        <td className="py-2 text-right font-mono tabular-nums">{d.rainMm}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* Stored Live Weather Snapshots (Persisted in Firestore / Sandbox) */}
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Database className="w-4 h-4 text-[#2E7D32]" />
              <h2 className="font-display font-semibold text-base text-[#263238]">
                Stored Live Weather History ({weatherRecords.length})
              </h2>
            </div>
            <span className="text-xs text-[#546E7A]">
              Live readings are saved automatically on load and via Refresh &amp; Store
            </span>
          </div>

          {chartData.length > 0 && (
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="time" tick={{ fontSize: 11, fill: '#546E7A' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#546E7A' }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="tempC" stroke="#2E7D32" strokeWidth={2} name="Temp (°C)" />
                  <Line type="monotone" dataKey="humidity" stroke="#1E88E5" strokeWidth={2} name="Humidity (%)" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E0E0E0] text-[#546E7A]">
                  <th className="py-2 pr-3">Recorded At</th>
                  <th className="py-2 pr-3">Farm</th>
                  <th className="py-2 pr-3">Temp</th>
                  <th className="py-2 pr-3">Humidity</th>
                  <th className="py-2 pr-3">Wind</th>
                  <th className="py-2 pr-3">Rain Prob</th>
                  <th className="py-2 pr-3">Condition</th>
                  <th className="py-2">Source</th>
                </tr>
              </thead>
              <tbody>
                {weatherRecords.map((w) => {
                  const farmName = farms.find((f) => f.id === w.farmId)?.farmName || w.farmId;
                  return (
                    <tr key={w.id} className="border-b border-[#E0E0E0] last:border-0">
                      <td className="py-2 pr-3 font-mono whitespace-nowrap">
                        {w.createdAt ? w.createdAt.slice(0, 16).replace('T', ' ') : '—'}
                      </td>
                      <td className="py-2 pr-3 font-medium">{farmName}</td>
                      <td className="py-2 pr-3 font-mono tabular-nums">{w.temperatureC}°C</td>
                      <td className="py-2 pr-3 font-mono tabular-nums">{w.humidity}%</td>
                      <td className="py-2 pr-3 font-mono tabular-nums">{w.windSpeedKmh} km/h</td>
                      <td className="py-2 pr-3 font-mono tabular-nums">
                        {typeof w.rainProbabilityPct === 'number' ? `${w.rainProbabilityPct}%` : '—'}
                      </td>
                      <td className="py-2 pr-3">{w.condition}</td>
                      <td className="py-2 text-[#546E7A]">{w.source || 'Open-Meteo API'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}

// 2. Irrigation Management Page
export function IrrigationPage() {
  const { farms, soilReadings, irrigationRecords, addIrrigation, updateIrrigationStatus } = useAgri();
  const [form, setForm] = useState({
    farmId: farms[0]?.id || '',
    method: 'Drip',
    waterLiters: '15000',
    durationMinutes: '60',
    scheduledDate: new Date().toISOString().slice(0, 10),
  });

  const targetFarm = farms.find((f) => f.id === (form.farmId || farms[0]?.id)) || farms[0];
  const latestSoil = soilReadings.find((s) => s.farmId === targetFarm?.id) || soilReadings[0];
  const suggestion = suggestIrrigation({
    moisturePct: latestSoil?.moisture ?? 42,
    areaAcres: targetFarm ? convertArea(targetFarm.areaValue, targetFarm.areaUnit, 'Acres') : 2,
    rainProbabilityPct: 15,
    method: form.method,
  });

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetFarm) return;
    await addIrrigation({
      farmId: targetFarm.id,
      method: form.method,
      waterLiters: Math.max(100, Number(form.waterLiters) || 10000),
      durationMinutes: Math.max(5, Number(form.durationMinutes) || 45),
      scheduledDate: form.scheduledDate,
      status: 'scheduled',
    });
  };

  return (
    <WorkspaceLayout
      title="Irrigation Management"
      subtitle="Soil moisture alerts, scheduling, water consumption logs, and pump safety readiness"
    >
      <div className="space-y-6">
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-[#2E7D32]">
              Irrigation Advisory · {suggestion.urgency}
            </p>
            <p className="font-display font-semibold text-base text-[#263238] mt-0.5">
              {suggestion.suggestedWindow}
            </p>
            <p className="text-xs text-[#546E7A] mt-1">{suggestion.reason}</p>
          </div>
          {suggestion.shouldIrrigate && (
            <div className="text-right shrink-0">
              <p className="text-xs text-[#546E7A]">Suggested Volume</p>
              <p className="font-mono font-bold text-lg tabular-nums text-[#2E7D32]">
                {suggestion.recommendedLiters.toLocaleString()} L ({suggestion.suggestedDurationMinutes} min)
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4 bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-base text-[#263238]">
              Schedule Irrigation Cycle
            </h2>
            <form onSubmit={handleSchedule} className="space-y-3">
              <div>
                <label htmlFor="irr-farm" className="block text-xs font-medium mb-1">
                  Farm
                </label>
                <select
                  id="irr-farm"
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
                <label htmlFor="irr-method" className="block text-xs font-medium mb-1">
                  Method
                </label>
                <select
                  id="irr-method"
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
                >
                  <option>Drip</option>
                  <option>Sprinkler</option>
                  <option>Furrow / Canal</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="irr-liters" className="block text-xs font-medium mb-1">
                    Water (Liters)
                  </label>
                  <input
                    id="irr-liters"
                    type="number"
                    value={form.waterLiters}
                    onChange={(e) => setForm({ ...form, waterLiters: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg font-mono tabular-nums"
                  />
                </div>
                <div>
                  <label htmlFor="irr-dur" className="block text-xs font-medium mb-1">
                    Duration (min)
                  </label>
                  <input
                    id="irr-dur"
                    type="number"
                    value={form.durationMinutes}
                    onChange={(e) => setForm({ ...form, durationMinutes: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg font-mono tabular-nums"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="irr-date" className="block text-xs font-medium mb-1">
                  Scheduled Date
                </label>
                <input
                  id="irr-date"
                  type="date"
                  value={form.scheduledDate}
                  onChange={(e) => setForm({ ...form, scheduledDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628]"
              >
                Save Schedule
              </button>
            </form>
            <p className="text-[11px] text-[#546E7A] pt-2 border-t border-[#E0E0E0]">
              Hardware Safety Note: Automated pump relay actuation requires physical flow/pressure interlock verification and is disabled in software-only mode.
            </p>
          </div>

          <div className="lg:col-span-8 bg-white border border-[#E0E0E0] rounded-xl p-5">
            <h2 className="font-display font-semibold text-base text-[#263238] mb-3">
              Irrigation History &amp; Queue ({irrigationRecords.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E0E0E0] text-[#546E7A]">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Farm</th>
                    <th className="py-2 pr-3">Method</th>
                    <th className="py-2 pr-3">Water (L)</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {irrigationRecords.map((r) => (
                    <tr key={r.id} className="border-b border-[#E0E0E0] last:border-0">
                      <td className="py-2.5 pr-3 font-mono">{r.scheduledDate}</td>
                      <td className="py-2.5 pr-3">
                        {farms.find((f) => f.id === r.farmId)?.farmName || r.farmId}
                      </td>
                      <td className="py-2.5 pr-3">{r.method}</td>
                      <td className="py-2.5 pr-3 font-mono tabular-nums">
                        {r.waterLiters.toLocaleString()}
                      </td>
                      <td className="py-2.5 pr-3 capitalize font-medium">{r.status}</td>
                      <td className="py-2.5 text-right">
                        {r.status === 'scheduled' ? (
                          <button
                            type="button"
                            onClick={() => updateIrrigationStatus(r.id, 'completed')}
                            className="px-2.5 py-1 bg-[#E8F5E9] text-[#2E7D32] rounded font-semibold hover:bg-[#C8E6C9]"
                          >
                            Mark Completed
                          </button>
                        ) : (
                          <span className="text-[#546E7A]">Locked</span>
                        )}
                      </td>
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

// 3. Fertilizer & Pesticide Management Page
export function FertilizerPage() {
  const { farms, fertilizerRecords, addFertilizer } = useAgri();
  const [form, setForm] = useState({
    farmId: farms[0]?.id || '',
    productName: '',
    category: 'Organic fertilizer',
    quantity: '50 kg',
    applicationDate: new Date().toISOString().slice(0, 10),
    applicationMethod: 'Drip Fertigation',
    cropName: 'Sugarcane',
    costInr: '1800',
    notes: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const farmId = form.farmId || farms[0]?.id;
    if (!farmId || !form.productName.trim()) return;
    await addFertilizer({
      farmId,
      productName: form.productName.trim(),
      category: form.category,
      quantity: form.quantity.trim(),
      applicationDate: form.applicationDate,
      applicationMethod: form.applicationMethod,
      cropName: form.cropName,
      costInr: Math.max(0, Number(form.costInr) || 0),
      notes: form.notes.trim(),
    });
    setForm({ ...form, productName: '', notes: '' });
  };

  const totalExpense = fertilizerRecords.reduce((s, r) => s + r.costInr, 0);
  const byCategory = Object.entries(
    fertilizerRecords.reduce<Record<string, number>>((acc, r) => {
      acc[r.category] = (acc[r.category] || 0) + r.costInr;
      return acc;
    }, {})
  ).map(([category, spend]) => ({ category, spend }));

  return (
    <WorkspaceLayout
      title="Fertilizer & Pesticide Management"
      subtitle="Track organic, chemical, biofertilizer, and crop protection applications and expenses"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white border border-[#E0E0E0] rounded-xl p-5">
          <h2 className="font-display font-semibold text-base text-[#263238] mb-3">
            Record Input Application
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <label htmlFor="fert-farm" className="block text-xs font-medium mb-1">
                Farm
              </label>
              <select
                id="fert-farm"
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
            <div className="sm:col-span-2">
              <label htmlFor="fert-prod" className="block text-xs font-medium mb-1">
                Product Name
              </label>
              <input
                id="fert-prod"
                type="text"
                value={form.productName}
                onChange={(e) => setForm({ ...form, productName: e.target.value })}
                placeholder="e.g. Neem Cake / NPK 19:19:19"
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="fert-cat" className="block text-xs font-medium mb-1">
                Category
              </label>
              <select
                id="fert-cat"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
              >
                <option>Organic fertilizer</option>
                <option>Chemical fertilizer</option>
                <option>Biofertilizer</option>
                <option>Pesticide</option>
                <option>Fungicide</option>
                <option>Herbicide</option>
              </select>
            </div>
            <div>
              <label htmlFor="fert-qty" className="block text-xs font-medium mb-1">
                Quantity
              </label>
              <input
                id="fert-qty"
                type="text"
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="fert-crop" className="block text-xs font-medium mb-1">
                Target Crop
              </label>
              <input
                id="fert-crop"
                type="text"
                value={form.cropName}
                onChange={(e) => setForm({ ...form, cropName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="fert-cost" className="block text-xs font-medium mb-1">
                Cost (INR ₹)
              </label>
              <input
                id="fert-cost"
                type="number"
                value={form.costInr}
                onChange={(e) => setForm({ ...form, costInr: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg font-mono tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="fert-date" className="block text-xs font-medium mb-1">
                Application Date
              </label>
              <input
                id="fert-date"
                type="date"
                value={form.applicationDate}
                onChange={(e) => setForm({ ...form, applicationDate: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="fert-method" className="block text-xs font-medium mb-1">
                Method
              </label>
              <input
                id="fert-method"
                type="text"
                value={form.applicationMethod}
                onChange={(e) => setForm({ ...form, applicationMethod: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div className="sm:col-span-2 pt-1">
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628]"
              >
                Save Input Application
              </button>
            </div>
          </form>
        </div>

        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="font-display font-semibold text-base text-[#263238]">
                Input Expense Breakdown
              </h2>
              <span className="font-mono font-bold text-base text-[#2E7D32] tabular-nums">
                Total: ₹{totalExpense.toLocaleString()}
              </span>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byCategory}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="category" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="spend" name="Expense (₹)" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
            <h2 className="font-display font-semibold text-base text-[#263238] mb-3">
              Application Ledger ({fertilizerRecords.length})
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E0E0E0] text-[#546E7A]">
                    <th className="py-2 pr-3">Date</th>
                    <th className="py-2 pr-3">Product</th>
                    <th className="py-2 pr-3">Category</th>
                    <th className="py-2 pr-3">Quantity</th>
                    <th className="py-2 text-right">Cost (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {fertilizerRecords.map((r) => (
                    <tr key={r.id} className="border-b border-[#E0E0E0] last:border-0">
                      <td className="py-2 pr-3 font-mono">{r.applicationDate}</td>
                      <td className="py-2 pr-3 font-medium">{r.productName}</td>
                      <td className="py-2 pr-3">{r.category}</td>
                      <td className="py-2 pr-3">{r.quantity}</td>
                      <td className="py-2 text-right font-mono tabular-nums">
                        ₹{r.costInr.toLocaleString()}
                      </td>
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
