function normalizeSupportEmails(value) {
  const defaultTargets = ['support.interndock@gmail.com'];
  const raw = String(value || '')
    .split(/[\s,;]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);

  const seen = new Set();
  raw.forEach((entry) => {
    if (entry === 'support@interndock.in' || entry.endsWith('@interndock.in')) {
      seen.add('support.interndock@gmail.com');
    } else {
      seen.add(entry);
    }
  });

  defaultTargets.forEach((target) => seen.add(target));

  return Array.from(seen).join(', ');
}

function supportTargetEmail() {
  const configured = process.env.NOTIFICATION_EMAIL || process.env.SUPPORT_EMAIL || 'support.interndock@gmail.com';
  return normalizeSupportEmails(configured);
}

module.exports = { normalizeSupportEmails, supportTargetEmail };
