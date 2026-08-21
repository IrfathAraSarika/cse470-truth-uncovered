import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateFraudAndSpamRisk } from './fraudSpamModerationService.js';

test('flags excessive uppercase text as spam risk', () => {
  const result = evaluateFraudAndSpamRisk({
    title: 'CLICK HERE NOW FOR FREE CASH BONUSES',
    description: 'GREAT OPPORTUNITY WIN BIG MONEY FAST FAST FAST',
  });
  assert.ok(result.capsScore >= 70);
  assert.ok(result.totalRiskScore >= 50);
});

test('flags financial scam keywords and auto-hides report', () => {
  const result = evaluateFraudAndSpamRisk({
    title: 'Send money to get job at land ministry',
    description: 'Send Bikash money to get job appointment letter immediately. Advance payment required.',
  });
  assert.equal(result.fraudScamScore, 100);
  assert.equal(result.isAutoHidden, true);
});

test('passes clean genuine report without fraud flags', () => {
  const result = evaluateFraudAndSpamRisk({
    title: 'Bribery requested at sub-registry office',
    description: 'The clerk demanded BDT 2000 fee for land deed document processing.',
  });
  assert.equal(result.totalRiskScore, 0);
  assert.equal(result.isAutoHidden, false);
});
