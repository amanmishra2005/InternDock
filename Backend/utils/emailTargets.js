function normalizeSupportEmails(value) {
  const canonical = 'support.interndock@gmail.com';
  const raw = String(value || '')
    .split(/[\s,;]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  const seen = new Set();
  raw.forEach((entry) => {
    if (entry === 'support@interndock.in' || entry === 'support.interndock@gmail.com') {
      seen.add(canonical);
    }
  });

  return canonical;
}

function supportTargetEmail() {
  const configured = process.env.NOTIFICATION_EMAIL || process.env.SUPPORT_EMAIL || 'support.interndock@gmail.com';
  return normalizeSupportEmails(configured);
}

module.exports = { normalizeSupportEmails, supportTargetEmail };
