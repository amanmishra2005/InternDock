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
  if (originalFrom !== undefined) process.env.EMAIL_FROM = originalFrom;
  else delete process.env.EMAIL_FROM;
  if (originalResendFrom !== undefined) process.env.RESEND_FROM = originalResendFrom;
  else delete process.env.RESEND_FROM;
});

test('getResendFromAddress respects explicit RESEND_FROM with verified custom domain', () => {
  const originalResendFrom = process.env.RESEND_FROM;
  process.env.RESEND_FROM = 'InternDock <notifications@interndock.in>';

  const resolved = getResendFromAddress();
  assert.equal(resolved, 'InternDock <notifications@interndock.in>');

  if (originalResendFrom) {
    process.env.RESEND_FROM = originalResendFrom;
  } else {
    delete process.env.RESEND_FROM;
  }
});

test('getResendFromAddress falls back to onboarding@resend.dev when RESEND_FROM contains @gmail.com', () => {
  const originalResendFrom = process.env.RESEND_FROM;
  process.env.RESEND_FROM = 'InternDock <support.interndock@gmail.com>';

  const resolved = getResendFromAddress();
  assert.equal(resolved, 'InternDock <onboarding@resend.dev>');

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
  process.env.EMAIL_FROM = 'InternDock <updates@mycustomdomain.org>';

  const resolved = getResendFromAddress();
  assert.equal(resolved, 'InternDock <updates@mycustomdomain.org>');

  process.env.EMAIL_FROM = originalFrom;
  if (originalResendFrom) process.env.RESEND_FROM = originalResendFrom;
});

test('supportTargetEmail returns support inbox and normalizeRecipientsForDispatch separates them', () => {
  const targets = supportTargetEmail();
  const recipients = normalizeRecipientsForDispatch(targets);
  assert.ok(recipients.includes('support.interndock@gmail.com'));
  assert.equal(recipients.length, 1);
});
