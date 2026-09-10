const test = require('node:test');
const assert = require('node:assert/strict');
const { appendToSpreadsheet } = require('../utils/spreadsheetStorage');

test('appendToSpreadsheet returns a promise-like write handle for the application ledger write', async () => {
  const writeHandle = appendToSpreadsheet('applications', {
    applicationId: 'INT-2026-00001',
    studentId: 'student-1',
    studentName: 'Test Student',
    studentEmail: 'student@example.com',
    domainId: 'domain-1',
    domainName: 'AI',
    durationId: 'duration-1',
    durationWeeks: 4,
    startDate: '2026-09-10',
    endDate: '2026-10-10',
    fee: 100,
    paymentStatus: 'Pending',
    status: 'Submitted',
    statusHistory: 'Submitted',
  });

  assert.equal(typeof writeHandle?.then, 'function');
});
