const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  appendToSpreadsheet,
  readSpreadsheet,
  resolveSheetSchema,
  sanitizeAndFormatRecord,
} = require('../utils/spreadsheetStorage');

test('resolveSheetSchema correctly identifies canonical sheets and aliases', () => {
  assert.equal(resolveSheetSchema('applications')?.name, 'applications');
  assert.equal(resolveSheetSchema('application')?.name, 'applications');
  assert.equal(resolveSheetSchema('payments')?.name, 'payments');
  assert.equal(resolveSheetSchema('offer_letters')?.name, 'offer_letters');
  assert.equal(resolveSheetSchema('offerletter')?.name, 'offer_letters');
  assert.equal(resolveSheetSchema('submissions')?.name, 'submissions');
  assert.equal(resolveSheetSchema('final_reports')?.name, 'final_projects');
  assert.equal(resolveSheetSchema('final_projects')?.name, 'final_projects');
  assert.equal(resolveSheetSchema('finalprojects')?.name, 'final_projects');
  assert.equal(resolveSheetSchema('certificates')?.name, 'certificates');
  assert.equal(resolveSheetSchema('contact_queries')?.name, 'contact_queries');
  assert.equal(resolveSheetSchema('contactquery')?.name, 'contact_queries');

  // Email logs or unrecognized sheets must be null
  assert.equal(resolveSheetSchema('emails'), null);
  assert.equal(resolveSheetSchema('mail_logs'), null);
  assert.equal(resolveSheetSchema('sent_emails'), null);
});

test('sanitizeAndFormatRecord formats human-readable applications record and strips internal IDs', () => {
  const raw = {
    applicationId: 'INT-2026-0042',
    studentId: 'mongo_student_66de',
    domainId: 'mongo_domain_99ab',
    durationId: 'mongo_duration_12cd',
    studentName: 'Aarav Sharma',
    studentEmail: 'aarav@example.com',
    phoneNumber: '+91 9876543210',
    collegeName: 'IIT Bombay',
    degree: 'B.Tech CSE',
    graduationYear: '2027',
    domainName: 'Full Stack MERN',
    durationLabel: '6 Weeks Track',
    startDate: '2026-10-01',
    endDate: '2026-11-12',
    fee: 100,
    paymentStatus: 'Pending',
    status: 'Submitted',
  };

  const sanitized = sanitizeAndFormatRecord('applications', raw);
  assert.ok(sanitized);
  assert.equal(sanitized.canonicalSheetName, 'applications');

  const keys = Object.keys(sanitized.data);
  // Must NOT include raw Mongo IDs
  assert.ok(!keys.includes('studentId'));
  assert.ok(!keys.includes('domainId'));
  assert.ok(!keys.includes('durationId'));

  // Must include clean human-readable headers
  assert.equal(sanitized.data['Application ID'], 'INT-2026-0042');
  assert.equal(sanitized.data['Student Name'], 'Aarav Sharma');
  assert.equal(sanitized.data['Student Email'], 'aarav@example.com');
  assert.equal(sanitized.data['Phone Number'], '+91 9876543210');
  assert.equal(sanitized.data['College / University'], 'IIT Bombay');
  assert.equal(sanitized.data['Internship Domain'], 'Full Stack MERN');
  assert.equal(sanitized.data['Track Duration'], '6 Weeks Track');
  assert.equal(sanitized.data['Program Fee (INR)'], 100);
  assert.equal(sanitized.data['Payment Status'], 'Pending');
  assert.equal(sanitized.data['Application Status'], 'Submitted');
});

test('sanitizeAndFormatRecord formats human-readable payments record', () => {
  const raw = {
    applicationId: 'INT-2026-0042',
    studentName: 'Aarav Sharma',
    studentEmail: 'aarav@example.com',
    domainName: 'Full Stack MERN',
    amount: 100,
    status: 'Successful',
    utrNumber: 'UTR-99887766',
    payerName: 'Aarav Sharma',
    orderId: 'order_12345',
  };

  const sanitized = sanitizeAndFormatRecord('payments', raw);
  assert.ok(sanitized);
  assert.equal(sanitized.canonicalSheetName, 'payments');
  assert.equal(sanitized.data['Application ID'], 'INT-2026-0042');
  assert.equal(sanitized.data['Student Name'], 'Aarav Sharma');
  assert.equal(sanitized.data['Amount (INR)'], 100);
  assert.equal(sanitized.data['Payment Status'], 'Successful');
  assert.equal(sanitized.data['UTR / Transaction ID'], 'UTR-99887766');
  assert.equal(sanitized.data['Order ID'], 'order_12345');
});

