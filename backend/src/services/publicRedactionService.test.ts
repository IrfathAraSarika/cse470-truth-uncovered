import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizePublicKeywords, redactPublicText } from './publicRedactionService.js';

test('removes contact and identifier data from public summaries', () => {
  const result = redactPublicText('Victim called 01712345678, used me@example.com and NID 1234567890.');
  assert.equal(result.includes('01712345678'), false);
  assert.equal(result.includes('me@example.com'), false);
  assert.equal(result.includes('1234567890'), false);
});

test('normalizes safe searchable keywords', () => {
  assert.deepEqual(normalizePublicKeywords([' Bribery ', 'bribery', 'Dhaka', '<script>']), ['bribery', 'dhaka']);
});
