const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const {
  generateOfferLetterPdf,
  generateCertificatePdf,
  findChromeExecutable,
} = require('../utils/generatePdf');
const {
  renderOfferLetterHtml,
  renderCertificateHtml,
} = require('../../shared/documentTemplates');

function getPdfPageCount(buffer) {
  const content = buffer.toString('latin1');
  const matches = content.match(/\/Type\s*\/Page\b/g);
  return matches ? matches.length : 1;
}

test('findChromeExecutable successfully detects headless browser on system', () => {
  const exe = findChromeExecutable();
  assert.ok(exe, 'A valid Chrome/Chromium executable was found');
  assert.ok(fs.existsSync(exe), 'Executable path exists on disk');
});

test('Shared renderOfferLetterHtml produces valid HTML with all expected elements', () => {
  const html = renderOfferLetterHtml({
    studentName: 'Alex Rivera',
    collegeName: 'Aston University',
    domainName: 'Full Stack MERN Web Development',
    durationLabel: '4 Weeks Track',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    issueDate: '2026-07-25',
    applicationId: 'APP-2026-8812',
    referenceId: 'OFFER-IND-2026-7731',
  }, { mode: 'preview', bodyOnly: true });

  assert.ok(html.includes('Alex Rivera'));
  assert.ok(html.includes('Aston University'));
  assert.ok(html.includes('Full Stack MERN Web Development'));
  assert.ok(html.includes('4 Weeks Track'));
  assert.ok(html.includes('APP-2026-8812'));
  assert.ok(html.includes('OFFER-IND-2026-7731'));
  assert.ok(html.includes('doc-corner corner-tl'));
  assert.ok(html.includes('doc-footer-seals'));
  assert.ok(html.includes('Aman Mishra'));
});

test('Shared renderCertificateHtml produces valid HTML with all expected elements', () => {
  const html = renderCertificateHtml({
    studentName: 'Alex Rivera',
    collegeName: 'Aston University',
    domainName: 'Full Stack MERN Web Development',
    durationLabel: '4 Weeks Track',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    certificateId: 'CERT-IND-2026-9842',
  }, { mode: 'preview', bodyOnly: true });

  assert.ok(html.includes('Alex Rivera'));
  assert.ok(html.includes('Aston University'));
  assert.ok(html.includes('Full Stack MERN Web Development'));
  assert.ok(html.includes('CERT-IND-2026-9842'));
  assert.ok(html.includes('Certificate of Completion'));
  assert.ok(html.includes('Aman Mishra'));
});

test('generateOfferLetterPdf generates exactly 1 page for standard student profile', async () => {
  const pdfUrl = await generateOfferLetterPdf({
    studentName: 'Alex Rivera',
    collegeName: 'Aston University',
    domainName: 'Full Stack MERN Web Development',
    durationLabel: '4 Weeks Track',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    issueDate: '2026-07-25',
    applicationId: 'APP-STD-001',
    referenceId: 'OFFER-STD-001',
  });

  const fullPath = path.join(__dirname, '..', pdfUrl);
  assert.ok(fs.existsSync(fullPath), 'PDF exists on disk');
  const buffer = fs.readFileSync(fullPath);
  assert.ok(buffer.length > 5000, 'PDF size is substantial and non-empty');
  assert.equal(getPdfPageCount(buffer), 1, 'Offer letter fits on exactly 1 single page');
  try { fs.unlinkSync(fullPath); } catch (e) {}
});

test('generateCertificatePdf generates exactly 1 page for standard student profile', async () => {
  const pdfUrl = await generateCertificatePdf({
    studentName: 'Alex Rivera',
    collegeName: 'Aston University',
    domainName: 'Full Stack MERN Web Development',
    durationLabel: '4 Weeks Track',
    startDate: '2026-08-01',
    endDate: '2026-08-31',
    issueDate: '2026-09-01',
    certificateId: 'CERT-STD-001',
  });

  const fullPath = path.join(__dirname, '..', pdfUrl);
  assert.ok(fs.existsSync(fullPath), 'Certificate exists on disk');
  const buffer = fs.readFileSync(fullPath);
  assert.ok(buffer.length > 5000, 'Certificate size is substantial and non-empty');
  assert.equal(getPdfPageCount(buffer), 1, 'Certificate fits on exactly 1 single page');
  try { fs.unlinkSync(fullPath); } catch (e) {}
});

test('Documents handle long student names, long universities, and long domain tracks without overflow', async () => {
  const longProfile = {
    studentName: 'Dr. Siddharth Priyadarshi Bhattacharya',
    collegeName: 'National Institute of Technology Karnataka, Surathkal - Department of Computer Science',
    domainName: 'Artificial Intelligence, Deep Learning & Autonomous Robotics Systems Engineering',
    durationLabel: '12 Weeks Track',
    startDate: '2026-09-01',
    endDate: '2026-11-24',
    issueDate: '2026-08-28',
    applicationId: 'APP-LONG-9999',
    referenceId: 'OFFER-LONG-9999',
    certificateId: 'CERT-LONG-9999',
  };

  // 1. Offer letter with long name
  const offerUrl = await generateOfferLetterPdf(longProfile);
  const offerPath = path.join(__dirname, '..', offerUrl);
  assert.ok(fs.existsSync(offerPath));
  const offerBuf = fs.readFileSync(offerPath);
  assert.equal(getPdfPageCount(offerBuf), 1, 'Offer letter with long name remains strictly 1 page without overflow');
  try { fs.unlinkSync(offerPath); } catch (e) {}

  // 2. Certificate with long name
  const certUrl = await generateCertificatePdf(longProfile);
  const certPath = path.join(__dirname, '..', certUrl);
  assert.ok(fs.existsSync(certPath));
  const certBuf = fs.readFileSync(certPath);
  assert.equal(getPdfPageCount(certBuf), 1, 'Certificate with long name remains strictly 1 page without overflow');
  try { fs.unlinkSync(certPath); } catch (e) {}
});

test('Documents handle minimal student data and missing college cleanly', async () => {
  const minimalProfile = {
    studentName: 'Amy Lin',
    collegeName: '',
    domainName: 'UI/UX Design',
    durationLabel: '4 Weeks Track',
    startDate: 'Immediate',
    endDate: 'Upon Completion',
    applicationId: 'APP-MIN-1111',
    referenceId: 'OFFER-MIN-1111',
    certificateId: 'CERT-MIN-1111',
  };

  const offerUrl = await generateOfferLetterPdf(minimalProfile);
  const offerPath = path.join(__dirname, '..', offerUrl);
  assert.ok(fs.existsSync(offerPath));
  const offerBuf = fs.readFileSync(offerPath);
  assert.equal(getPdfPageCount(offerBuf), 1);
  try { fs.unlinkSync(offerPath); } catch (e) {}

  const certUrl = await generateCertificatePdf(minimalProfile);
  const certPath = path.join(__dirname, '..', certUrl);
  assert.ok(fs.existsSync(certPath));
  const certBuf = fs.readFileSync(certPath);
  assert.equal(getPdfPageCount(certBuf), 1);
  try { fs.unlinkSync(certPath); } catch (e) {}
});