test('sanitizeAndFormatRecord formats human-readable submissions record', () => {
  const raw = {
    applicationId: 'INT-2026-0042',
    studentName: 'Aarav Sharma',
    studentEmail: 'aarav@example.com',
    domainName: 'Full Stack MERN',
    taskNumber: 'Day 3',
    taskTitle: 'Build React Component Library',
    githubUrl: 'https://github.com/example/repo',
    liveUrl: 'https://example.com/demo',
    status: 'Submitted',
  };

  const sanitized = sanitizeAndFormatRecord('submissions', raw);
  assert.ok(sanitized);
  assert.equal(sanitized.canonicalSheetName, 'submissions');
  assert.equal(sanitized.data['Task Number'], 'Day 3');
  assert.equal(sanitized.data['Task Title'], 'Build React Component Library');
  assert.equal(sanitized.data['GitHub URL'], 'https://github.com/example/repo');
  assert.equal(sanitized.data['Live Demo URL'], 'https://example.com/demo');
});

test('sanitizeAndFormatRecord formats human-readable final capstone projects record', () => {
  const raw = {
    applicationId: 'INT-2026-0042',
    studentName: 'Aarav Sharma',
    studentEmail: 'aarav@example.com',
    collegeName: 'IIT Bombay',
    domainName: 'Full Stack MERN',
    projectTitle: 'E-Commerce Platform with Microservices',
    githubUrl: 'https://github.com/example/final-project',
    liveUrl: 'https://final-project.example.com',
    executiveSummary: 'Full-featured web application with authentication and payment gateway.',
    status: 'Submitted',
  };

  const sanitized = sanitizeAndFormatRecord('final_projects', raw);
  assert.ok(sanitized);
  assert.equal(sanitized.canonicalSheetName, 'final_projects');
  assert.equal(sanitized.data['Project Title'], 'E-Commerce Platform with Microservices');
  assert.equal(sanitized.data['GitHub Repository URL'], 'https://github.com/example/final-project');
  assert.equal(sanitized.data['Hosted Live Demo URL'], 'https://final-project.example.com');
});

test('appendToSpreadsheet safely rejects email logs and unrecognized sheets', async () => {
  const emailLogResult = await appendToSpreadsheet('emails', { to: 'student@example.com', body: 'Test' });
  assert.equal(emailLogResult, false, 'Email logging sheet is completely blocked from spreadsheet storage');

  const randomSheetResult = await appendToSpreadsheet('arbitrary_debug_log', { data: 123 });
  assert.equal(randomSheetResult, false, 'Unallowed sheet names are blocked');
});

test('appendToSpreadsheet appends and readSpreadsheet provides camelCase aliases', async () => {
  const testId = `INT-TEST-${Date.now()}`;
  await appendToSpreadsheet('applications', {
    applicationId: testId,
    studentName: 'Integration Tester',
    studentEmail: 'tester@example.com',
    collegeName: 'Test Tech Institute',
    domainName: 'DevOps Track',
    durationLabel: '4 Weeks Track',
    startDate: '2026-10-01',
    endDate: '2026-10-28',
    fee: 100,
    paymentStatus: 'Successful',
    status: 'Selected',
  });

  const rows = readSpreadsheet('applications');
  const found = rows.find((r) => r.applicationId === testId || r['Application ID'] === testId);
  assert.ok(found, 'Appended row was found in spreadsheet');
  assert.equal(found.studentName, 'Integration Tester');
  assert.equal(found.studentEmail, 'tester@example.com');
  assert.equal(found['Internship Domain'], 'DevOps Track');
  assert.equal(found.domain, 'DevOps Track');
});
