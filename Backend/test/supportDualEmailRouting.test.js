const test = require('node:test');
const assert = require('node:assert/strict');
const { supportTargetEmail, normalizeSupportEmails } = require('../utils/emailTargets');
const { normalizeRecipientsForDispatch, templates } = require('../utils/sendEmail');

test('supportTargetEmail returns both support@interndock.in and support.interndock@gmail.com', () => {
  const target = supportTargetEmail();
  assert.ok(target.includes('support@interndock.in'), 'Includes support@interndock.in');
  assert.ok(target.includes('support.interndock@gmail.com'), 'Includes support.interndock@gmail.com');
});

test('normalizeRecipientsForDispatch parses dual support target into both recipients', () => {
  const targetString = supportTargetEmail();
  const recipients = normalizeRecipientsForDispatch(targetString);
  assert.deepEqual(recipients, ['support@interndock.in', 'support.interndock@gmail.com']);
});

test('contact query notification template references both support mailboxes in footer', () => {
  const t = templates.newContactQueryNotification('Jane Doe', 'jane@example.com', 'Inquiry', 'Hello support');
  assert.ok(t.html.includes('support@interndock.in &amp; support.interndock@gmail.com') || t.html.includes('support@interndock.in & support.interndock@gmail.com'));
});

test('new application admin notification template references both support mailboxes in footer', () => {
  const t = templates.newApplicationAdminNotification('John Doe', 'john@example.com', 'Web Dev', 4, 'APP-101', '2026-10-01', '2026-10-28');
  assert.ok(t.html.includes('support@interndock.in &amp; support.interndock@gmail.com') || t.html.includes('support@interndock.in & support.interndock@gmail.com'));
});

test('final report submission notification template references both support mailboxes in footer', () => {
  const t = templates.finalReportSubmitted('John Doe', 'APP-101', 'Web Dev');
  assert.ok(t.html.includes('support@interndock.in &amp; support.interndock@gmail.com') || t.html.includes('support@interndock.in & support.interndock@gmail.com'));
});
