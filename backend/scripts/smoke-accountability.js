import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import pg from 'pg';

dotenv.config({ path: '.env.development' });
if (!process.env.DATABASE_URL || !process.env.JWT_SECRET) throw new Error('Database and JWT configuration are required.');
const api = process.env.SMOKE_API_URL ?? 'http://localhost:5000/api';
const client = new pg.Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
const fixture = { userId: '', locationId: '', reportId: '', noticeId: '' };

async function request(path, token = '', options = {}) {
  const response = await fetch(`${api}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(token ? { Cookie: `truth_uncovered_session=${token}` } : {}), ...options.headers } });
  const body = response.status === 204 ? null : await response.json();
  if (!response.ok) throw new Error(`${response.status} ${path}: ${body?.error ?? 'Request failed'}`);
  return body;
}

try {
  await client.connect();
  const owner = (await client.query(`select u.user_id, z.citizen_id from app_users u join citizens z on z.user_id = u.user_id where u.role = 'citizen' limit 1`)).rows[0];
  const admin = (await client.query(`select u.user_id from app_users u join admins a on a.user_id = u.user_id where u.role = 'admin' limit 1`)).rows[0];
  if (!owner || !admin) throw new Error('Smoke test requires an existing citizen and administrator.');
  fixture.userId = crypto.randomUUID();
  const witnessCitizenId = crypto.randomUUID();
  const fixtureEmail = `fixture-${crypto.randomUUID()}@example.test`;
  await client.query(`insert into app_users (user_id, full_name, email, password_hash, role) values ($1, 'Accountability Fixture Witness', $2, 'not-used', 'citizen')`, [fixture.userId, fixtureEmail]);
  await client.query(
    `insert into citizens (citizen_id, user_id, email, "fullName", "passwordHash", "isVerified")
     values ($1, $2, $3, 'Accountability Fixture Witness', 'not-used', false)`,
    [witnessCitizenId, fixture.userId, fixtureEmail],
  );
  fixture.locationId = (await client.query(`insert into locations (address, district, division, latitude, longitude) values ('Fixture address', 'Dhaka', 'Dhaka', 23.81, 90.41) returning location_id`)).rows[0].location_id;
  const report = (await client.query(
    `insert into reports (citizen_id, location_id, title, description, category, status, is_anonymous) values ($1, $2, 'Procurement irregularity near service office', 'Private owner narrative', 'corruption', 'verified', false) returning report_id, reference_no`,
    [owner.citizen_id, fixture.locationId],
  )).rows[0]; fixture.reportId = report.report_id;
  const caseRow = (await client.query(`insert into cases (report_id, status, closed_at, resolution_notes) values ($1, 'closed', now(), 'Initial decision recorded.') returning case_id, reference_no`, [fixture.reportId])).rows[0];
  const ownerToken = jwt.sign({ userId: owner.user_id, role: 'citizen' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const witnessToken = jwt.sign({ userId: fixture.userId, role: 'citizen' }, process.env.JWT_SECRET, { expiresIn: '5m' });
  const adminToken = jwt.sign({ userId: admin.user_id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '5m' });

  const tracked = await request(`/cases/${caseRow.reference_no}`, ownerToken);
  assert.equal(tracked.case.reference_no, caseRow.reference_no);
  const followUp = await request(`/cases/${report.reference_no}/follow-ups`, ownerToken, { method: 'POST', body: JSON.stringify({ details: 'Reference-based follow-up used for integration verification.', hasNewEvidence: false, parentFollowUpId: null }) });
  assert.equal(followUp.followUp.case_id, caseRow.case_id);

  const safety = await request('/accountability/safety', ownerToken, { method: 'POST', body: JSON.stringify({ caseReference: caseRow.reference_no, scheduledFor: new Date(Date.now() + 3_600_000).toISOString(), privateMessage: 'Private safety context.' }) });
  await request(`/accountability/safety/${safety.checkIn.check_in_id}/respond`, ownerToken, { method: 'PATCH', body: JSON.stringify({ status: 'needs_help', privateMessage: 'Confidential help requested.' }) });
  await request(`/admin/accountability/safety/${safety.checkIn.check_in_id}/resolve`, adminToken, { method: 'PATCH', body: JSON.stringify({ resolutionNote: 'Administrator contacted the reporter through the protected channel.' }) });

  const appeal = await request('/accountability/appeals', ownerToken, { method: 'POST', body: JSON.stringify({ caseReference: caseRow.reference_no, reason: 'The documented action does not address the material evidence submitted with the original complaint.', requestedOutcome: 'Independent review of the recorded outcome' }) });
  await request(`/admin/accountability/appeals/${appeal.appeal.appeal_id}`, adminToken, { method: 'PATCH', body: JSON.stringify({ status: 'approved', adminNotes: 'Independent review accepted and assigned for reassessment.' }) });

  await request('/accountability/subscriptions', witnessToken, { method: 'POST', body: JSON.stringify({ district: 'Dhaka', category: 'corruption', channel: 'in_app', frequency: 'instant' }) });
  await request(`/admin/accountability/publication/${report.reference_no}`, adminToken, { method: 'PATCH', body: JSON.stringify({ summary: 'A victim reported an irregular procurement request. Contact 01712345678 or leak@example.com, NID 1234567890.', victimContext: 'Local service recipient', keywords: ['procurement', 'Dhaka', '<unsafe>'], isPublic: true }) });
  const directory = await request(`/repository?q=${report.reference_no}`);
  assert.equal(directory.totalCount, 1);
  const publicText = JSON.stringify(directory);
  assert.equal(publicText.includes('01712345678'), false); assert.equal(publicText.includes('leak@example.com'), false); assert.equal(publicText.includes('1234567890'), false);
  const alerts = await request('/accountability/notifications', witnessToken);
  assert.ok(alerts.notifications.some((item) => item.message.includes(report.reference_no)));

  const witness = await request('/accountability/witnesses', witnessToken, { method: 'POST', body: JSON.stringify({ reportReference: report.reference_no, relationship: 'Eyewitness near the service counter', statement: 'I observed the transaction request and can independently confirm when and where it occurred.', evidenceUrl: 'https://example.com/evidence-receipt', consentToContact: true }) });
  await request(`/admin/accountability/witnesses/${witness.contribution.contribution_id}`, adminToken, { method: 'PATCH', body: JSON.stringify({ status: 'accepted', adminNotes: 'Statement is relevant and independently corroborates the event.' }) });
  const corroborated = await request(`/repository?q=${caseRow.reference_no}`);
  assert.equal(corroborated.reports[0].corroborating_witnesses, 1);
  assert.equal(JSON.stringify(corroborated).includes('Accountability Fixture Witness'), false);
  assert.equal(JSON.stringify(corroborated).includes('I observed the transaction'), false);

  const notice = await request('/admin/accountability/institution-notices', adminToken, { method: 'POST', body: JSON.stringify({ reference: caseRow.reference_no, officeName: 'Public Procurement Authority', websiteUrl: 'https://example.gov.bd/contact', contactEmail: 'contact@example.gov.bd', subject: 'Request for official review', publicMessage: 'Please review the referenced verified incident through your official complaint process. Call 01712345678.', method: 'website' }) });
  fixture.noticeId = notice.notice.notification_id;
  assert.equal(notice.notice.public_message.includes('01712345678'), false);
  await request(`/admin/accountability/institution-notices/${fixture.noticeId}`, adminToken, { method: 'PATCH', body: JSON.stringify({ status: 'sent', externalReference: 'WEB-RECEIPT-1001' }) });
  console.log('Accountability live smoke test passed: references, privacy search, safety, appeals, alerts, witnesses, and external office notices.');
} finally {
  if (fixture.noticeId) await client.query('delete from institution_notifications where notification_id = $1', [fixture.noticeId]).catch(() => undefined);
  if (fixture.reportId) await client.query('delete from reports where report_id = $1', [fixture.reportId]).catch(() => undefined);
  if (fixture.locationId) await client.query('delete from locations where location_id = $1', [fixture.locationId]).catch(() => undefined);
  if (fixture.userId) await client.query('delete from app_users where user_id = $1', [fixture.userId]).catch(() => undefined);
  await client.end().catch(() => undefined);
}
