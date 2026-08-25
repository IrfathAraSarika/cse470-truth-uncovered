import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config({ path: '.env.development' });

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required.');

const client = new pg.Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const clearOnly = process.argv.includes('--clear');
const legacyPrefix = '[Demo]';

const institutions = [
  { key: 'integrity', name: 'National Integrity Response Unit', type: 'Oversight agency', address: 'Dhaka' },
  { key: 'procurement', name: 'Dhaka Public Procurement Office', type: 'Government office', address: 'Dhaka' },
  { key: 'port', name: 'Chattogram Port Services', type: 'Public authority', address: 'Chattogram' },
  { key: 'land', name: 'Regional Land Records Directorate', type: 'Government office', address: 'Rajshahi' },
];

const wallNames = [
  'Rapid Contract Audit Response',
  'Port Fee Refund Initiative',
  'Unresolved Procurement Complaints',
  'Land Record Service Delays',
];

const incidents = [
  ['integrity', 'Dhaka', 23.8103, 90.4125, 'corruption', 'closed', 'closed', 42, 5, 'Audit team stopped an inflated public supply contract'],
  ['integrity', 'Sylhet', 24.8949, 91.8687, 'bribery', 'closed', 'closed', 35, 8, 'Citizen evidence led to disciplinary action'],
  ['integrity', 'Rangpur', 25.7439, 89.2752, 'extortion', 'verified', 'action_taken', 24, null, 'Illegal collection point removed after verification'],
  ['procurement', 'Dhaka', 23.7937, 90.4066, 'corruption', 'verified', 'under_investigation', 54, null, 'Tender requirements allegedly tailored for one bidder'],
  ['procurement', 'Dhaka', 23.7465, 90.376, 'bribery', 'verified', 'received', 47, null, 'Payment requested before releasing contractor documents'],
  ['procurement', 'Dhaka', 23.8223, 90.3654, 'corruption', 'verified', 'under_investigation', 39, null, 'Duplicate invoices found in a road maintenance package'],
  ['procurement', 'Mymensingh', 24.7471, 90.4203, 'corruption', 'verified', 'received', 31, null, 'Bid evaluation scores changed without recorded justification'],
  ['procurement', 'Barishal', 22.701, 90.3535, 'bribery', 'verified', 'received', 19, null, 'Unofficial fee requested during vendor registration'],
  ['procurement', 'Dhaka', 23.7808, 90.4071, 'corruption', 'verified', 'under_investigation', 12, null, 'Undisclosed conflict of interest in equipment purchase'],
  ['port', 'Chattogram', 22.3569, 91.7832, 'extortion', 'closed', 'closed', 68, 18, 'Unauthorized gate payment investigated and refunded'],
  ['port', 'Chattogram', 22.335, 91.8325, 'bribery', 'closed', 'closed', 51, 24, 'Broker payment scheme confirmed by internal review'],
  ['port', 'Khulna', 22.8456, 89.5403, 'corruption', 'verified', 'action_taken', 33, null, 'Cargo inspection roster corrected after manipulation report'],
  ['port', 'Chattogram', 22.367, 91.812, 'extortion', 'verified', 'under_investigation', 15, null, 'Drivers reported repeated unofficial unloading charges'],
  ['land', 'Rajshahi', 24.3745, 88.6042, 'land_grabbing', 'verified', 'under_investigation', 73, null, 'Public land boundary altered in registry copy'],
  ['land', 'Rajshahi', 24.3636, 88.6241, 'bribery', 'verified', 'received', 62, null, 'Mutation application delayed pending unofficial payment'],
  ['land', 'Khulna', 22.8295, 89.532, 'land_grabbing', 'closed', 'closed', 58, 39, 'Forged ownership transfer reversed after investigation'],
  ['land', 'Rangpur', 25.755, 89.244, 'bribery', 'verified', 'under_investigation', 44, null, 'Fee demanded to correct a digitization error'],
  ['land', 'Mymensingh', 24.759, 90.398, 'corruption', 'verified', 'received', 28, null, 'Missing deed records linked to an unauthorized intermediary'],
  ['land', 'Sylhet', 24.904, 91.861, 'land_grabbing', 'verified', 'under_investigation', 20, null, 'Wetland parcel recorded under a private holding'],
  ['land', 'Barishal', 22.713, 90.367, 'bribery', 'verified', 'action_taken', 11, null, 'Service counter reassigned after payment complaint'],
];

