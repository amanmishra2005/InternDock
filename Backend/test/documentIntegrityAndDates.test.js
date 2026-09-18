const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const { resolveApplicationDetails } = require('../utils/documentVerification');
const { generateOfferLetterPdf, generateCertificatePdf, TEMPLATE_VERSION } = require('../utils/generatePdf');

test('resolveApplicationDetails resolves student name, college name, and dates accurately', () => {
  const mockApplication = {
    applicationId: 'IND-2026-0001',
    studentName: 'Aarav Sharma',
    collegeName: 'National Institute of Technology',
    domain: { name: 'Full Stack Web Development' },
    duration: { weeks: 6, label: '6 Weeks Track' },
    startDate: new Date('2026-10-01'),
    endDate: new Date('2026-11-11'),
  };

  const details = resolveApplicationDetails(mockApplication);
  assert.equal(details.studentName, 'Aarav Sharma');
  assert.equal(details.collegeName, 'National Institute of Technology');
  assert.equal(details.domainName, 'Full Stack Web Development');
  assert.equal(details.durationWeeks, 6);
  assert.equal(details.durationLabel, '6 Weeks Track');
  assert.equal(details.startDate.toISOString().slice(0, 10), '2026-10-01');
  assert.equal(details.endDate.toISOString().slice(0, 10), '2026-11-11');
});

test('resolveApplicationDetails falls back to student user object when application fields are omitted', () => {
  const mockApplication = {
    applicationId: 'IND-2026-0002',
    domain: { name: 'Machine Learning & AI' },
    duration: { weeks: 4, label: '4 Weeks Track' },
    student: {
      fullName: 'Priya Patel',
      college: 'BITS Pilani',
      email: 'priya@example.com',
    },
  };

  const details = resolveApplicationDetails(mockApplication);
  assert.equal(details.studentName, 'Priya Patel');
  assert.equal(details.collegeName, 'BITS Pilani');
  assert.equal(details.studentEmail, 'priya@example.com');
  assert.equal(details.domainName, 'Machine Learning & AI');
  // Dates should be auto-calculated without throwing
  assert.ok(details.startDate instanceof Date);
  assert.ok(details.endDate instanceof Date);
  assert.ok(details.endDate > details.startDate);
});

test('generateOfferLetterPdf generates a valid PDF file with student name and college', async () => {
  const pdfUrl = await generateOfferLetterPdf({
    studentName: 'Rohan Gupta',
    collegeName: 'Delhi Technological University',
    domainName: 'Cloud Computing & DevOps',
    durationLabel: '8 Weeks Track',
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-10-26'),
    issueDate: new Date('2026-08-25'),
    applicationId: 'IND-2026-0099',
    referenceId: 'OFFER-TEST-0099',
    verificationId: 'VERIFY-TEST-0099',
  });

  assert.ok(pdfUrl.includes('offer-OFFER-TEST-0099.pdf'));
  const fullPath = path.join(__dirname, '..', pdfUrl);
  assert.ok(fs.existsSync(fullPath), 'Offer letter PDF was created on disk');
  const stats = fs.statSync(fullPath);
  assert.ok(stats.size > 1000, 'PDF has non-trivial file size');

  // Clean up test file
  try { fs.unlinkSync(fullPath); } catch (e) {}
});

test('generateCertificatePdf generates a valid PDF with college and clean narrative', async () => {
  const pdfUrl = await generateCertificatePdf({
    studentName: 'Rohan Gupta',
    collegeName: 'Delhi Technological University',
    domainName: 'Cloud Computing & DevOps',
    durationLabel: '8 Weeks Track',
    startDate: new Date('2026-09-01'),
    endDate: new Date('2026-10-26'),
    issueDate: new Date('2026-10-27'),
    certificateId: 'CERT-TEST-0099',
    verificationId: 'VERIFY-CERT-0099',
  });

  assert.ok(pdfUrl.includes('certificate-CERT-TEST-0099.pdf'));
  const fullPath = path.join(__dirname, '..', pdfUrl);
  assert.ok(fs.existsSync(fullPath), 'Certificate PDF was created on disk');
  const stats = fs.statSync(fullPath);
  assert.ok(stats.size > 1000, 'Certificate PDF has non-trivial file size');

  // Clean up test file
  try { fs.unlinkSync(fullPath); } catch (e) {}
});
