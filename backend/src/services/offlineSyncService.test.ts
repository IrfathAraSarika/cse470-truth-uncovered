import assert from 'node:assert/strict';
import test from 'node:test';
import { screenReport } from './reportScreeningService.js';

test('screens queued report payload during offline sync', () => {
  const queuedPayload = {
    title: 'Illegal bribe demanded for electricity connection',
    description: 'Local sub-station lineman demanded 5000 BDT cash to restore residential line connection.',
    category: 'bribery',
    district: 'Sylhet',
  };

  const screening = screenReport(queuedPayload, []);
  assert.equal(screening.status, 'submitted');
  assert.equal(screening.duplicateScore, 0);
  assert.equal(screening.possibleDuplicates.length, 0);
});

test('detects duplicate queued report against candidate list', () => {
  const queuedPayload = {
    title: 'Extortion at town marketplace',
    description: 'Extortionists demanding weekly payment from local shopkeepers.',
    category: 'extortion',
    district: 'Dhaka',
  };

  const candidates = [
    {
      reportId: 'existing-1',
      title: 'Extortion at town marketplace',
      description: 'Extortionists demanding weekly payment from local shopkeepers.',
      category: 'extortion',
      district: 'Dhaka',
    },
  ];

  const screening = screenReport(queuedPayload, candidates);
  assert.equal(screening.duplicateScore, 100);
  assert.equal(screening.status, 'hidden');
  assert.equal(screening.possibleDuplicates[0]?.reportId, 'existing-1');
});
