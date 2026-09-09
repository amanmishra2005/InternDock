function normalizeSupportEmails(value) {
  const fallback = 'support@interndock.in';
  const candidates = String(value || fallback)
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (candidates.length === 0) return fallback;

  const unique = Array.from(new Set(candidates));
  return unique.join(', ');
}

module.exports = { normalizeSupportEmails };