function calculateScores(metric) {
  const actionRate = metric.totalCases ? (metric.actionedCases / metric.totalCases) * 100 : 0;
  const speed = metric.averageResolutionDays === null ? 0 : Math.max(0, Math.min(100, 100 - metric.averageResolutionDays * 2.5));
  const trust = metric.totalCases ? Math.max(0, Math.min(100, actionRate * 0.7 + speed * 0.3)) : 0;
  const unresolved = metric.totalCases ? ((metric.totalCases - metric.closedCases) / metric.totalCases) * 100 : 0;
  const volume = Math.max(0, Math.min(100, metric.verifiedReports * 10));
  const redFlag = metric.verifiedReports ? Math.max(0, Math.min(100, volume * 0.55 + unresolved * 0.45)) : 0;
  return { trust: Math.round(trust * 100) / 100, redFlag: Math.round(redFlag * 100) / 100 };
}

async function clearDemoData() {
  await client.query(`delete from fame_shame_records where name like $1 or name = any($2::text[])`, [`${legacyPrefix}%`, wallNames]);
  await client.query(`delete from reports where title like $1 or title = any($2::text[])`, [`${legacyPrefix}%`, incidents.map((item) => item[9])]);
  await client.query(`delete from locations where address like $1 or address like 'Presentation location %'`, [`${legacyPrefix}%`]);
  await client.query(`delete from institutions where name like $1 or name = any($2::text[])`, [`${legacyPrefix}%`, institutions.map((item) => item.name)]);
}

