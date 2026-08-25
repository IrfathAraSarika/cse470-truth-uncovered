import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import pg from 'pg';

dotenv.config({ path: '.env.development' });
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) throw new Error('Database and JWT configuration are required.');

const api = process.env.SMOKE_API_URL ?? 'http://localhost:5000/api';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const fixture = { locationId: '', institutionId: '', reportId: '', caseId: '', fameIds: [] };
let connected = false;

async function request(path, token, options = {}) {
  const response = await fetch(`${api}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(token ? { Cookie: `truth_uncovered_session=${token}` } : {}), ...options.headers },
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`${response.status} ${path}: ${body.error ?? body.message ?? 'Request failed'}`);
  return body;
}

try {
  await client.connect();
  connected = true;
  const citizen = (await client.query(`select u.user_id, c.citizen_id from app_users u join citizens c on c.user_id = u.user_id where u.role = 'citizen' limit 1`)).rows[0];
  const admin = (await client.query(`select u.user_id from app_users u join admins a on a.user_id = u.user_id where u.role = 'admin' limit 1`)).rows[0];
  if (!citizen || !admin) throw new Error('Smoke test needs at least one citizen and one administrator profile.');

  const suffix = crypto.randomUUID().slice(0, 8);
  const citizenToken = jwt.sign({ userId: citizen.user_id, role: 'citizen' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const adminToken = jwt.sign({ userId: admin.user_id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  fixture.locationId = (await client.query(`insert into locations (address, district, latitude, longitude) values ('Member 3 smoke fixture', 'Dhaka', 23.8103, 90.4125) returning location_id`)).rows[0].location_id;
  const institution = await request('/admin/transparency/institutions', adminToken, { method: 'POST', body: JSON.stringify({ name: `Member 3 Fixture ${suffix}`, type: 'Smoke test', address: 'Dhaka' }) });
  fixture.institutionId = institution.institution.institution_id;
  fixture.reportId = (await client.query(`insert into reports (citizen_id, location_id, title, description, category, status) values ($1, $2, 'Member 3 smoke report', 'Temporary verified report used for rollback-safe feature testing.', 'corruption', 'verified') returning report_id`, [citizen.citizen_id, fixture.locationId])).rows[0].report_id;
  fixture.caseId = (await client.query(`insert into cases (report_id, status) values ($1, 'action_taken') returning case_id`, [fixture.reportId])).rows[0].case_id;
  await request(`/admin/transparency/reports/${fixture.reportId}/institution`, adminToken, { method: 'POST', body: JSON.stringify({ institutionId: fixture.institutionId }) });

  const root = await request(`/cases/${fixture.caseId}/follow-ups`, citizenToken, { method: 'POST', body: JSON.stringify({ details: 'Initial smoke-test update with verified supporting context.', hasNewEvidence: true, parentFollowUpId: null }) });
  const citizenReply = await request(`/cases/${fixture.caseId}/follow-ups`, citizenToken, { method: 'POST', body: JSON.stringify({ details: 'Recursive reply confirming that the parent relationship is preserved.', hasNewEvidence: false, parentFollowUpId: root.followUp.follow_up_id }) });
  await request(`/cases/${fixture.reportId}/follow-ups`, adminToken, { method: 'POST', body: JSON.stringify({ details: 'Administrator response acknowledging the submitted follow-up evidence.', hasNewEvidence: false, parentFollowUpId: citizenReply.followUp.follow_up_id }) });
  const thread = await request(`/cases/${fixture.caseId}/follow-ups`, citizenToken);
  assert.equal(thread.followUps.length, 3);
  assert.equal(thread.followUps[1].depth, 1);
  assert.equal(thread.followUps[2].depth, 2);
  assert.equal(thread.followUps[2].author_role, 'admin');
  const threadByReport = await request(`/cases/${fixture.reportId}/follow-ups`, citizenToken);
  assert.equal(threadByReport.caseId, fixture.caseId);
  assert.equal(threadByReport.reportId, fixture.reportId);

  const heatmap = await request('/public/heatmap?category=corruption&region=Dhaka&months=12');
  assert.ok(heatmap.points.some((point) => point.district === 'Dhaka'));
  const rankings = await request('/public/institutions/rankings');
  assert.ok(rankings.institutions.some((item) => item.institutionId === fixture.institutionId));
  const fixtureMetric = rankings.institutions.find((item) => item.institutionId === fixture.institutionId);
  assert.equal(typeof fixtureMetric.trustScore, 'number');
  assert.equal(typeof fixtureMetric.redFlagScore, 'number');
  const outcome = await request(`/admin/transparency/cases/${fixture.reportId}/outcome`, adminToken, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'closed', resolutionNotes: 'Smoke test confirms a documented institutional resolution.', closedAt: new Date(Date.now() + 60_000).toISOString() }),
  });
  assert.equal(outcome.case.status, 'closed');
  const closedMetric = outcome.institutions.find((item) => item.institutionId === fixture.institutionId);
  assert.ok(closedMetric.trustScore > fixtureMetric.trustScore);

  const created = await request('/admin/transparency/fame-shame', adminToken, { method: 'POST', body: JSON.stringify({ type: 'fame', name: `Smoke Outcome ${suffix}`, description: 'Temporary approved outcome used to verify the public editorial workflow.', institutionId: fixture.institutionId, caseId: fixture.caseId }) });
  fixture.fameIds.push(created.record.record_id);
  await request(`/admin/transparency/fame-shame/${created.record.record_id}/review`, adminToken, { method: 'POST', body: JSON.stringify({ approved: true }) });
  const wall = await request('/public/fame-shame?type=fame');
  assert.ok(wall.records.some((item) => item.record_id === created.record.record_id));

  const rejected = await request('/admin/transparency/fame-shame', adminToken, { method: 'POST', body: JSON.stringify({ type: 'shame', name: `Rejected Smoke Entry ${suffix}`, description: 'Temporary rejected entry used to verify that rejected content remains private.', institutionId: fixture.institutionId, caseId: fixture.caseId }) });
  fixture.fameIds.push(rejected.record.record_id);
  await request(`/admin/transparency/fame-shame/${rejected.record.record_id}/review`, adminToken, { method: 'POST', body: JSON.stringify({ approved: false }) });
  const adminWall = await request('/admin/transparency/fame-shame', adminToken);
  assert.equal(adminWall.records.find((item) => item.record_id === rejected.record.record_id)?.review_status, 'rejected');
  const publicWall = await request('/public/fame-shame?type=all');
  assert.equal(publicWall.records.some((item) => item.record_id === rejected.record.record_id), false);

  console.log('Member 3 live smoke test passed: follow-ups, heatmap, rankings, trust scores, and Fame/Shame.');
} finally {
  if (connected) {
    if (fixture.fameIds.length) await client.query('delete from fame_shame_records where record_id = any($1::uuid[])', [fixture.fameIds]).catch(() => undefined);
    if (fixture.institutionId) await client.query('delete from trust_scores where institution_id = $1', [fixture.institutionId]).catch(() => undefined);
    if (fixture.reportId) await client.query('delete from reports where report_id = $1', [fixture.reportId]).catch(() => undefined);
    if (fixture.institutionId) await client.query('delete from institutions where institution_id = $1', [fixture.institutionId]).catch(() => undefined);
    if (fixture.locationId) await client.query('delete from locations where location_id = $1', [fixture.locationId]).catch(() => undefined);
    await client.end().catch(() => undefined);
  }
}
