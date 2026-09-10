const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeRecipientsForDispatch } = require('../utils/sendEmail');
const { normalizeSupportEmails } = require('../utils/emailTargets');

test('mail routing normalizes the old support alias to the live Gmail support mailbox', () => {
  const recipients = normalizeRecipientsForDispatch('support@interndock.in');
  assert.deepEqual(recipients, ['support.interndock@gmail.com']);
});

test('support target canonicalization prefers the active Gmail support mailbox', () => {
  const target = normalizeSupportEmails('support@interndock.in');
  assert.equal(target, 'support.interndock@gmail.com');
});