try {
  await client.connect();
  await client.query('begin');
  await clearDemoData();

  if (clearOnly) {
    await client.query('commit');
    console.log('Member 3 presentation data removed.');
  } else {
    const citizen = (await client.query(`select citizen_id from citizens order by created_at limit 1`)).rows[0];
    const admin = (await client.query(`select admin_id from admins order by created_at limit 1`)).rows[0];
    if (!citizen || !admin) throw new Error('Seeding requires at least one citizen and one admin profile.');

    const institutionIds = new Map();
    for (const institution of institutions) {
      const row = (await client.query(
        `insert into institutions (name, type, address) values ($1, $2, $3) returning institution_id`,
        [institution.name, institution.type, institution.address],
      )).rows[0];
      institutionIds.set(institution.key, row.institution_id);
    }

    const cases = [];
    for (let index = 0; index < incidents.length; index += 1) {
      const [institutionKey, district, latitude, longitude, category, reportStatus, caseStatus, ageDays, resolutionDays, title] = incidents[index];
      const location = (await client.query(
        `insert into locations (address, district, division, latitude, longitude)
         values ($1, $2, $2, $3, $4) returning location_id`,
        [`Presentation location ${index + 1}, ${district}`, district, latitude, longitude],
      )).rows[0];
      const submittedAt = new Date(Date.now() - ageDays * 86400000);
      const report = (await client.query(
        `insert into reports
           (citizen_id, location_id, institution_id, title, description, category, incident_datetime, status, is_anonymous, submission_date,
            public_summary, victim_context, public_keywords, is_public)
         values ($1, $2, $3, $4, $5, $6, $7, $8, true, $7, $9, $10, $11, true) returning report_id`,
        [citizen.citizen_id, location.location_id, institutionIds.get(institutionKey), title, `${title}. Supporting records and witness details were submitted for verification.`, category, submittedAt, reportStatus,
          `A verified ${category} incident was reported in ${district}.`, `People seeking public services in ${district}.`, [category, district]],
      )).rows[0];
      const closedAt = resolutionDays === null ? null : new Date(submittedAt.getTime() + resolutionDays * 86400000);
      const caseRow = (await client.query(
        `insert into cases (report_id, status, opened_at, closed_at, resolution_notes)
         values ($1, $2, $3, $4, $5) returning case_id`,
        [report.report_id, caseStatus, submittedAt, closedAt, closedAt ? 'Case resolved after documented institutional action.' : null],
      )).rows[0];
      cases.push({ caseId: caseRow.case_id, citizenId: citizen.citizen_id, institutionKey, caseStatus });
    }

    const threadCase = cases[0];
    const root = (await client.query(
      `insert into follow_up_reports (case_id, citizen_id, details, has_new_evidence, follow_up_date)
       values ($1, $2, $3, true, now() - interval '4 days') returning follow_up_id`,
      [threadCase.caseId, threadCase.citizenId, 'Uploaded procurement invoice copies and the original tender notice for comparison.'],
    )).rows[0];
    const reply = (await client.query(
      `insert into follow_up_reports (case_id, citizen_id, parent_follow_up_id, details, has_new_evidence, follow_up_date)
       values ($1, $2, $3, $4, false, now() - interval '3 days') returning follow_up_id`,
      [threadCase.caseId, threadCase.citizenId, root.follow_up_id, 'Confirmed that the invoice numbers match the documents submitted with the original report.'],
    )).rows[0];
    await client.query(
      `insert into follow_up_reports (case_id, citizen_id, parent_follow_up_id, details, has_new_evidence, follow_up_date)
       values ($1, $2, $3, $4, true, now() - interval '2 days')`,
      [threadCase.caseId, threadCase.citizenId, reply.follow_up_id, 'Added a dated acknowledgement showing that the institution received the evidence.'],
    );

    const metricRows = (await client.query(
      `select i.institution_id,
              count(distinct r.report_id) filter (where r.status in ('verified', 'closed'))::int verified_reports,
              count(distinct c.case_id)::int total_cases,
              count(distinct c.case_id) filter (where c.status in ('action_taken', 'closed'))::int actioned_cases,
              count(distinct c.case_id) filter (where c.status = 'closed')::int closed_cases,
              avg(extract(epoch from (c.closed_at - c.opened_at)) / 86400.0)
                filter (where c.closed_at is not null)::float average_resolution_days
         from institutions i
         left join reports r on r.institution_id = i.institution_id
         left join cases c on c.report_id = r.report_id
        where i.name = any($1::text[]) group by i.institution_id`,
      [institutions.map((item) => item.name)],
    )).rows;
    for (const row of metricRows) {
      const metric = {
        verifiedReports: Number(row.verified_reports), totalCases: Number(row.total_cases),
        actionedCases: Number(row.actioned_cases), closedCases: Number(row.closed_cases),
        averageResolutionDays: row.average_resolution_days === null ? null : Number(row.average_resolution_days),
      };
      const scores = calculateScores(metric);
      const notes = JSON.stringify({ ...metric, redFlagScore: scores.redFlag, source: 'presentation-demo' });
      await client.query(`update institutions set trust_score = $2, red_flag_score = $3 where institution_id = $1`, [row.institution_id, scores.trust, scores.redFlag]);
      await client.query(`insert into trust_scores (institution_id, score, metric_notes) values ($1, $2, $3)`, [row.institution_id, scores.trust, notes]);
    }

    const wall = [
      ['fame', wallNames[0], 'Recognized for stopping an inflated contract and publishing corrective action.', 'integrity', cases[0].caseId],
      ['fame', wallNames[1], 'Recognized for refunding unauthorized charges and disciplining responsible staff.', 'port', cases[9].caseId],
      ['shame', wallNames[2], 'Listed after several verified complaints remained unresolved beyond the review period.', 'procurement', cases[3].caseId],
      ['shame', wallNames[3], 'Listed for repeated verified complaints involving unofficial fees and delayed corrections.', 'land', cases[14].caseId],
    ];
    for (const [type, name, description, institutionKey, caseId] of wall) {
      await client.query(
        `insert into fame_shame_records
           (institution_id, case_id, type, name, description, is_approved, review_status, reviewed_by_admin_id, reviewed_at)
         values ($1, $2, $3, $4, $5, true, 'approved', $6, now())`,
        [institutionIds.get(institutionKey), caseId, type, name, description, admin.admin_id],
      );
    }

    await client.query('commit');
    console.log(`Member 3 presentation data ready: ${incidents.length} incidents, ${institutions.length} institutions, 3 follow-ups, and ${wall.length} wall entries.`);
    console.log(`Follow-up demo case ID: ${threadCase.caseId}`);
  }
} catch (error) {
  await client.query('rollback').catch(() => undefined);
  throw error;
} finally {
  await client.end().catch(() => undefined);
}
