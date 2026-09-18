function isSampleVerificationLookup(query = "") {
  const value = String(query || "").trim().toLowerCase();
  return !value || value === "sample" || value.includes("sample");
}

/**
 * Resolves accurate student name, college name, domain, and valid date range
 * from the application document and student user record.
 */
function resolveApplicationDetails(application = {}, studentUser = null) {
  const student = studentUser || application.student || {};
  const studentName = (
    application.studentName ||
    student.fullName ||
    ""
  ).trim() || "Intern Student";

  const studentEmail = (
    application.studentEmail ||
    student.email ||
    ""
  ).trim();

  const collegeName = (
    application.collegeName ||
    student.college ||
    ""
  ).trim();

  const domainName = (
    application.domain?.name ||
    application.domain?.title ||
    "Tech Internship Track"
  ).trim();

  const durationWeeks = Number(application.duration?.weeks || 4);
  const durationLabel = application.duration?.label || `${durationWeeks} Weeks Track`;

  let startDate = application.startDate;
  let endDate = application.endDate;

  const isValidDate = (d) => d && !isNaN(new Date(d).getTime());

  if (!isValidDate(startDate)) {
    startDate = isValidDate(application.createdAt) ? new Date(application.createdAt) : new Date();
  } else {
    startDate = new Date(startDate);
  }

  if (!isValidDate(endDate)) {
    const end = new Date(startDate);
    end.setDate(end.getDate() + durationWeeks * 7 - 1);
    endDate = end;
  } else {
    endDate = new Date(endDate);
  }

  return {
    studentName,
    studentEmail,
    collegeName,
    domainName,
    durationWeeks,
    durationLabel,
    startDate,
    endDate,
  };
}

module.exports = { isSampleVerificationLookup, resolveApplicationDetails };
