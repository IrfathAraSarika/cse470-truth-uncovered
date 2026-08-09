import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeDuplicateSimilarity,
  calculateGeoDistanceKm,
  calculateTextSimilarity,
  detectDuplicatesForReport,
} from './duplicateDetectionService.js';

test('calculates text similarity correctly for identical titles and descriptions', () => {
  const sim = calculateTextSimilarity('Corruption at land office', 'Corruption at land office');
  assert.equal(sim, 100);
});

test('calculates geographic distance using Haversine formula', () => {
  // Dhaka coords approx: 23.8103, 90.4125 to 23.8120, 90.4130 (~0.2 km)
  const dist = calculateGeoDistanceKm(23.8103, 90.4125, 23.8120, 90.4130);
  assert.ok(dist < 1.0);
});

test('ranks duplicate candidate report above threshold', () => {
  const target = {
    reportId: 'rep-1',
    title: 'Extortion money taken at highway toll bridge',
    description: 'Local syndicate demanding BDT 500 per truck illegally.',
    category: 'extortion',
    district: 'Dhaka',
  };

  const candidates = [
    {
      reportId: 'rep-2',
      title: 'Extortion money taken at highway toll bridge',
      description: 'Local syndicate demanding BDT 500 per truck illegally.',
      category: 'extortion',
      district: 'Dhaka',
      submissionDate: new Date().toISOString(),
    },
    {
      reportId: 'rep-3',
      title: 'Broken streetlight near school',
      description: 'The lamp post has no electricity.',
      category: 'hazard',
      district: 'Sylhet',
      submissionDate: new Date().toISOString(),
    },
  ];

  const results = detectDuplicatesForReport(target, candidates);
  assert.equal(results.length, 1);
  assert.equal(results[0]?.candidateId, 'rep-2');
  assert.ok((results[0]?.breakdown.overallScore ?? 0) >= 80);
});
