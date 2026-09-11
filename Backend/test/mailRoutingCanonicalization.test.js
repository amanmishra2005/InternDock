const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeRecipientsForDispatch } = require('../utils/sendEmail');
const { normalizeSupportEmails } = require('../utils/emailTargets');

test('mail routing preserves both support@interndock.in and support.interndock@gmail.com as distinct recipients', () => {
  const recipients = normalizeRecipientsForDispatch('support@interndock.in, support.interndock@gmail.com');
  assert.deepEqual(recipients, ['support@interndock.in', 'support.interndock@gmail.com']);
});

test('support target canonicalization includes both support@interndock.in and support.interndock@gmail.com', () => {
  const target = normalizeSupportEmails('support@interndock.in');
  assert.equal(target, 'support@interndock.in, support.interndock@gmail.com');
});
