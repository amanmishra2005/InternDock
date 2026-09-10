function isSampleVerificationLookup(query = "") {
  const value = String(query || '').trim().toLowerCase();
  return !value || value === 'sample' || value.includes('sample');
}

module.exports = { isSampleVerificationLookup };
