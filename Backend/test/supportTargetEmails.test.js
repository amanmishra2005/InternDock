const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSupportEmails } = require('../utils/emailTargets');
const { getPreferredFromAddress } = require('../utils/sendEmail');

test('normalizeSupportEmails keeps one canonical support target and trims extra commas', () => {
  assert.equal(normalizeSupportEmails('support@interndock.in, support.interndock@gmail.com'), 'support.interndock@gmail.com');
  assert.equal(normalizeSupportEmails(' support@interndock.in , , support.interndock@gmail.com '), 'support.interndock@gmail.com');
  assert.equal(normalizeSupportEmails(''), 'support.interndock@gmail.com');
});

test('normalizeSupportEmails drops the personal admin mailbox and keeps the canonical support list', () => {
  assert.equal(
    normalizeSupportEmails('amanmishra15.08.2005@gmail.com, support@interndock.in, support.interndock@gmail.com'),
    'support.interndock@gmail.com'
  );
});

test('getPreferredFromAddress prefers the authenticated SMTP mailbox when the configured from header is an external support alias', () => {
  const previousEmailFrom = process.env.EMAIL_FROM;
  const previousSmtpUser = process.env.SMTP_USER;

  process.env.EMAIL_FROM = 'InternDock <support@interndock.in>';
  process.env.SMTP_USER = 'support.interndock@gmail.com';

  assert.equal(
    getPreferredFromAddress(),
    'InternDock <support.interndock@gmail.com>'
  );

  process.env.EMAIL_FROM = previousEmailFrom;
  process.env.SMTP_USER = previousSmtpUser;
});
