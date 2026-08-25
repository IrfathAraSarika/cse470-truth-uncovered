import assert from 'node:assert/strict';
import test from 'node:test';
import { buildHeatmapPoints } from './heatmapService.js';

test('uses precise coordinates when reports contain GPS data', () => {
  const [point] = buildHeatmapPoints([{ district: 'Dhaka', category: 'bribery', reportCount: 2, latitude: 23.75, longitude: 90.4, latestReportAt: '2026-01-01' }]);
  assert.equal(point?.latitude, 23.75);
  assert.equal(point?.usedDistrictCenter, false);
});

test('falls back to a known district center when GPS is unavailable', () => {
  const [point] = buildHeatmapPoints([{ district: 'Sylhet', category: 'hazard', reportCount: 1, latitude: null, longitude: null, latestReportAt: '2026-01-01' }]);
  assert.equal(point?.latitude, 24.8949);
  assert.equal(point?.usedDistrictCenter, true);
});

test('omits unknown districts without usable coordinates', () => {
  const points = buildHeatmapPoints([{ district: 'Unknown', category: 'other', reportCount: 1, latitude: null, longitude: null, latestReportAt: '2026-01-01' }]);
  assert.equal(points.length, 0);
});
