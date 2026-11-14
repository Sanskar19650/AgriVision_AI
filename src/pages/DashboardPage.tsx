import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { WorkspaceLayout } from '../components/Layout';
import { useAgri } from '../context/AgriContext';
import { convertArea, evaluateSoilHealth, shouldAutoStoreWeather } from '../utils/agriMath';

export function DashboardPage() {
  const {
    farms,
    crops,
    soilReadings,
    iotDevices,
    cropActivities,
    notifications,
    irrigationRecords,
    diseaseDetections,
    cropRecommendations,
    weatherRecords,
    addWeatherRecord,
  } = useAgri();

  const latestStoredWx = weatherRecords[0];
  const [weather, setWeather] = useState<{
    temperatureC: number;
    humidity: number;
    windSpeedKmh: number;
    condition: string;
    rainProb: number;
    source: string;
  } | null>(() =>
    latestStoredWx
      ? {
          temperatureC: latestStoredWx.temperatureC,
          humidity: latestStoredWx.humidity,
          windSpeedKmh: latestStoredWx.windSpeedKmh,
          condition: latestStoredWx.condition,
          rainProb: latestStoredWx.rainProbabilityPct ?? 10,
          source: latestStoredWx.source || 'Stored Farm Weather',
        }
      : null
  );

  useEffect(() => {
    const primary = farms[0];
    const lat = primary?.latitude ?? 18.1517;
    const lon = primary?.longitude ?? 74.5767;
    fetch(`/api/weather?lat=${lat}&lon=${lon}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.current) {
          setWeather({
            temperatureC: d.current.temperatureC,
            humidity: d.current.humidity,
            windSpeedKmh: d.current.windSpeedKmh,
            condition: d.current.condition,
            rainProb: d.current.rainProbabilityPct,
            source: d.source,
          });
          if (primary?.id && shouldAutoStoreWeather(weatherRecords, primary.id)) {
            addWeatherRecord({
              farmId: primary.id,
              temperatureC: Number(d.current.temperatureC),
              humidity: Number(d.current.humidity),
              windSpeedKmh: Number(d.current.windSpeedKmh),
              rainProbabilityPct: Number(d.current.rainProbabilityPct ?? 0),
              condition: String(d.current.condition || 'Clear'),
              source: String(d.source || 'Open-Meteo Live Meteorological API'),
            }).catch(() => {});
          }
        }
      })
      .catch(() => {});
  }, [farms[0]?.id]);

  const totalAcres = farms.reduce(
    (sum, f) => sum + convertArea(f.areaValue, f.areaUnit, 'Acres'),
    0
  );
  const activeCrops = crops.filter((c) => c.healthStatus !== 'Harvested');
  const totalYieldTonnes = crops.reduce((sum, c) => sum + (c.yieldTonnes || 0), 0);

  const latestSoil = soilReadings[0];
  const soilEval = latestSoil
    ? evaluateSoilHealth({
        moisture: latestSoil.moisture,
        ph: latestSoil.ph,
        nitrogen: latestSoil.nitrogen,
        phosphorus: latestSoil.phosphorus,
        potassium: latestSoil.potassium,
        temperature: latestSoil.temperature,
        ec: latestSoil.ec,
      })
    : null;

  const soilChartData = [...soilReadings]
    .slice(0, 8)
    .reverse()
    .map((r, i) => ({
      label: r.createdAt ? r.createdAt.slice(5, 10) : `R${i + 1}`,
      moisture: r.moisture,
      nitrogen: r.nitrogen,
      phosphorus: r.phosphorus,
      potassium: r.potassium,
    }));

  const cropHealthData = crops.map((c) => ({
    name: c.cropName,
    area: c.cultivationArea,
    yieldTonnes: c.yieldTonnes || 0,
  }));

  const pendingTasks = irrigationRecords.filter((r) => r.status === 'scheduled');
  const latestRec = cropRecommendations[0];
  const latestDis = diseaseDetections[0];

  return (
    <WorkspaceLayout
      title="Farmer Dashboard"
      subtitle="Live overview of registered farms, soil telemetry, crop growth, weather, and AI advisories"
    >
      <div className="space-y-6">
        {/* Top KPI Strip */}
        <section aria-label="Agricultural statistics" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white border border-[#E0E0E0] rounded-xl p-4">
            <p className="text-xs text-[#546E7A] font-medium">Registered Farms</p>
            <p className="mt-1 font-display font-bold text-2xl text-[#263238] tabular-nums">
              {farms.length}
            </p>
            <p className="text-xs text-[#546E7A] mt-1 font-mono tabular-nums">
              {totalAcres.toFixed(2)} Acres total
            </p>
          </div>

          <div className="bg-white border border-[#E0E0E0] rounded-xl p-4">
            <p className="text-xs text-[#546E7A] font-medium">Active Crops</p>
            <p className="mt-1 font-display font-bold text-2xl text-[#263238] tabular-nums">
              {activeCrops.length}
            </p>
            <p className="text-xs text-[#2E7D32] mt-1 font-mono tabular-nums">
              {totalYieldTonnes.toFixed(1)} t recorded yield
            </p>
          </div>

          <div className="bg-white border border-[#E0E0E0] rounded-xl p-4">
            <p className="text-xs text-[#546E7A] font-medium">Latest Soil Moisture &amp; pH</p>
            <p className="mt-1 font-display font-bold text-2xl text-[#263238] tabular-nums">
              {latestSoil ? `${latestSoil.moisture}%` : '—'}
            </p>
            <p className="text-xs text-[#546E7A] mt-1 font-mono tabular-nums">
              {latestSoil ? `pH ${latestSoil.ph} · ${latestSoil.source}` : 'No readings'}
            </p>
          </div>

          <div className="bg-white border border-[#E0E0E0] rounded-xl p-4">
            <p className="text-xs text-[#546E7A] font-medium">Weather &amp; Irrigation</p>
            <p className="mt-1 font-display font-bold text-2xl text-[#263238] tabular-nums">
              {weather ? `${weather.temperatureC}°C` : '—'}
            </p>
            <p className="text-xs text-[#546E7A] mt-1">
              {weather ? `${weather.condition} · Rain ${weather.rainProb}%` : 'Loading weather...'}
            </p>
          </div>
        </section>

        {/* Soil NPK + Weather + AI Summary Row */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Soil Monitoring Card */}
          <div className="lg:col-span-8 bg-white border border-[#E0E0E0] rounded-xl p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <div>
                <h2 className="font-display font-semibold text-base text-[#263238]">
                  Soil Moisture &amp; NPK Trend
                </h2>
                <p className="text-xs text-[#546E7A]">
                  {latestSoil?.source === 'simulated'
                    ? 'Includes simulated Arduino telemetry (clearly labeled)'
                    : 'Arduino & manual soil laboratory entries'}
                </p>
              </div>
              <Link
                to="/soil"
                className="text-xs font-semibold text-[#2E7D32] hover:underline whitespace-nowrap"
              >
                Open Soil Monitor
              </Link>
            </div>

            {latestSoil && (
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mb-4 pb-4 border-b border-[#E0E0E0]">
                <div>
                  <p className="text-xs text-[#546E7A]">Nitrogen</p>
                  <p className="font-mono font-semibold text-sm tabular-nums">{latestSoil.nitrogen} kg/ha</p>
                </div>
                <div>
                  <p className="text-xs text-[#546E7A]">Phosphorus</p>
                  <p className="font-mono font-semibold text-sm tabular-nums">{latestSoil.phosphorus} kg/ha</p>
                </div>
                <div>
                  <p className="text-xs text-[#546E7A]">Potassium</p>
                  <p className="font-mono font-semibold text-sm tabular-nums">{latestSoil.potassium} kg/ha</p>
                </div>
                <div>
                  <p className="text-xs text-[#546E7A]">Temp / Hum</p>
                  <p className="font-mono font-semibold text-sm tabular-nums">
                    {latestSoil.temperature}°C / {latestSoil.humidity}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-[#546E7A]">Health Status</p>
                  <p
                    className={`font-semibold text-sm ${
                      soilEval?.overallStatus === 'Healthy'
                        ? 'text-[#2E7D32]'
                        : soilEval?.overallStatus === 'Warning'
                        ? 'text-[#D97706]'
                        : 'text-[#E53935]'
                    }`}
                  >
                    {soilEval?.overallStatus || 'Nominal'}
                  </p>
                </div>
              </div>
            )}

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={soilChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="moisture"
                    name="Moisture %"
                    stroke="#2E7D32"
                    fill="#E8F5E9"
                  />
                  <Area
                    type="monotone"
                    dataKey="nitrogen"
                    name="Nitrogen (kg/ha)"
                    stroke="#66BB6A"
                    fill="#F5F7F5"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Right Column: AI Summary & IoT Devices */}
          <div className="lg:col-span-4 space-y-5">
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-base text-[#263238]">
                  AI Prediction Summary
                </h2>
                <Link to="/crop-recommendation" className="text-xs font-semibold text-[#2E7D32] hover:underline">
                  Run Models
                </Link>
              </div>
              <div className="divide-y divide-[#E0E0E0] text-sm">
                <div className="py-2.5">
                  <p className="text-xs text-[#546E7A]">Random Forest Recommendation</p>
                  <p className="font-semibold text-[#263238] mt-0.5">
                    {latestRec
                      ? `${latestRec.recommendedCrop} (${latestRec.confidence}% match)`
                      : 'No recommendation run yet'}
                  </p>
                </div>
                <div className="pt-2.5">
                  <p className="text-xs text-[#546E7A]">Latest CNN Leaf Scan</p>
                  <p className="font-semibold text-[#263238] mt-0.5">
                    {latestDis
                      ? `${latestDis.cropType}: ${latestDis.predictedDisease} (${latestDis.confidence}%)`
                      : 'No leaf scans recorded'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-display font-semibold text-base text-[#263238]">
                  Arduino IoT Nodes
                </h2>
                <Link to="/soil" className="text-xs font-semibold text-[#2E7D32] hover:underline">
                  Telemetry
                </Link>
              </div>
              <div className="space-y-2">
                {iotDevices.map((dev) => (
                  <div
                    key={dev.id}
                    className="flex items-center justify-between text-xs py-2 border-b border-[#E0E0E0] last:border-0"
                  >
                    <div>
                      <p className="font-mono font-semibold text-[#263238]">{dev.deviceId}</p>
                      <p className="text-[#546E7A]">{dev.controller}</p>
                    </div>
                    <span className="font-medium text-[#2E7D32] capitalize">{dev.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Bottom Grid: Crop Growth Chart + Timeline + Notifications & Tasks */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-5 bg-white border border-[#E0E0E0] rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-semibold text-base text-[#263238]">
                Crop Area &amp; Recorded Yield
              </h2>
              <Link to="/crops" className="text-xs font-semibold text-[#2E7D32] hover:underline">
                Manage Crops
              </Link>
            </div>
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cropHealthData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E0E0E0" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="area" name="Area (Acres)" fill="#66BB6A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="yieldTonnes" name="Yield (t)" fill="#2E7D32" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-4 bg-white border border-[#E0E0E0] rounded-xl p-5">
            <h2 className="font-display font-semibold text-base text-[#263238] mb-3">
              Farming Activity Timeline
            </h2>
            {cropActivities.length === 0 ? (
              <p className="text-xs text-[#546E7A]">No crop activities logged yet.</p>
            ) : (
              <div className="space-y-3">
                {cropActivities.slice(0, 4).map((act) => (
                  <div key={act.id} className="pb-2.5 border-b border-[#E0E0E0] last:border-0">
                    <p className="text-xs text-[#546E7A] font-mono tabular-nums">{act.activityDate}</p>
                    <p className="text-sm font-semibold text-[#263238]">{act.stage}</p>
                    <p className="text-xs text-[#546E7A] mt-0.5">{act.notes}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="lg:col-span-3 bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display font-semibold text-base text-[#263238]">
                  Recent Alerts
                </h2>
                <Link to="/notifications" className="text-xs font-semibold text-[#2E7D32] hover:underline">
                  View All
                </Link>
              </div>
              <div className="divide-y divide-[#E0E0E0]">
                {notifications.slice(0, 2).map((n) => (
                  <div key={n.id} className="text-xs py-2.5 first:pt-0">
                    <p className="font-semibold text-[#263238]">{n.title}</p>
                    <p className="text-[#546E7A] mt-0.5">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-[#E0E0E0]">
              <h3 className="font-display font-semibold text-sm text-[#263238] mb-2">
                Upcoming Tasks
              </h3>
              {pendingTasks.length === 0 ? (
                <p className="text-xs text-[#546E7A]">No scheduled irrigation tasks.</p>
              ) : (
                pendingTasks.slice(0, 2).map((t) => (
                  <div key={t.id} className="text-xs text-[#263238] py-1">
                    {t.scheduledDate} · {t.method} ({t.waterLiters.toLocaleString()} L)
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </WorkspaceLayout>
  );
}
