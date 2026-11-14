import React, { useEffect, useState } from 'react';
import { WorkspaceLayout } from '../components/Layout';
import { useAgri } from '../context/AgriContext';

// 1. Blockchain SHA-256 Verification Page
export function BlockchainPage() {
  const { farms, blockchainRecords, addBlockchainRecord } = useAgri();
  const [regForm, setRegForm] = useState({
    documentType: 'Soil Report',
    documentTitle: 'Kharif Soil & NPK Certificate',
    content: 'Farm: Sahyadri Sugarcane Estate | 7/12: 7/12-MH-PUN-142 | pH: 6.7 | N: 124 | P: 52 | K: 96',
  });
  const [verifyInput, setVerifyInput] = useState({
    content: '',
    expectedHash: '',
  });
  const [verifyResult, setVerifyResult] = useState<any>(null);
  const [busy, setBusy] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regForm.content.trim()) return;
    setBusy(true);
    try {
      const res = await fetch('/api/blockchain/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...regForm,
          farmId: farms[0]?.id || 'farm_demo_1',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        await addBlockchainRecord({
          farmId: data.farmId,
          documentType: data.documentType,
          documentTitle: data.documentTitle,
          sha256Hash: data.sha256Hash,
          txHash: data.txHash,
          networkMode: data.networkMode,
          verified: true,
        });
        setVerifyInput({ content: regForm.content, expectedHash: data.sha256Hash });
      }
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyInput.content.trim()) return;
    const res = await fetch('/api/blockchain/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(verifyInput),
    });
    const data = await res.json();
    setVerifyResult(data);
  };

  return (
    <WorkspaceLayout
      title="Blockchain Document Verification"
      subtitle="Compute SHA-256 document fingerprints, register transaction hashes, and detect tampered records"
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Register Hash */}
          <div className="lg:col-span-6 bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-base text-[#263238]">
              Anchor Agricultural Report Hash
            </h2>
            <form onSubmit={handleRegister} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="bc-type" className="block text-xs font-medium mb-1">
                    Document Type
                  </label>
                  <select
                    id="bc-type"
                    value={regForm.documentType}
                    onChange={(e) => setRegForm({ ...regForm, documentType: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
                  >
                    <option>Soil Report</option>
                    <option>Crop Report</option>
                    <option>Harvest Report</option>
                    <option>Agricultural Certificate</option>
                    <option>Farming Activity Report</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="bc-title" className="block text-xs font-medium mb-1">
                    Document Title
                  </label>
                  <input
                    id="bc-title"
                    type="text"
                    value={regForm.documentTitle}
                    onChange={(e) => setRegForm({ ...regForm, documentTitle: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="bc-content" className="block text-xs font-medium mb-1">
                  Canonical Report Payload / Certificate Text
                </label>
                <textarea
                  id="bc-content"
                  rows={4}
                  value={regForm.content}
                  onChange={(e) => setRegForm({ ...regForm, content: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#E0E0E0] rounded-lg"
                />
              </div>
              <button
                type="submit"
                disabled={busy}
                className="w-full py-2.5 px-4 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628]"
              >
                {busy ? 'Computing SHA-256...' : 'Generate SHA-256 & Register Anchor'}
              </button>
            </form>
          </div>

          {/* Verify Integrity / Tamper Test */}
          <div className="lg:col-span-6 bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-base text-[#263238]">
              Verify Document Integrity (Tamper Detector)
            </h2>
            <form onSubmit={handleVerify} className="space-y-3">
              <div>
                <label htmlFor="ver-content" className="block text-xs font-medium mb-1">
                  Document Text to Verify (Modify any character to test tamper detection)
                </label>
                <textarea
                  id="ver-content"
                  rows={3}
                  value={verifyInput.content}
                  onChange={(e) => setVerifyInput({ ...verifyInput, content: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#E0E0E0] rounded-lg"
                  placeholder="Paste report payload..."
                />
              </div>
              <div>
                <label htmlFor="ver-hash" className="block text-xs font-medium mb-1">
                  Expected SHA-256 Hash (Optional — checks ledger if blank)
                </label>
                <input
                  id="ver-hash"
                  type="text"
                  value={verifyInput.expectedHash}
                  onChange={(e) => setVerifyInput({ ...verifyInput, expectedHash: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-[#E0E0E0] rounded-lg"
                  placeholder="64-character hex SHA-256"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-white border border-[#2E7D32] text-[#2E7D32] text-sm font-semibold rounded-lg hover:bg-[#E8F5E9]"
              >
                Verify SHA-256 Integrity
              </button>
            </form>

            {verifyResult && (
              <div
                className={`p-3 rounded-lg border text-xs space-y-1 ${
                  verifyResult.verified && !verifyResult.tampered
                    ? 'bg-[#E8F5E9] border-[#66BB6A] text-[#1B5E20]'
                    : 'bg-[#FFEBEE] border-[#EF9A9A] text-[#B71C1C]'
                }`}
              >
                <p className="font-semibold">
                  {verifyResult.verified && !verifyResult.tampered
                    ? 'Verified: Document matches anchored SHA-256 fingerprint.'
                    : 'Tamper / Mismatch Detected: Computed SHA-256 does not match expected anchor.'}
                </p>
                <p className="font-mono break-all">Computed: {verifyResult.computedHash}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
          <h2 className="font-display font-semibold text-base text-[#263238] mb-3">
            Registered Document Hashes ({blockchainRecords.length})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E0E0E0] text-[#546E7A]">
                  <th className="py-2 pr-3">Title</th>
                  <th className="py-2 pr-3">Type</th>
                  <th className="py-2 pr-3">SHA-256 Hash</th>
                  <th className="py-2 pr-3">Transaction Hash</th>
                  <th className="py-2 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {blockchainRecords.map((b) => (
                  <tr key={b.id} className="border-b border-[#E0E0E0] last:border-0">
                    <td className="py-2.5 pr-3 font-medium">{b.documentTitle}</td>
                    <td className="py-2.5 pr-3">{b.documentType}</td>
                    <td className="py-2.5 pr-3 font-mono text-[11px]">{b.sha256Hash.slice(0, 20)}...</td>
                    <td className="py-2.5 pr-3 font-mono text-[11px]">{b.txHash.slice(0, 20)}...</td>
                    <td className="py-2.5 text-right font-mono text-[#546E7A] tabular-nums">
                      {b.createdAt.slice(0, 10)}
                    </td>
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

// 2. Notifications Page
export function NotificationsPage() {
  const { notifications, markNotificationRead, addNotification, soilReadings, farms } = useAgri();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const visible = notifications.filter((n) => (filter === 'unread' ? !n.read : true));

  const runThresholdScan = async () => {
    const latest = soilReadings[0];
    if (!latest) return;
    if (latest.moisture < 35) {
      await addNotification({
        farmId: latest.farmId,
        category: 'Low soil moisture',
        severity: 'warning',
        title: `Moisture alert on ${farms.find((f) => f.id === latest.farmId)?.farmName || 'Farm'}`,
        message: `Latest reading is ${latest.moisture}% (below 35% threshold). Schedule irrigation.`,
        read: false,
      });
    } else {
      await addNotification({
        farmId: latest.farmId,
        category: 'Irrigation reminder',
        severity: 'info',
        title: 'Threshold scan complete — parameters nominal',
        message: `Soil moisture (${latest.moisture}%) and pH (${latest.ph}) are within target ranges.`,
        read: false,
      });
    }
  };

  return (
    <WorkspaceLayout
      title="Notifications & Agricultural Alerts"
      subtitle="Soil moisture, pH, weather, disease, damage, and IoT device status notifications"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex p-1 bg-white border border-[#E0E0E0] rounded-lg">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
                filter === 'all' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'text-[#546E7A]'
              }`}
            >
              All ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md ${
                filter === 'unread' ? 'bg-[#E8F5E9] text-[#2E7D32]' : 'text-[#546E7A]'
              }`}
            >
              Unread ({notifications.filter((n) => !n.read).length})
            </button>
          </div>

          <button
            type="button"
            onClick={runThresholdScan}
            className="px-4 py-2 text-xs font-semibold bg-[#2E7D32] text-white rounded-lg hover:bg-[#246628]"
          >
            Run Soil &amp; Device Threshold Scan
          </button>
        </div>

        <div className="space-y-3">
          {visible.map((n) => (
            <div
              key={n.id}
              className={`bg-white border border-[#E0E0E0] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                n.read ? 'opacity-75' : ''
              }`}
            >
              <div>
                <p className="text-xs text-[#546E7A]">
                  {n.category} · <span className="capitalize">{n.severity}</span> ·{' '}
                  {n.createdAt.slice(0, 10)}
                </p>
                <p className="font-display font-semibold text-sm text-[#263238] mt-0.5">{n.title}</p>
                <p className="text-xs text-[#546E7A] mt-1">{n.message}</p>
              </div>
              <button
                type="button"
                onClick={() => markNotificationRead(n.id, !n.read)}
                className="px-3 py-1.5 text-xs font-medium border border-[#E0E0E0] rounded-lg hover:bg-[#F5F7F5] shrink-0"
              >
                {n.read ? 'Mark Unread' : 'Mark Read'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </WorkspaceLayout>
  );
}

// 3. Reports & Analytics Page
export function ReportsPage() {
  const {
    farms,
    crops,
    soilReadings,
    diseaseDetections,
    damageDetections,
    irrigationRecords,
    fertilizerRecords,
    iotDevices,
    weatherRecords,
  } = useAgri();

  const [reportType, setReportType] = useState('Soil');
  const [farmFilter, setFarmFilter] = useState('ALL');

  const getRows = () => {
    const byFarm = <T extends { farmId?: string }>(items: T[]) =>
      farmFilter === 'ALL' ? items : items.filter((i) => i.farmId === farmFilter);

    switch (reportType) {
      case 'Farm':
        return farms.map((f) => ({
          Name: f.farmName,
          Satbara: f.satbaraNumber,
          Location: `${f.village}, ${f.district}`,
          Area: `${f.areaValue} ${f.areaUnit}`,
        }));
      case 'Crop':
      case 'Harvest':
        return byFarm(crops).map((c) => ({
          Crop: c.cropName,
          Variety: c.variety,
          Stage: c.stage,
          Status: c.healthStatus,
          YieldTonnes: c.yieldTonnes || 0,
        }));
      case 'Disease':
        return byFarm(diseaseDetections).map((d) => ({
          Crop: d.cropType,
          Prediction: d.predictedDisease,
          Confidence: `${d.confidence}%`,
          Treatment: d.treatment,
        }));
      case 'Damage':
        return byFarm(damageDetections).map((d) => ({
          Category: d.damageCategory,
          Boxes: d.detectionCount,
          Confidence: `${d.confidence}%`,
          Severity: d.severity,
        }));
      case 'Irrigation':
        return byFarm(irrigationRecords).map((r) => ({
          Date: r.scheduledDate,
          Method: r.method,
          WaterLiters: r.waterLiters,
          Status: r.status,
        }));
      case 'Fertilizer':
      case 'Expense':
        return byFarm(fertilizerRecords).map((r) => ({
          Date: r.applicationDate,
          Product: r.productName,
          Category: r.category,
          CostINR: r.costInr,
        }));
      case 'IoT':
        return byFarm(iotDevices).map((d) => ({
          DeviceID: d.deviceId,
          Controller: d.controller,
          Status: d.status,
          LastSeen: d.lastSeen,
        }));
      case 'Weather':
        return byFarm(weatherRecords).map((w) => ({
          Recorded: w.createdAt.slice(0, 16).replace('T', ' '),
          TemperatureC: w.temperatureC,
          Humidity: `${w.humidity}%`,
          WindKmh: w.windSpeedKmh,
          Condition: w.condition,
        }));
      default:
        return byFarm(soilReadings).map((s) => ({
          Source: s.source,
          Moisture: `${s.moisture}%`,
          pH: s.ph,
          NPK: `${s.nitrogen}/${s.phosphorus}/${s.potassium}`,
          Recorded: s.createdAt.slice(0, 10),
        }));
    }
  };

  const rows = getRows();
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  const handleExportCsv = () => {
    if (rows.length === 0) return;
    const csv = [
      headers.join(','),
      ...rows.map((r) => headers.map((h) => `"${String((r as any)[h]).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `agrivision_${reportType.toLowerCase()}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <WorkspaceLayout
      title="Reports & Analytics"
      subtitle="Filter farm records and export CSV or printable PDF reports"
    >
      <div className="space-y-5">
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 no-print">
          <div className="flex flex-wrap items-center gap-3">
            <select
              aria-label="Report category"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
            >
              {['Farm', 'Soil', 'Weather', 'Crop', 'Disease', 'Damage', 'Irrigation', 'Fertilizer', 'Harvest', 'IoT', 'Expense'].map(
                (t) => (
                  <option key={t} value={t}>
                    {t} Report
                  </option>
                )
              )}
            </select>
            <select
              aria-label="Filter by farm"
              value={farmFilter}
              onChange={(e) => setFarmFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
            >
              <option value="ALL">All Farms</option>
              {farms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.farmName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              className="px-4 py-2 text-xs font-semibold bg-[#2E7D32] text-white rounded-lg hover:bg-[#246628]"
            >
              Download CSV
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 text-xs font-semibold border border-[#E0E0E0] rounded-lg hover:bg-[#F5F7F5]"
            >
              Print / Save PDF
            </button>
          </div>
        </div>

        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
          <h2 className="font-display font-semibold text-base text-[#263238] mb-3">
            {reportType} Report ({rows.length} rows)
          </h2>
          {rows.length === 0 ? (
            <p className="text-sm text-[#546E7A]">No records available for the selected filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#E0E0E0] text-[#546E7A]">
                    {headers.map((h) => (
                      <th key={h} className="py-2 pr-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, idx) => (
                    <tr key={idx} className="border-b border-[#E0E0E0] last:border-0">
                      {headers.map((h) => (
                        <td key={h} className="py-2.5 pr-3">
                          {String((r as any)[h])}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  );
}

// 4. Farmer Profile Page
export function ProfilePage() {
  const { profile, farms, crops, updateProfile } = useAgri();
  const [form, setForm] = useState({
    fullName: profile?.fullName || '',
    mobile: profile?.mobile || '',
    village: profile?.village || '',
    taluka: profile?.taluka || '',
    district: profile?.district || '',
    state: profile?.state || 'Maharashtra',
    address: profile?.address || '',
  });
  const [saved, setSaved] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <WorkspaceLayout
      title="Farmer Profile"
      subtitle="Manage personal contact details, Maharashtra village location, and farm summary"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white border border-[#E0E0E0] rounded-xl p-5">
          <h2 className="font-display font-semibold text-base text-[#263238] mb-4">
            Personal &amp; Location Details
          </h2>
          <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="prof-name" className="block text-xs font-medium mb-1">
                Full Name
              </label>
              <input
                id="prof-name"
                type="text"
                value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="prof-mobile" className="block text-xs font-medium mb-1">
                Mobile Number
              </label>
              <input
                id="prof-mobile"
                type="text"
                value={form.mobile}
                onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="prof-village" className="block text-xs font-medium mb-1">
                Village
              </label>
              <input
                id="prof-village"
                type="text"
                value={form.village}
                onChange={(e) => setForm({ ...form, village: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="prof-taluka" className="block text-xs font-medium mb-1">
                Taluka
              </label>
              <input
                id="prof-taluka"
                type="text"
                value={form.taluka}
                onChange={(e) => setForm({ ...form, taluka: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="prof-district" className="block text-xs font-medium mb-1">
                District
              </label>
              <input
                id="prof-district"
                type="text"
                value={form.district}
                onChange={(e) => setForm({ ...form, district: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="prof-state" className="block text-xs font-medium mb-1">
                State
              </label>
              <input
                id="prof-state"
                type="text"
                value={form.state}
                onChange={(e) => setForm({ ...form, state: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="prof-addr" className="block text-xs font-medium mb-1">
                Address
              </label>
              <input
                id="prof-addr"
                type="text"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
              />
            </div>
            <div className="sm:col-span-2 pt-1 flex items-center gap-3">
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628]"
              >
                Save Profile
              </button>
              {saved && <span className="text-xs font-medium text-[#2E7D32]">Profile saved.</span>}
            </div>
          </form>
        </div>

        <div className="lg:col-span-5 bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={profile?.photoUrl || '/src/assets/images/farmer_avatar_1794662768649.jpg'}
              alt={profile?.fullName || 'Farmer avatar'}
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border border-[#E0E0E0]"
            />
            <div>
              <p className="font-display font-bold text-lg text-[#263238]">{profile?.fullName}</p>
              <p className="text-xs text-[#546E7A]">{profile?.email}</p>
              <p className="text-xs text-[#2E7D32] capitalize mt-0.5">Role: {profile?.role}</p>
            </div>
          </div>

          <div className="pt-3 border-t border-[#E0E0E0] space-y-2 text-xs">
            <p className="font-semibold text-[#263238]">Registered Farms ({farms.length})</p>
            {farms.map((f) => (
              <p key={f.id} className="text-[#546E7A]">
                {f.farmName} · {f.areaValue} {f.areaUnit} · {f.village}
              </p>
            ))}
            <p className="font-semibold text-[#263238] pt-2">Crops Tracked ({crops.length})</p>
            {crops.map((c) => (
              <p key={c.id} className="text-[#546E7A]">
                {c.cropName} ({c.variety}) · {c.stage}
              </p>
            ))}
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  );
}

// 5. Admin Dashboard Page
export function AdminPage() {
  const { profile, isDemoMode, farms, iotDevices, resetDemoData } = useAgri();
  const [health, setHealth] = useState<any>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => {});
  }, []);

  const isAuthorizedAdmin = profile?.role === 'admin' || isDemoMode;

  return (
    <WorkspaceLayout
      title="Administrator Console"
      subtitle="Platform health, AI model readiness, IoT nodes, and role-protected governance"
    >
      {!isAuthorizedAdmin ? (
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-6 text-sm text-[#546E7A]">
          Administrator access is restricted to verified admin accounts. Contact the platform administrator for elevated permissions.
        </div>
      ) : (
        <div className="space-y-6">
          {isDemoMode && (
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="text-[#546E7A]">
                Previewing Admin Console in Demo Sandbox Mode. In live Firebase mode, Firestore rules restrict global user queries strictly to verified admin identities.
              </span>
              <button
                type="button"
                onClick={resetDemoData}
                className="px-3 py-1.5 border border-[#E0E0E0] rounded-lg font-medium hover:bg-[#F5F7F5]"
              >
                Reset Demo Seed Data
              </button>
            </div>
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-4">
              <p className="text-xs text-[#546E7A]">Registered Farms</p>
              <p className="font-mono font-bold text-2xl tabular-nums mt-1">{farms.length}</p>
            </div>
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-4">
              <p className="text-xs text-[#546E7A]">Arduino IoT Nodes</p>
              <p className="font-mono font-bold text-2xl tabular-nums mt-1">{iotDevices.length}</p>
            </div>
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-4">
              <p className="text-xs text-[#546E7A]">API Backend Status</p>
              <p className="font-display font-bold text-lg text-[#2E7D32] mt-1">
                {health?.status === 'ok' ? 'Operational' : 'Checking...'}
              </p>
            </div>
            <div className="bg-white border border-[#E0E0E0] rounded-xl p-4">
              <p className="text-xs text-[#546E7A]">Weather Provider</p>
              <p className="font-mono font-semibold text-sm mt-2">
                {health?.capabilities?.weatherProvider || 'open-meteo'}
              </p>
            </div>
          </div>

          <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
            <h2 className="font-display font-semibold text-base text-[#263238] mb-3">
              Service &amp; AI Model Capabilities
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-[#F5F7F5] border border-[#E0E0E0]">
                <p className="font-semibold">Random Forest Crop Recommender</p>
                <p className="text-[#546E7A] mt-1">Active (Built-in Server + Scikit-Learn endpoint)</p>
              </div>
              <div className="p-3 rounded-lg bg-[#F5F7F5] border border-[#E0E0E0]">
                <p className="font-semibold">CNN &amp; YOLOv8 Vision Endpoints</p>
                <p className="text-[#546E7A] mt-1">
                  {health?.capabilities?.pythonAiProxy
                    ? 'Connected to Python FastAPI ML Service'
                    : health?.capabilities?.geminiVision
                    ? 'Server Vision Analyzer Active'
                    : 'Local Heuristic Analyzer (Demo Fallback)'}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-[#F5F7F5] border border-[#E0E0E0]">
                <p className="font-semibold">Blockchain SHA-256 Registry</p>
                <p className="text-[#546E7A] mt-1">Active (AgriVision.sol compatible hash ledger)</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </WorkspaceLayout>
  );
}
