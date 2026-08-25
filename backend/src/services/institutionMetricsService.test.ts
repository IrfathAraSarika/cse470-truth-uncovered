import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateInstitutionMetric } from './institutionMetricsService.js';

test('rewards institutions with actioned cases and fast resolution', () => {
  const metric = calculateInstitutionMetric({
    institutionId: 'institution-1', name: 'Responsive Office', type: 'public', address: null,
    verifiedReports: 3, totalCases: 4, actionedCases: 4, closedCases: 4, averageResolutionDays: 5,
  });
  assert.equal(metric.actionTakenRate, 100);
  assert.ok(metric.trustScore >= 90);
  assert.ok(metric.redFlagScore < 40);
});

test('raises red-flag score for unresolved verified cases', () => {
  const metric = calculateInstitutionMetric({
    institutionId: 'institution-2', name: 'Unresponsive Office', type: 'public', address: null,
    verifiedReports: 9, totalCases: 8, actionedCases: 1, closedCases: 0, averageResolutionDays: null,
  });
  assert.ok(metric.redFlagScore >= 90);
  assert.ok(metric.trustScore < 10);
});

test('returns neutral zero scores when no verified data exists', () => {
  const metric = calculateInstitutionMetric({
    institutionId: 'institution-3', name: 'New Office', type: null, address: null,
    verifiedReports: 0, totalCases: 0, actionedCases: 0, closedCases: 0, averageResolutionDays: null,
  });
  assert.equal(metric.trustScore, 0);
  assert.equal(metric.redFlagScore, 0);
});
