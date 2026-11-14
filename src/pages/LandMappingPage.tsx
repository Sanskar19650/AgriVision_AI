import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { FileText, MapPin, Crosshair, ExternalLink } from 'lucide-react';
import { WorkspaceLayout } from '../components/Layout';
import { useAgri } from '../context/AgriContext';
import {
  buildPolygonGeoJSON,
  calculatePolygonMeasurement,
  LatLngPoint,
} from '../utils/agriMath';
import {
  createStarterParcelPoints,
  getDistrictsForState,
  getStates,
  getTalukasForDistrict,
  getVillagesForTaluka,
  resolveGeoLocation,
} from '../utils/indiaGeoHierarchy';
import type { LandRecord } from '../types/agri';

const CUSTOM_OPTION = '__custom__';

export function LandMappingPage() {
  const { farms, landRecords, saveLandRecord } = useAgri();
  const initialFarm = farms[0];

  const [selectedFarmId, setSelectedFarmId] = useState(initialFarm?.id || '');
  const [layerMode, setLayerMode] = useState<'osm' | 'satellite'>('satellite');

  const initialState = initialFarm?.state || 'Maharashtra';
  const initialDistrict = initialFarm?.district || 'Pune';
  const initialTaluka = initialFarm?.taluka || 'Baramati';
  const initialVillage = initialFarm?.village || 'Malegaon Bk';
  const initialResolved = resolveGeoLocation({
    state: initialState,
    district: initialDistrict,
    taluka: initialTaluka,
    village: initialVillage,
  });

  const [form, setForm] = useState({
    satbaraNumber: initialFarm?.satbaraNumber || '7/12-MH-PUN-142',
    surveyNumber: initialFarm?.surveyNumber || '142',
    gatNumber: initialFarm?.gatNumber || '142/2A',
    state: initialState,
    district: initialDistrict,
    taluka: initialTaluka,
    village: initialVillage,
    verificationStatus: 'pending_manual' as 'pending_manual' | 'verified' | 'needs_review',
    ocrNotes: '',
  });

  const [customInputs, setCustomInputs] = useState({
    district: false,
    taluka: false,
    village: false,
  });

  const [hasCustomVertices, setHasCustomVertices] = useState(false);
  const [points, setPoints] = useState<LatLngPoint[]>(() =>
    createStarterParcelPoints(
      initialFarm?.latitude ?? initialResolved.lat,
      initialFarm?.longitude ?? initialResolved.lng,
      initialFarm?.satbaraNumber || '7/12-MH-PUN-142'
    )
  );

  const [mapFocus, setMapFocus] = useState<{
    lat: number;
    lng: number;
    zoom: number;
    label: string;
    source: string;
  }>({
    lat: initialFarm?.latitude ?? initialResolved.lat,
    lng: initialFarm?.longitude ?? initialResolved.lng,
    zoom: initialResolved.zoom,
    label: initialResolved.label,
    source: 'hierarchy-index',
  });

  const [isGeocoding, setIsGeocoding] = useState(false);
  const [ocrStatus, setOcrStatus] = useState('');
  const [ocrError, setOcrError] = useState('');
  const [uploadedDoc, setUploadedDoc] = useState<{
    name: string;
    isPdf: boolean;
    sizeKb: number;
    previewUrl: string;
  } | null>(null);
  const [savedNotice, setSavedNotice] = useState('');

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const polygonGroupRef = useRef<L.LayerGroup | null>(null);
  const markerGroupRef = useRef<L.LayerGroup | null>(null);
  const geocodeReqIdRef = useRef(0);

  const measurement = calculatePolygonMeasurement(points);

  // Cascading option lists derived strictly from State -> District -> Taluka -> Village
  const stateOptions = useMemo(() => {
    const base = getStates();
    if (form.state && !base.some((s) => s.toLowerCase() === form.state.toLowerCase())) {
      return [...base, form.state];
    }
    return base;
  }, [form.state]);

  const districtOptions = useMemo(() => {
    const base = getDistrictsForState(form.state);
    if (
      form.district &&
      !base.some((d) => d.toLowerCase() === form.district.toLowerCase())
    ) {
      return [...base, form.district];
    }
    return base;
  }, [form.state, form.district]);

  const talukaOptions = useMemo(() => {
    const base = getTalukasForDistrict(form.state, form.district);
    if (
      form.taluka &&
      !base.some((t) => t.toLowerCase() === form.taluka.toLowerCase())
    ) {
      return [...base, form.taluka];
    }
    return base;
  }, [form.state, form.district, form.taluka]);

  const villageOptions = useMemo(() => {
    const base = getVillagesForTaluka(form.state, form.district, form.taluka);
    if (
      form.village &&
      !base.some((v) => v.toLowerCase() === form.village.toLowerCase())
    ) {
      return [...base, form.village];
    }
    return base;
  }, [form.state, form.district, form.taluka, form.village]);

  useEffect(() => {
    return () => {
      if (uploadedDoc?.previewUrl) {
        URL.revokeObjectURL(uploadedDoc.previewUrl);
      }
    };
  }, [uploadedDoc]);

  // Initialize Leaflet map once
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [mapFocus.lat, mapFocus.lng],
      zoom: mapFocus.zoom,
    });

    polygonGroupRef.current = L.layerGroup().addTo(map);
    markerGroupRef.current = L.layerGroup().addTo(map);

    map.on('click', (e: L.LeafletMouseEvent) => {
      setHasCustomVertices(true);
      setPoints((prev) => [
        ...prev,
        { lat: Number(e.latlng.lat.toFixed(6)), lng: Number(e.latlng.lng.toFixed(6)) },
      ]);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Switch between OpenStreetMap and Esri World Imagery Satellite tiles
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const url =
      layerMode === 'satellite'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const attribution =
      layerMode === 'satellite'
        ? 'Imagery © Esri / Authorized Satellite Tile Provider'
        : '© OpenStreetMap contributors';

    tileLayerRef.current = L.tileLayer(url, { maxZoom: 19, attribution }).addTo(map);
  }, [layerMode]);

  // Pan/zoom Leaflet map & place reference pin whenever mapFocus or 7/12 reference changes
  useEffect(() => {
    const map = mapRef.current;
    const markerGroup = markerGroupRef.current;
    if (!map || !markerGroup) return;

    map.setView([mapFocus.lat, mapFocus.lng], mapFocus.zoom, { animate: true });

    markerGroup.clearLayers();
    const parcelTag = form.satbaraNumber ? `7/12: ${form.satbaraNumber}` : 'Selected Parcel';
    L.circleMarker([mapFocus.lat, mapFocus.lng], {
      radius: 8,
      color: '#1B5E20',
      fillColor: '#FFA726',
      fillOpacity: 0.95,
      weight: 2.5,
    })
      .bindTooltip(`${parcelTag} · ${mapFocus.label}`, { direction: 'top' })
      .addTo(markerGroup);
  }, [mapFocus, form.satbaraNumber]);

  // Render interactive boundary polygon and vertex handles
  useEffect(() => {
    const group = polygonGroupRef.current;
    if (!group) return;
    group.clearLayers();

    points.forEach((pt, idx) => {
      L.circleMarker([pt.lat, pt.lng], {
        radius: 6,
        color: '#2E7D32',
        fillColor: '#FFFFFF',
        fillOpacity: 1,
        weight: 2,
      })
        .bindTooltip(`Vertex ${idx + 1}`)
        .addTo(group);
    });

    if (points.length >= 3) {
      L.polygon(
        points.map((p) => [p.lat, p.lng] as [number, number]),
        {
          color: '#2E7D32',
          weight: 2.5,
          fillColor: '#66BB6A',
          fillOpacity: 0.25,
        }
      ).addTo(group);
    } else if (points.length === 2) {
      L.polyline(
        points.map((p) => [p.lat, p.lng] as [number, number]),
        { color: '#2E7D32', dashArray: '4 4' }
      ).addTo(group);
    }
  }, [points]);

  // Helper to resolve coordinates locally first, then query /api/land/geocode if custom village
  const syncMapToLocation = async (
    loc: {
      state: string;
      district: string;
      taluka: string;
      village: string;
      satbaraNumber?: string;
    },
    recenterStarterPolygon = true
  ) => {
    const reqId = ++geocodeReqIdRef.current;
    const local = resolveGeoLocation(loc);

    setMapFocus({
      lat: local.lat,
      lng: local.lng,
      zoom: local.zoom,
      label: local.label,
      source: 'hierarchy-index',
    });

    if (recenterStarterPolygon && !hasCustomVertices) {
      setPoints(createStarterParcelPoints(local.lat, local.lng, loc.satbaraNumber));
    }

    if (local.matchedLevel === 'village' || (!loc.village && !loc.taluka && !loc.district)) {
      return;
    }

    setIsGeocoding(true);
    try {
      const qs = new URLSearchParams({
        state: loc.state,
        district: loc.district,
        taluka: loc.taluka,
        village: loc.village,
      });
      const res = await fetch(`/api/land/geocode?${qs.toString()}`);
      if (!res.ok) return;
      const geo = await res.json();
      if (reqId !== geocodeReqIdRef.current) return;
      if (typeof geo.lat === 'number' && typeof geo.lng === 'number') {
        setMapFocus({
          lat: geo.lat,
          lng: geo.lng,
          zoom: geo.zoom || local.zoom,
          label: geo.label || local.label,
          source: geo.source || 'nominatim-osm',
        });
        if (recenterStarterPolygon && !hasCustomVertices) {
          setPoints(createStarterParcelPoints(geo.lat, geo.lng, loc.satbaraNumber));
        }
      }
    } catch {
      // Retain local hierarchy fallback coordinates
    } finally {
      if (reqId === geocodeReqIdRef.current) {
        setIsGeocoding(false);
      }
    }
  };

  // Cascading handlers: State -> District -> Taluka -> Village
  const handleStateChange = (nextState: string) => {
    const dists = getDistrictsForState(nextState);
    const nextDistrict = dists[0] || '';
    const tals = nextDistrict ? getTalukasForDistrict(nextState, nextDistrict) : [];
    const nextTaluka = tals[0] || '';
    const vils =
      nextDistrict && nextTaluka
        ? getVillagesForTaluka(nextState, nextDistrict, nextTaluka)
        : [];
    const nextVillage = vils[0] || '';

    setCustomInputs({
      district: !nextDistrict,
      taluka: !nextTaluka,
      village: !nextVillage,
    });
    setForm((prev) => ({
      ...prev,
      state: nextState,
      district: nextDistrict,
      taluka: nextTaluka,
      village: nextVillage,
    }));
    syncMapToLocation({
      state: nextState,
      district: nextDistrict,
      taluka: nextTaluka,
      village: nextVillage,
      satbaraNumber: form.satbaraNumber,
    });
  };

  const handleDistrictChange = (nextDistrict: string) => {
    if (nextDistrict === CUSTOM_OPTION) {
      setCustomInputs((c) => ({ ...c, district: true, taluka: true, village: true }));
      setForm((prev) => ({ ...prev, district: '', taluka: '', village: '' }));
      return;
    }
    const tals = getTalukasForDistrict(form.state, nextDistrict);
    const nextTaluka = tals[0] || '';
    const vils = nextTaluka
      ? getVillagesForTaluka(form.state, nextDistrict, nextTaluka)
      : [];
    const nextVillage = vils[0] || '';

    setCustomInputs({
      district: false,
      taluka: !nextTaluka,
      village: !nextVillage,
    });
    setForm((prev) => ({
      ...prev,
      district: nextDistrict,
      taluka: nextTaluka,
      village: nextVillage,
    }));
    syncMapToLocation({
      state: form.state,
      district: nextDistrict,
      taluka: nextTaluka,
      village: nextVillage,
      satbaraNumber: form.satbaraNumber,
    });
  };

  const handleTalukaChange = (nextTaluka: string) => {
    if (nextTaluka === CUSTOM_OPTION) {
      setCustomInputs((c) => ({ ...c, taluka: true, village: true }));
      setForm((prev) => ({ ...prev, taluka: '', village: '' }));
      return;
    }
    const vils = getVillagesForTaluka(form.state, form.district, nextTaluka);
    const nextVillage = vils[0] || '';

    setCustomInputs((c) => ({
      ...c,
      taluka: false,
      village: !nextVillage,
    }));
    setForm((prev) => ({
      ...prev,
      taluka: nextTaluka,
      village: nextVillage,
    }));
    syncMapToLocation({
      state: form.state,
      district: form.district,
      taluka: nextTaluka,
      village: nextVillage,
      satbaraNumber: form.satbaraNumber,
    });
  };

  const handleVillageChange = (nextVillage: string) => {
    if (nextVillage === CUSTOM_OPTION) {
      setCustomInputs((c) => ({ ...c, village: true }));
      setForm((prev) => ({ ...prev, village: '' }));
      return;
    }
    setCustomInputs((c) => ({ ...c, village: false }));
    setForm((prev) => ({ ...prev, village: nextVillage }));
    syncMapToLocation({
      state: form.state,
      district: form.district,
      taluka: form.taluka,
      village: nextVillage,
      satbaraNumber: form.satbaraNumber,
    });
  };

  const handleFarmSelection = (farmId: string) => {
    setSelectedFarmId(farmId);
    const farm = farms.find((f) => f.id === farmId);
    if (!farm) return;

    const nextState = farm.state || 'Maharashtra';
    const nextDistrict = farm.district || '';
    const nextTaluka = farm.taluka || '';
    const nextVillage = farm.village || '';

    setCustomInputs({ district: false, taluka: false, village: false });
    setHasCustomVertices(false);
    setForm((prev) => ({
      ...prev,
      satbaraNumber: farm.satbaraNumber || prev.satbaraNumber,
      surveyNumber: farm.surveyNumber || prev.surveyNumber,
      gatNumber: farm.gatNumber || prev.gatNumber,
      state: nextState,
      district: nextDistrict,
      taluka: nextTaluka,
      village: nextVillage,
    }));

    if (farm.latitude && farm.longitude) {
      const label = [nextVillage, nextTaluka, nextDistrict, nextState].filter(Boolean).join(', ');
      setMapFocus({
        lat: farm.latitude,
        lng: farm.longitude,
        zoom: 16,
        label,
        source: 'farm-gps',
      });
      setPoints(createStarterParcelPoints(farm.latitude, farm.longitude, farm.satbaraNumber));
    } else {
      syncMapToLocation({
        state: nextState,
        district: nextDistrict,
        taluka: nextTaluka,
        village: nextVillage,
        satbaraNumber: farm.satbaraNumber,
      });
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOcrError('');

    const isPdf =
      file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/');

    if (!isPdf && !isImage) {
      setOcrError('Please upload a PDF (.pdf) or image file for your 7/12 extract.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setOcrError('File size must be under 10 MB.');
      return;
    }

    const previewBlob = isPdf && !file.type ? new Blob([file], { type: 'application/pdf' }) : file;
    const previewUrl = URL.createObjectURL(previewBlob);

    setUploadedDoc({
      name: file.name,
      isPdf,
      sizeKb: Math.max(1, Math.round(file.size / 1024)),
      previewUrl,
    });
    setOcrStatus(`Extracting 7/12 fields from ${isPdf ? 'PDF' : 'image'} (${file.name})...`);

    const reader = new FileReader();
    reader.onload = async () => {
      const resultStr = typeof reader.result === 'string' ? reader.result : '';
      const normalizedDataUrl =
        isPdf && !resultStr.startsWith('data:application/pdf')
          ? resultStr.replace(/^data:[^;]*;/, 'data:application/pdf;')
          : resultStr;

      try {
        const res = await fetch('/api/land/ocr', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileDataUrl: normalizedDataUrl,
            fileName: file.name,
          }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to parse 7/12 document');
        }
        const ext = data.extracted || {};
        const nextSatbara = ext.satbaraNumber || form.satbaraNumber;
        const nextDistrict = ext.district || form.district;
        const nextTaluka = ext.taluka || form.taluka;
        const nextVillage = ext.village || form.village;

        setCustomInputs({ district: false, taluka: false, village: false });
        setForm((prev) => ({
          ...prev,
          satbaraNumber: nextSatbara,
          surveyNumber: ext.surveyNumber || prev.surveyNumber,
          gatNumber: ext.gatNumber || prev.gatNumber,
          district: nextDistrict,
          taluka: nextTaluka,
          village: nextVillage,
          ocrNotes: `${file.name}: ${data.notice || 'Document uploaded for manual verification.'}`,
        }));
        setOcrStatus(data.notice || 'OCR complete. Review and verify manually.');

        // Automatically sync map to the 7/12 extract's District/Taluka/Village
        syncMapToLocation({
          state: form.state,
          district: nextDistrict,
          taluka: nextTaluka,
          village: nextVillage,
          satbaraNumber: nextSatbara,
        });
      } catch (err: any) {
        setOcrError(err?.message || 'OCR request failed; enter 7/12 fields manually.');
        setOcrStatus('');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoadRecordToMap = (rec: LandRecord) => {
    const nextState = rec.state || 'Maharashtra';
    setCustomInputs({ district: false, taluka: false, village: false });
    setForm((prev) => ({
      ...prev,
      satbaraNumber: rec.satbaraNumber,
      surveyNumber: rec.surveyNumber,
      gatNumber: rec.gatNumber,
      state: nextState,
      district: rec.district,
      taluka: rec.taluka,
      village: rec.village,
      verificationStatus: rec.verificationStatus,
      ocrNotes: rec.ocrNotes || '',
    }));

    let loadedFromGeoJson = false;
    if (rec.geojsonText) {
      try {
        const parsed = JSON.parse(rec.geojsonText);
        const coords: number[][] = parsed?.features?.[0]?.geometry?.coordinates?.[0] || [];
        if (coords.length >= 4) {
          const pts = coords.slice(0, -1).map(([lng, lat]) => ({ lat, lng }));
          setPoints(pts);
          setHasCustomVertices(true);
          const avgLat = pts.reduce((a, b) => a + b.lat, 0) / pts.length;
          const avgLng = pts.reduce((a, b) => a + b.lng, 0) / pts.length;
          setMapFocus({
            lat: Number(avgLat.toFixed(6)),
            lng: Number(avgLng.toFixed(6)),
            zoom: 17,
            label: `${rec.village}, ${rec.taluka}, ${rec.district}, ${nextState}`,
            source: 'saved-geojson',
          });
          loadedFromGeoJson = true;
        }
      } catch {
        // Fallback to hierarchy geocode
      }
    }
    if (!loadedFromGeoJson) {
      setHasCustomVertices(false);
      syncMapToLocation({
        state: nextState,
        district: rec.district,
        taluka: rec.taluka,
        village: rec.village,
        satbaraNumber: rec.satbaraNumber,
      });
    }
  };

  const handleRecenterToLocation = () => {
    setHasCustomVertices(false);
    syncMapToLocation(
      {
        state: form.state,
        district: form.district,
        taluka: form.taluka,
        village: form.village,
        satbaraNumber: form.satbaraNumber,
      },
      true
    );
  };

  const handleSaveLand = async (e: React.FormEvent) => {
    e.preventDefault();
    const farmId = selectedFarmId || farms[0]?.id;
    if (!farmId || !form.satbaraNumber.trim()) return;
    const geojson = buildPolygonGeoJSON(points, {
      satbaraNumber: form.satbaraNumber,
      gatNumber: form.gatNumber,
      state: form.state,
      district: form.district,
      taluka: form.taluka,
      village: form.village,
      acres: measurement.acres,
    });
    await saveLandRecord({
      farmId,
      satbaraNumber: form.satbaraNumber.trim().slice(0, 60),
      surveyNumber: form.surveyNumber.trim().slice(0, 60),
      gatNumber: form.gatNumber.trim().slice(0, 60),
      village: form.village.trim().slice(0, 80),
      taluka: form.taluka.trim().slice(0, 80),
      district: form.district.trim().slice(0, 80),
      state: form.state.trim().slice(0, 80),
      verificationStatus: form.verificationStatus,
      calculatedAcres: measurement.acres,
      geojsonText: geojson ? JSON.stringify(geojson).slice(0, 20000) : '',
      ocrNotes: (form.ocrNotes || 'Farmer-drawn parcel polygon boundary.').slice(0, 2000),
    });
    setSavedNotice('7/12 land record and GeoJSON boundary saved.');
  };

  const handleDownloadGeoJSON = () => {
    const geojson = buildPolygonGeoJSON(points, {
      satbaraNumber: form.satbaraNumber,
      gatNumber: form.gatNumber,
      state: form.state,
      district: form.district,
      taluka: form.taluka,
      village: form.village,
      acres: measurement.acres,
    });
    if (!geojson) return;
    const blob = new Blob([JSON.stringify(geojson, null, 2)], { type: 'application/geo+json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `parcel_${form.gatNumber || 'boundary'}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <WorkspaceLayout
      title="7/12 Land Registration & Satellite Mapping"
      subtitle="Cascading State → District → Taluka → Village parcel hierarchy, 7/12 OCR upload, and live Leaflet satellite boundary mapping"
    >
      <div className="space-y-6">
        <div className="bg-[#FFF8E1] border border-[#FFE082] rounded-xl px-4 py-3 text-xs text-[#6D4C00]">
          Boundary &amp; Ownership Notice: Entering a 7/12 number or selecting State → District → Taluka → Village pans the satellite map to that administrative locality for boundary drawing. Official government parcel polygons require an authorized Mahabhulekh API token and manual verification.
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form */}
          <div className="lg:col-span-5 bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-4">
            <h2 className="font-display font-semibold text-base text-[#263238]">
              Maharashtra 7/12 Parcel Details
            </h2>

            <div>
              <label htmlFor="satbara-upload" className="block text-xs font-medium mb-1">
                Upload 7/12 Extract (PDF or Image for OCR)
              </label>
              <input
                id="satbara-upload"
                type="file"
                accept="application/pdf,image/*,.pdf"
                onChange={handleDocumentUpload}
                className="w-full text-xs border border-[#E0E0E0] rounded-lg p-2 bg-[#F5F7F5]"
              />
              {ocrError && <p className="text-xs text-[#E53935] mt-1.5">{ocrError}</p>}
              {ocrStatus && <p className="text-xs text-[#2E7D32] mt-1.5">{ocrStatus}</p>}
              {uploadedDoc && (
                <div className="mt-2 p-2.5 rounded-lg bg-[#F5F7F5] border border-[#E0E0E0] text-xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText className="w-4 h-4 text-[#2E7D32] shrink-0" />
                      <span className="font-medium text-[#263238] truncate">{uploadedDoc.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-mono text-[#546E7A]">
                        {uploadedDoc.isPdf ? 'PDF' : 'Image'} · {uploadedDoc.sizeKb} KB
                      </span>
                      <a
                        href={uploadedDoc.previewUrl}
                        download={uploadedDoc.name}
                        className="inline-flex items-center gap-1 text-[#2E7D32] font-medium hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Save
                      </a>
                    </div>
                  </div>
                  {uploadedDoc.isPdf ? (
                    <details className="text-xs text-[#546E7A]">
                      <summary className="cursor-pointer font-medium text-[#2E7D32] select-none">
                        Preview PDF inline
                      </summary>
                      <iframe
                        title={`7/12 PDF preview: ${uploadedDoc.name}`}
                        src={uploadedDoc.previewUrl}
                        className="mt-2 w-full h-36 rounded border border-[#E0E0E0] bg-white"
                      />
                    </details>
                  ) : (
                    <img
                      src={uploadedDoc.previewUrl}
                      alt={`7/12 extract preview: ${uploadedDoc.name}`}
                      className="w-full max-h-36 object-contain rounded border border-[#E0E0E0] bg-white"
                    />
                  )}
                </div>
              )}
            </div>

            <form onSubmit={handleSaveLand} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <label htmlFor="land-farm" className="block text-xs font-medium mb-1">
                  Linked Farm
                </label>
                <select
                  id="land-farm"
                  value={selectedFarmId || farms[0]?.id || ''}
                  onChange={(e) => handleFarmSelection(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
                >
                  {farms.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.farmName} ({f.village})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="land-712" className="block text-xs font-medium mb-1">
                  7/12 Document No.
                </label>
                <input
                  id="land-712"
                  type="text"
                  value={form.satbaraNumber}
                  onChange={(e) => {
                    const val = e.target.value;
                    setForm((prev) => ({ ...prev, satbaraNumber: val }));
                    if (!hasCustomVertices) {
                      setPoints(createStarterParcelPoints(mapFocus.lat, mapFocus.lng, val));
                    }
                  }}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="land-survey" className="block text-xs font-medium mb-1">
                  Survey No.
                </label>
                <input
                  id="land-survey"
                  type="text"
                  value={form.surveyNumber}
                  onChange={(e) => setForm({ ...form, surveyNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
                />
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="land-gat" className="block text-xs font-medium mb-1">
                  Gat No.
                </label>
                <input
                  id="land-gat"
                  type="text"
                  value={form.gatNumber}
                  onChange={(e) => setForm({ ...form, gatNumber: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg"
                />
              </div>

              {/* Strict Administrative Cascade: State -> District -> Taluka -> Village */}
              <div className="sm:col-span-2 pt-1 border-t border-[#E0E0E0]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-[#263238]">
                    Location Hierarchy (State → District → Taluka → Village)
                  </span>
                  <button
                    type="button"
                    onClick={handleRecenterToLocation}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#2E7D32] hover:underline"
                  >
                    <Crosshair className="w-3.5 h-3.5" />
                    Locate on Map
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* 1. State */}
                  <div>
                    <label htmlFor="land-state" className="block text-xs font-medium mb-1">
                      1. State
                    </label>
                    <select
                      id="land-state"
                      value={form.state}
                      onChange={(e) => handleStateChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
                    >
                      {stateOptions.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* 2. District (of selected State) */}
                  <div>
                    <label htmlFor="land-district" className="block text-xs font-medium mb-1">
                      2. District ({form.state})
                    </label>
                    <select
                      id="land-district"
                      value={customInputs.district ? CUSTOM_OPTION : form.district}
                      onChange={(e) => handleDistrictChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
                    >
                      {districtOptions.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                      <option value={CUSTOM_OPTION}>Other (Enter custom)</option>
                    </select>
                    {customInputs.district && (
                      <input
                        id="land-district-custom"
                        type="text"
                        placeholder="Enter district name"
                        value={form.district}
                        onChange={(e) => setForm({ ...form, district: e.target.value })}
                        onBlur={() =>
                          syncMapToLocation({
                            state: form.state,
                            district: form.district,
                            taluka: form.taluka,
                            village: form.village,
                            satbaraNumber: form.satbaraNumber,
                          })
                        }
                        className="mt-1.5 w-full px-3 py-1.5 text-xs border border-[#E0E0E0] rounded-lg"
                      />
                    )}
                  </div>

                  {/* 3. Taluka (of selected District) */}
                  <div>
                    <label htmlFor="land-taluka" className="block text-xs font-medium mb-1">
                      3. Taluka ({form.district || 'Select District'})
                    </label>
                    <select
                      id="land-taluka"
                      value={customInputs.taluka ? CUSTOM_OPTION : form.taluka}
                      onChange={(e) => handleTalukaChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
                    >
                      {talukaOptions.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                      <option value={CUSTOM_OPTION}>Other (Enter custom)</option>
                    </select>
                    {customInputs.taluka && (
                      <input
                        id="land-taluka-custom"
                        type="text"
                        placeholder="Enter taluka name"
                        value={form.taluka}
                        onChange={(e) => setForm({ ...form, taluka: e.target.value })}
                        onBlur={() =>
                          syncMapToLocation({
                            state: form.state,
                            district: form.district,
                            taluka: form.taluka,
                            village: form.village,
                            satbaraNumber: form.satbaraNumber,
                          })
                        }
                        className="mt-1.5 w-full px-3 py-1.5 text-xs border border-[#E0E0E0] rounded-lg"
                      />
                    )}
                  </div>

                  {/* 4. Village (of selected Taluka) */}
                  <div>
                    <label htmlFor="land-village" className="block text-xs font-medium mb-1">
                      4. Village ({form.taluka || 'Select Taluka'})
                    </label>
                    <select
                      id="land-village"
                      value={customInputs.village ? CUSTOM_OPTION : form.village}
                      onChange={(e) => handleVillageChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
                    >
                      {villageOptions.map((v) => (
                        <option key={v} value={v}>
                          {v}
                        </option>
                      ))}
                      <option value={CUSTOM_OPTION}>Other (Enter custom)</option>
                    </select>
                    {customInputs.village && (
                      <input
                        id="land-village-custom"
                        type="text"
                        placeholder="Enter village name"
                        value={form.village}
                        onChange={(e) => setForm({ ...form, village: e.target.value })}
                        onBlur={() =>
                          syncMapToLocation({
                            state: form.state,
                            district: form.district,
                            taluka: form.taluka,
                            village: form.village,
                            satbaraNumber: form.satbaraNumber,
                          })
                        }
                        className="mt-1.5 w-full px-3 py-1.5 text-xs border border-[#E0E0E0] rounded-lg"
                      />
                    )}
                  </div>
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="land-status" className="block text-xs font-medium mb-1">
                  Manual Verification Status
                </label>
                <select
                  id="land-status"
                  value={form.verificationStatus}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      verificationStatus: e.target.value as typeof form.verificationStatus,
                    })
                  }
                  className="w-full px-3 py-2 text-sm border border-[#E0E0E0] rounded-lg bg-white"
                >
                  <option value="pending_manual">Pending Manual Verification</option>
                  <option value="verified">Manually Verified</option>
                  <option value="needs_review">Needs Boundary Review</option>
                </select>
              </div>
              <div className="sm:col-span-2 pt-1">
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 bg-[#2E7D32] text-white text-sm font-semibold rounded-lg hover:bg-[#246628]"
                >
                  Save 7/12 &amp; GeoJSON Boundary
                </button>
                {savedNotice && (
                  <p className="text-xs text-[#2E7D32] font-medium mt-2">{savedNotice}</p>
                )}
              </div>
            </form>
          </div>

          {/* Right Map */}
          <div className="lg:col-span-7 bg-white border border-[#E0E0E0] rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display font-semibold text-base text-[#263238]">
                  Interactive Field Boundary Map
                </h2>
                <p className="text-xs text-[#546E7A]">
                  Click anywhere on the map to add boundary vertices ({points.length} vertices)
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex p-0.5 bg-[#F5F7F5] border border-[#E0E0E0] rounded-lg">
                  <button
                    type="button"
                    onClick={() => setLayerMode('satellite')}
                    className={`px-3 py-1 text-xs font-medium rounded-md ${
                      layerMode === 'satellite' ? 'bg-white text-[#2E7D32]' : 'text-[#546E7A]'
                    }`}
                  >
                    Satellite
                  </button>
                  <button
                    type="button"
                    onClick={() => setLayerMode('osm')}
                    className={`px-3 py-1 text-xs font-medium rounded-md ${
                      layerMode === 'osm' ? 'bg-white text-[#2E7D32]' : 'text-[#546E7A]'
                    }`}
                  >
                    OpenStreetMap
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleRecenterToLocation}
                  className="px-3 py-1.5 text-xs font-medium border border-[#E0E0E0] rounded-lg hover:bg-[#E8F5E9] text-[#2E7D32]"
                >
                  Center Boundary
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasCustomVertices(true);
                    setPoints((p) => p.slice(0, -1));
                  }}
                  className="px-3 py-1.5 text-xs font-medium border border-[#E0E0E0] rounded-lg hover:bg-[#F5F7F5]"
                >
                  Undo Vertex
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setHasCustomVertices(true);
                    setPoints([]);
                  }}
                  className="px-3 py-1.5 text-xs font-medium border border-[#E0E0E0] rounded-lg hover:bg-[#FFEBEE] text-[#E53935]"
                >
                  Clear Polygon
                </button>
                <button
                  type="button"
                  onClick={handleDownloadGeoJSON}
                  disabled={points.length < 3}
                  className="px-3 py-1.5 text-xs font-medium border border-[#E0E0E0] rounded-lg hover:bg-[#E8F5E9] text-[#2E7D32] disabled:opacity-50"
                >
                  Export GeoJSON
                </button>
              </div>
            </div>

            {/* Live Map Focus Indicator */}
            <div
              data-testid="map-focus-banner"
              className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 rounded-lg bg-[#E8F5E9] border border-[#C8E6C9] text-xs text-[#1B5E20]"
            >
              <div className="flex items-center gap-1.5 min-w-0">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="font-semibold shrink-0">{form.satbaraNumber || '7/12'}:</span>
                <span className="truncate">
                  {[form.state, form.district, form.taluka, form.village]
                    .filter(Boolean)
                    .join(' → ') || mapFocus.label}
                </span>
              </div>
              <span className="font-mono text-[11px] tabular-nums shrink-0">
                {isGeocoding
                  ? 'Resolving coordinates...'
                  : `${mapFocus.lat.toFixed(4)}, ${mapFocus.lng.toFixed(4)} (z${mapFocus.zoom})`}
              </span>
            </div>

            <div
              ref={mapContainerRef}
              data-testid="leaflet-map"
              className="w-full h-[360px] rounded-lg border border-[#E0E0E0] overflow-hidden z-0"
            />

            <div className="grid grid-cols-2 sm:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-[#E0E0E0] border-t border-[#E0E0E0] pt-3">
              <div className="px-3 py-1">
                <p className="text-xs text-[#546E7A]">Acres</p>
                <p className="font-mono font-semibold text-sm tabular-nums">{measurement.acres}</p>
              </div>
              <div className="px-3 py-1">
                <p className="text-xs text-[#546E7A]">Hectares</p>
                <p className="font-mono font-semibold text-sm tabular-nums">{measurement.hectares}</p>
              </div>
              <div className="px-3 py-1">
                <p className="text-xs text-[#546E7A]">Guntha</p>
                <p className="font-mono font-semibold text-sm tabular-nums">{measurement.guntha}</p>
              </div>
              <div className="px-3 py-1">
                <p className="text-xs text-[#546E7A]">Centroid</p>
                <p className="font-mono text-xs tabular-nums">
                  {measurement.centroid.lat}, {measurement.centroid.lng}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Saved Land Records Table */}
        <div className="bg-white border border-[#E0E0E0] rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
            <h2 className="font-display font-semibold text-base text-[#263238]">
              Saved 7/12 &amp; GeoJSON Records ({landRecords.length})
            </h2>
            <span className="text-xs text-[#546E7A]">
              Select a record to load its 7/12 hierarchy &amp; boundary onto the map
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E0E0E0] text-[#546E7A]">
                  <th className="py-2 pr-3">7/12 Number</th>
                  <th className="py-2 pr-3">Survey / Gat</th>
                  <th className="py-2 pr-3">Location (Village → Taluka → District → State)</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2 pr-3 text-right">Measured Acres</th>
                  <th className="py-2 text-right">Map</th>
                </tr>
              </thead>
              <tbody>
                {landRecords.map((r) => (
                  <tr key={r.id} className="border-b border-[#E0E0E0] last:border-0">
                    <td className="py-2.5 pr-3 font-mono font-semibold">{r.satbaraNumber}</td>
                    <td className="py-2.5 pr-3 font-mono">
                      {r.surveyNumber} / {r.gatNumber}
                    </td>
                    <td className="py-2.5 pr-3">
                      {[r.village, r.taluka, r.district, r.state || 'Maharashtra']
                        .filter(Boolean)
                        .join(', ')}
                    </td>
                    <td className="py-2.5 pr-3 capitalize">{r.verificationStatus.replace('_', ' ')}</td>
                    <td className="py-2.5 pr-3 text-right font-mono tabular-nums">
                      {r.calculatedAcres}
                    </td>
                    <td className="py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleLoadRecordToMap(r)}
                        className="px-2.5 py-1 text-xs font-medium text-[#2E7D32] border border-[#C8E6C9] rounded-md hover:bg-[#E8F5E9]"
                      >
                        Show on Map
                      </button>
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
