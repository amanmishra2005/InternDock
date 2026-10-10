const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const FinalReport = require("../models/FinalReport");
const Duration = require("../models/Duration");

function getRequiredTaskCount(durationWeeks = 4) {
  const weeks = Number(durationWeeks) || 4;

  if (weeks === 4) return 1;
  if (weeks === 6 || weeks === 8) return 2;
  if (weeks === 12) return 3;
  if (weeks === 24) return 4;

  return Math.max(1, Math.ceil(weeks / 6));
}

function canIssueCertificate(application = {}, submittedTasks = 0, requiredTasks = 1) {
  if (!application || String(application.paymentStatus || "").toLowerCase() !== "successful") {
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

/**
 * Evaluates whether a student has completed and had approved all required internship tasks and submissions.
 * 
 * Rules:
 * - Completed & approved: Submission status is "Approved" (or FinalReport status is "Approved").
 * - Incomplete: Missing submission, "Submitted" (pending review), "Under Review", "Needs Revision", or "Rejected".
 * 
 * Returns:
 * {
 *   allCompleted: boolean,
 *   totalRequired: number,
 *   completed: number,
 *   incomplete: number,
 *   incompleteTasks: Array<{ title: string, status: string, reason: string }>,
 *   taskList: Array<{ title: string, status: string, isCompleted: boolean, reason: string }>
 * }
 */
async function checkApplicationTaskStatus(application) {
  if (!application) {
    return {
      allCompleted: false,
      totalRequired: 0,
      completed: 0,
      incomplete: 0,
      incompleteTasks: [
        {
          title: "Application",
          status: "Missing",
          reason: "Application record not found",
        },
      ],
      taskList: [],
    };
  }

  // 1. Determine duration in weeks
  let maxWeeks = application.duration?.weeks;
  if (!maxWeeks && application.duration) {
    try {
      const durDoc = await Duration.findById(application.duration).lean();
      if (durDoc) maxWeeks = durDoc.weeks;
    } catch (e) {}
  }
  if (!maxWeeks) maxWeeks = 4;

  const requiredCount = getRequiredTaskCount(maxWeeks);

  // 2. Fetch assignments for this domain
  const domainId = application.domain?._id || application.domain;
  let rawAssignments = [];
  if (domainId) {
    try {
      rawAssignments = await Assignment.find({ domain: domainId }).sort({ week: 1 }).lean();
    } catch (e) {}
  }

  // Build required milestones
  const requiredAssignments = [];
  for (let i = 0; i < requiredCount; i++) {
    if (rawAssignments && rawAssignments[i]) {
      requiredAssignments.push(rawAssignments[i]);
    } else {
      requiredAssignments.push({
        _id: null,
        week: i + 1,
        title: `Milestone ${i + 1}`,
      });
    }
  }

  // 3. Fetch submissions for this application
  let submissions = [];
  try {
    submissions = await Submission.find({ application: application._id }).lean();
  } catch (e) {}

  const taskList = [];

  for (let i = 0; i < requiredAssignments.length; i++) {
    const assign = requiredAssignments[i];
    const sub = assign._id
      ? submissions.find((s) => String(s.assignment) === String(assign._id))
      : submissions[i] || null;

    let isCompleted = false;
    let status = "Missing";
    let reason = "Task has not been submitted";

    if (sub) {
      const rawStatus = sub.status || "Submitted";
      if (rawStatus === "Approved") {
        status = "Approved";
        isCompleted = true;
        reason = "Task completed and approved";
      } else if (rawStatus === "Rejected") {
        status = "Rejected";
        isCompleted = false;
        reason = "Submission was rejected";
      } else if (rawStatus === "Needs Revision") {
        status = "Needs Revision";
        isCompleted = false;
        reason = "Submission requires revision";
      } else {
        // "Submitted" or "Under Review"
        status = rawStatus === "Under Review" ? "Under Review" : "Pending Review";
        isCompleted = false;
        reason = "Submission is pending review";
      }
    }

    taskList.push({
      taskId: assign._id ? String(assign._id) : `milestone-${i + 1}`,
      submissionId: sub?._id ? String(sub._id) : null,
      title: assign.title || `Milestone ${i + 1}`,
      week: assign.week || i + 1,
      status,
      isCompleted,
      reason,
      githubUrl: sub?.githubUrl || null,
      liveUrl: sub?.liveUrl || null,
      feedback: sub?.feedback || null,
    });
  }

  // 4. Check Final Capstone Project Report
  let finalReport = null;
  try {
    finalReport = await FinalReport.findOne({ application: application._id }).lean();
  } catch (e) {}

  let finalReportCompleted = false;
  let finalReportStatus = "Missing";
  let finalReportReason = "Final capstone report has not been submitted";

  if (finalReport) {
    const rawStatus = finalReport.status || "Submitted";
    if (rawStatus === "Approved") {
      finalReportStatus = "Approved";
      finalReportCompleted = true;
      finalReportReason = "Final report completed and approved";
    } else if (rawStatus === "Rejected") {
      finalReportStatus = "Rejected";
      finalReportCompleted = false;
      finalReportReason = "Final report was rejected";
    } else if (rawStatus === "Needs Revision") {
      finalReportStatus = "Needs Revision";
      finalReportCompleted = false;
      finalReportReason = "Final report requires revision";
    } else {
      finalReportStatus = rawStatus === "Under Review" ? "Under Review" : "Pending Review";
      finalReportCompleted = false;
      finalReportReason = "Final report is pending review";
    }
  } else if (application.finalReportSubmitted) {
    finalReportStatus = "Pending Review";
    finalReportCompleted = false;
    finalReportReason = "Final report is pending review";
  }

  taskList.push({
    taskId: "final-capstone-report",
    finalReportId: finalReport?._id ? String(finalReport._id) : null,
    title: "Final Capstone Project Report",
    status: finalReportStatus,
    isCompleted: finalReportCompleted,
    reason: finalReportReason,
    githubUrl: finalReport?.githubUrl || application?.finalReportUrl || null,
    liveUrl: finalReport?.liveUrl || null,
  });

  const totalRequired = taskList.length;
  const completed = taskList.filter((t) => t.isCompleted).length;
  const incompleteTasks = taskList
    .filter((t) => !t.isCompleted)
    .map((t) => ({
      taskId: t.taskId,
      submissionId: t.submissionId || null,
      finalReportId: t.finalReportId || null,
      title: t.title,
      status: t.status,
      reason: t.reason,
      githubUrl: t.githubUrl || null,
      liveUrl: t.liveUrl || null,
    }));
  const incomplete = incompleteTasks.length;
  const allCompleted = incomplete === 0;

  return {
    allCompleted,
    totalRequired,
    completed,
    incomplete,
    incompleteTasks,
    taskList,
  };
}

module.exports = {
  canIssueCertificate,
  getRequiredTaskCount,
  checkApplicationTaskStatus,
};
