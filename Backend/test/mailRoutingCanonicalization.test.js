const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeRecipientsForDispatch } = require('../utils/sendEmail');
const { normalizeSupportEmails } = require('../utils/emailTargets');

test('mail routing canonicalizes support@interndock.in to support.interndock@gmail.com', () => {
  const recipients = normalizeRecipientsForDispatch('support@interndock.in, support.interndock@gmail.com');
  assert.deepEqual(recipients, ['support.interndock@gmail.com']);
});

test('support target canonicalization strips support@interndock.in and returns support.interndock@gmail.com', () => {
  const target = normalizeSupportEmails('support@interndock.in');
  assert.equal(target, 'support.interndock@gmail.com');
});
