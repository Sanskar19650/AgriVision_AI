import test from 'node:test';
import assert from 'node:assert/strict';
import {
  convertArea,
  calculatePolygonMeasurement,
  buildPolygonGeoJSON,
  evaluateSoilHealth,
  shouldAutoStoreWeather,
  suggestIrrigation,
} from './agriMath';
import zlib from 'node:zlib';
import { extractSatbaraFieldsFromText, extractTextFromPdfBuffer } from './satbaraParser';
import {
  createStarterParcelPoints,
  getDistrictsForState,
  getStates,
  getTalukasForDistrict,
  getVillagesForTaluka,
  resolveGeoLocation,
} from './indiaGeoHierarchy';
import { recommendCrop } from './cropRecommender';

test('convertArea converts Maharashtra Guntha, Acres, and Hectares accurately', () => {
  assert.equal(convertArea(1, 'Acres', 'Guntha'), 40);
  assert.equal(convertArea(40, 'Guntha', 'Acres'), 1);
  const ha = convertArea(1, 'Acres', 'Hectares');
  assert.ok(ha > 0.404 && ha < 0.405);
});

test('calculatePolygonMeasurement computes non-zero area and GeoJSON for a 4-point plot', () => {
  const pts = [
    { lat: 18.5204, lng: 73.8567 },
    { lat: 18.5214, lng: 73.8567 },
    { lat: 18.5214, lng: 73.8577 },
    { lat: 18.5204, lng: 73.8577 },
  ];
  const m = calculatePolygonMeasurement(pts);
  assert.ok(m.acres > 2.5 && m.acres < 3.5);
  assert.ok(m.guntha > 100);
  const geojson = buildPolygonGeoJSON(pts, { farmName: 'Plot A' });
  assert.equal(geojson?.features[0].geometry.type, 'Polygon');
  assert.equal(geojson?.features[0].geometry.coordinates[0].length, 5);
});

test('evaluateSoilHealth detects low moisture and abnormal pH warnings', () => {
  const res = evaluateSoilHealth({
    moisture: 22,
    ph: 8.6,
    nitrogen: 110,
    phosphorus: 50,
    potassium: 95,
  });
  assert.equal(res.overallStatus, 'Critical');
  assert.ok(res.alerts.some((a) => a.includes('Soil Moisture is low')));
  assert.ok(res.alerts.some((a) => a.includes('Soil pH is high')));
});

test('suggestIrrigation defers watering when heavy rain is forecast', () => {
  const hold = suggestIrrigation({
    moisturePct: 38,
    areaAcres: 4,
    rainProbabilityPct: 80,
    method: 'Drip',
  });
  assert.equal(hold.shouldIrrigate, false);
  assert.equal(hold.urgency, 'Hold');

  const urgent = suggestIrrigation({
    moisturePct: 24,
    areaAcres: 2,
    rainProbabilityPct: 10,
    method: 'Drip',
  });
  assert.equal(urgent.shouldIrrigate, true);
  assert.equal(urgent.urgency, 'Immediate');
  assert.ok(urgent.recommendedLiters > 0);
});

test('recommendCrop predicts Sugarcane and Rice for their respective domain profiles', () => {
  const cane = recommendCrop({
    nitrogen: 140,
    phosphorus: 60,
    potassium: 100,
    temperature: 28,
    humidity: 70,
    ph: 6.8,
    rainfall: 1200,
    soilType: 'Black Cotton Soil',
  });
  assert.equal(cane.recommendedCrop, 'Sugarcane');
  assert.ok(cane.confidence > 80);

  const rice = recommendCrop({
    nitrogen: 85,
    phosphorus: 48,
    potassium: 42,
    temperature: 25,
    humidity: 84,
    ph: 6.4,
    rainfall: 230,
    soilType: 'Clay',
  });
  assert.equal(rice.recommendedCrop, 'Rice');
});

