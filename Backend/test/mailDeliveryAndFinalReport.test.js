const test = require('node:test');
const assert = require('node:assert/strict');
const { getResendFromAddress, normalizeRecipientsForDispatch } = require('../utils/sendEmail');
const { supportTargetEmail } = require('../utils/emailTargets');

test('getResendFromAddress defaults to onboarding@resend.dev when EMAIL_FROM uses @gmail.com', () => {
  const originalFrom = process.env.EMAIL_FROM;
  const originalResendFrom = process.env.RESEND_FROM;

  delete process.env.RESEND_FROM;
  process.env.EMAIL_FROM = 'InternDock <support.interndock@gmail.com>';

  const resolvedFrom = getResendFromAddress();
  assert.equal(resolvedFrom, 'InternDock <onboarding@resend.dev>', 'Prevents Resend 403 rejection by using onboarding@resend.dev');

  // Cleanup
  process.env.EMAIL_FROM = originalFrom;
  if (originalResendFrom) process.env.RESEND_FROM = originalResendFrom;
});

test('getResendFromAddress respects explicit RESEND_FROM if specified', () => {
  const originalResendFrom = process.env.RESEND_FROM;
  process.env.RESEND_FROM = 'InternDock <support@interndock.in>';

  const resolved = getResendFromAddress();
  assert.equal(resolved, 'InternDock <support@interndock.in>');

  if (originalResendFrom) {
    process.env.RESEND_FROM = originalResendFrom;
  } else {
    delete process.env.RESEND_FROM;
  }
});

test('getResendFromAddress preserves verified custom domain in EMAIL_FROM', () => {
  const originalFrom = process.env.EMAIL_FROM;
  const originalResendFrom = process.env.RESEND_FROM;

  delete process.env.RESEND_FROM;
  process.env.EMAIL_FROM = 'InternDock <support@interndock.in>';

  const resolved = getResendFromAddress();
  assert.equal(resolved, 'InternDock <support@interndock.in>');

  process.env.EMAIL_FROM = originalFrom;
  if (originalResendFrom) process.env.RESEND_FROM = originalResendFrom;
});

test('supportTargetEmail returns comma-separated dual inboxes and normalizeRecipientsForDispatch separates them', () => {
  const targets = supportTargetEmail();
  const recipients = normalizeRecipientsForDispatch(targets);
  assert.ok(recipients.includes('support.interndock@gmail.com'));
  assert.ok(recipients.includes('support@interndock.in'));
  assert.equal(recipients.length, 2);
});
