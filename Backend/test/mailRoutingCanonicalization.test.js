const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeRecipientsForDispatch } = require('../utils/sendEmail');
const { normalizeSupportEmails } = require('../utils/emailTargets');

test('mail routing normalizes and deduplicates recipients for dispatch', () => {
  const recipients = normalizeRecipientsForDispatch('support.interndock@gmail.com, support.interndock@gmail.com');
  assert.deepEqual(recipients, ['support.interndock@gmail.com']);
});

test('support target returns default support address', () => {
  const target = normalizeSupportEmails('');
  assert.equal(target, 'support.interndock@gmail.com');
});
