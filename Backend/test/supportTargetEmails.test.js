const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeSupportEmails } = require('../utils/emailTargets');

test('normalizeSupportEmails keeps one canonical support target and trims extra commas', () => {
  assert.equal(normalizeSupportEmails('support@interndock.in, support.interndock@gmail.com'), 'support@interndock.in, support.interndock@gmail.com');
  assert.equal(normalizeSupportEmails(' support@interndock.in , , support.interndock@gmail.com '), 'support@interndock.in, support.interndock@gmail.com');
  assert.equal(normalizeSupportEmails(''), 'support@interndock.in, support.interndock@gmail.com');
});

test('normalizeSupportEmails drops the personal admin mailbox and keeps the canonical support list', () => {
  assert.equal(
    normalizeSupportEmails('amanmishra15.08.2005@gmail.com, support@interndock.in, support.interndock@gmail.com'),
    'support@interndock.in, support.interndock@gmail.com'
  );
});
