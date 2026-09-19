const test = require('node:test');
const assert = require('node:assert/strict');
const { supportTargetEmail, normalizeSupportEmails } = require('../utils/emailTargets');
const { normalizeRecipientsForDispatch, templates } = require('../utils/sendEmail');

test('supportTargetEmail returns support.interndock@gmail.com and excludes support@interndock.in', () => {
  const target = supportTargetEmail();
  assert.ok(!target.includes('support@interndock.in'), 'Excludes support@interndock.in');
  assert.ok(target.includes('support.interndock@gmail.com'), 'Includes support.interndock@gmail.com');
});

test('normalizeRecipientsForDispatch routes support target directly to support.interndock@gmail.com', () => {
  const targetString = supportTargetEmail();
  const recipients = normalizeRecipientsForDispatch(targetString);
  assert.deepEqual(recipients, ['support.interndock@gmail.com']);
});

test('contact query notification template references support.interndock@gmail.com in footer', () => {
  const t = templates.newContactQueryNotification('Jane Doe', 'jane@example.com', 'Inquiry', 'Hello support');
  assert.ok(t.html.includes('support.interndock@gmail.com'));
  assert.ok(!t.html.includes('support@interndock.in'));
});

test('new application admin notification template references support.interndock@gmail.com in footer', () => {
  const t = templates.newApplicationAdminNotification('John Doe', 'john@example.com', 'Web Dev', 4, 'APP-101', '2026-10-01', '2026-10-28');
  assert.ok(t.html.includes('support.interndock@gmail.com'));
  assert.ok(!t.html.includes('support@interndock.in'));
});

test('final report submission notification template references support.interndock@gmail.com in footer', () => {
  const t = templates.finalReportSubmitted('John Doe', 'APP-101', 'Web Dev');
  assert.ok(t.html.includes('support.interndock@gmail.com'));
  assert.ok(!t.html.includes('support@interndock.in'));
});
