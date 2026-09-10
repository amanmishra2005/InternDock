function getRequiredTaskCount(durationWeeks = 4) {
  const weeks = Number(durationWeeks) || 4;

  if (weeks === 4) return 1;
  if (weeks === 6 || weeks === 8) return 2;
  if (weeks === 12) return 3;
  if (weeks === 24) return 4;

  return Math.max(1, Math.ceil(weeks / 6));
}

function canIssueCertificate(application = {}, submittedTasks = 0, requiredTasks = 1) {
  if (!application || String(application.paymentStatus || '').toLowerCase() !== 'successful') {
    return false;
  }

  if (!application.finalReportSubmitted) {
    return false;
  }

  if (Number(submittedTasks) < Number(requiredTasks)) {
    return false;
  }

  return true;
}

module.exports = { canIssueCertificate, getRequiredTaskCount };
