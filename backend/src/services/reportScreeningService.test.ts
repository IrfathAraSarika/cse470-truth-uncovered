import assert from 'node:assert/strict';
import test from 'node:test';
import { screenReport } from './reportScreeningService.js';

test('flags a near-identical report as a duplicate', () => {
  const result = screenReport(
    { title: 'Bribe requested at land office', description: 'An officer requested a bribe before accepting the land registration papers.', category: 'bribery', district: 'Dhaka' },
    [{ reportId: 'existing', title: 'Bribe requested at land office', description: 'An officer requested a bribe before accepting the land registration papers.', category: 'bribery', district: 'Dhaka' }],
  );
  assert.equal(result.duplicateScore, 100);
  assert.equal(result.status, 'hidden');
  assert.equal(result.possibleDuplicates[0]?.reportId, 'existing');
});

test('keeps a detailed original report in the submitted queue', () => {
  const result = screenReport(
    { title: 'Unsafe bridge railing near school', description: 'The eastern bridge railing has broken sections beside the primary school and presents a fall risk for children.', category: 'hazard', district: 'Khulna' },
    [],
  );
  assert.equal(result.duplicateScore, 0);
  assert.equal(result.moderationScore, 0);
  assert.equal(result.status, 'submitted');
});

test('hides promotional spam automatically', () => {
  const result = screenReport(
    { title: 'CLICK HERE FOR FREE MONEY', description: 'BUY NOW www.example.com http://example.org AAAAAAAAAAAAA', category: 'other', district: null },
    [],
  );
  assert.equal(result.status, 'hidden');
  assert.ok(result.moderationScore >= 70);
});
