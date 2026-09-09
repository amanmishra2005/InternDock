function normalizeSupportEmails(value) {
  const fallback = 'support@interndock.in';
  const raw = String(value || fallback)
    .split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  if (raw.length === 0) return fallback;

  const unique = Array.from(new Set(raw));
  return unique.join(', ');
}

function supportTargetEmail() {
  return normalizeSupportEmails(
    process.env.NOTIFICATION_EMAIL || process.env.SUPPORT_EMAIL || 'support@interndock.in'
  );
}

module.exports = { normalizeSupportEmails, supportTargetEmail };