test('extractTextFromPdfBuffer and extractSatbaraFieldsFromText parse 7/12 PDFs accurately', () => {
  const samplePdf = Buffer.from(
    `%PDF-1.4
1 0 obj << /Type /Catalog >> endobj
2 0 obj << /Length 160 >> stream
BT
/F1 12 Tf
(Maharashtra 7/12 Extract) Tj
(7/12 No: 7/12-MH-PUN-204) Tj
(Survey No: 204) Tj
(Gat No: 204/1B) Tj
(Village: Malegaon Bk) Tj
(Taluka: Baramati) Tj
(District: Pune) Tj
(Area: 2.45) Tj
ET
endstream
endobj
%%EOF`,
    'latin1'
  );
  const extractedText = extractTextFromPdfBuffer(samplePdf);
  const fields = extractSatbaraFieldsFromText(extractedText);
  assert.equal(fields.satbaraNumber, '7/12-MH-PUN-204');
  assert.equal(fields.surveyNumber, '204');
  assert.equal(fields.gatNumber, '204/1B');
  assert.equal(fields.village, 'Malegaon Bk');
  assert.equal(fields.taluka, 'Baramati');
  assert.equal(fields.district, 'Pune');
  assert.equal(fields.areaHectares, '2.45');
});

test('extractTextFromPdfBuffer handles FlateDecode compressed streams and avoids newline false matches', () => {
  const compressedStream = zlib.deflateSync(
    Buffer.from(
      'BT (7/12 Extract) Tj (Survey No: 309) Tj (Gat No: 309/2) Tj (Village: Indapur) Tj ET',
      'latin1'
    )
  );
  const pdfBuf = Buffer.concat([
    Buffer.from('%PDF-1.4\n1 0 obj << /Filter /FlateDecode >>\nstream\n', 'latin1'),
    compressedStream,
    Buffer.from('\nendstream\nendobj\n%%EOF', 'latin1'),
  ]);
  const text = extractTextFromPdfBuffer(pdfBuf);
  const fields = extractSatbaraFieldsFromText(text);
  assert.equal(fields.satbaraNumber, '');
  assert.equal(fields.surveyNumber, '309');
  assert.equal(fields.gatNumber, '309/2');
  assert.equal(fields.village, 'Indapur');
});

test('indiaGeoHierarchy cascades State -> District -> Taluka -> Village and resolves coordinates', () => {
  const states = getStates();
  assert.ok(states.includes('Maharashtra'));
  assert.ok(states.includes('Karnataka'));

  const mhDistricts = getDistrictsForState('Maharashtra');
  assert.ok(mhDistricts.includes('Pune'));
  assert.ok(mhDistricts.includes('Nashik'));
  assert.ok(!mhDistricts.includes('Belagavi'));

  const puneTalukas = getTalukasForDistrict('Maharashtra', 'Pune');
  assert.ok(puneTalukas.includes('Baramati'));
  assert.ok(puneTalukas.includes('Purandar'));

  const baramatiVillages = getVillagesForTaluka('Maharashtra', 'Pune', 'Baramati');
  assert.ok(baramatiVillages.includes('Malegaon Bk'));

  const niphad = resolveGeoLocation({
    state: 'Maharashtra',
    district: 'Nashik',
    taluka: 'Niphad',
    village: 'Lasalgaon',
  });
  assert.equal(niphad.matchedLevel, 'village');
  assert.equal(niphad.zoom, 16);
  assert.ok(niphad.lat > 20 && niphad.lng > 74);

  const starter = createStarterParcelPoints(niphad.lat, niphad.lng, '7/12-NSK-101');
  assert.equal(starter.length, 4);
});

test('shouldAutoStoreWeather throttles duplicate saves within interval and allows new farms/stale entries', () => {
  const nowMs = Date.parse('2026-11-14T10:30:00.000Z');
  const recent = [{ farmId: 'farm_1', createdAt: '2026-11-14T10:25:00.000Z' }];
  assert.equal(shouldAutoStoreWeather(recent, 'farm_1', nowMs, 15 * 60_000), false);
  assert.equal(shouldAutoStoreWeather(recent, 'farm_2', nowMs, 15 * 60_000), true);

  const stale = [{ farmId: 'farm_1', createdAt: '2026-11-14T10:00:00.000Z' }];
  assert.equal(shouldAutoStoreWeather(stale, 'farm_1', nowMs, 15 * 60_000), true);
});
