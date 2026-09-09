function normalizeSupportEmails(value) {
  const canonical = ['support@interndock.in', 'support.interndock@gmail.com'];
  const raw = String(value || '')
    .split(/[\s,;]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  const allowed = new Set(canonical);
  const filtered = raw.filter((entry) => allowed.has(entry));

  return Array.from(new Set([...filtered, ...canonical])).join(', ');
}

function supportTargetEmail() {
  const configured = process.env.NOTIFICATION_EMAIL || process.env.SUPPORT_EMAIL || 'support@interndock.in';
  return normalizeSupportEmails(configured);
}

module.exports = { normalizeSupportEmails, supportTargetEmail };
