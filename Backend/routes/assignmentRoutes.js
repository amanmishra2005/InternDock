const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Application = require("../models/Application");
const Duration = require("../models/Duration");
const { protect } = require("../middleware/auth");
const { appendToSpreadsheet } = require("../utils/spreadsheetStorage");

function getTaskConfigForDuration(maxWeeks) {
  let count = 2;
  if (maxWeeks === 4) count = 2;
  else if (maxWeeks === 6) count = 3;
  else if (maxWeeks === 8) count = 4;
  else if (maxWeeks === 12) count = 6;
  else if (maxWeeks === 24) count = 8;
  else count = Math.max(2, Math.round(maxWeeks / 2));

  const weekSpan = Math.max(1, Math.floor(maxWeeks / count));
  return { count, weekSpan };
}

// GET /api/assignments/for-application/:applicationId
// Returns simple milestone tasks matching duration track (2 for 4w, 3 for 6w, 4 for 8w, 6 for 12w, 8 for 24w).
router.get("/for-application/:applicationId", protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId).populate("duration").lean();
    if (!application) return res.status(404).json({ message: "Application not found" });

    const studentId = application.student?._id ? application.student._id : application.student;
    if (String(studentId) !== String(req.user._id) && !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!["Active", "Completed", "Selected"].includes(application.status)) {
      return res.status(400).json({ message: "Internship workspace unlocks once you're selected and active." });
    }

    // Filter assignments strictly matching the student's duration track
    let maxWeeks = application.duration?.weeks;
    if (!maxWeeks && application.duration) {
      try {
        const durDoc = await Duration.findById(application.duration).lean();
        if (durDoc) maxWeeks = durDoc.weeks;
      } catch (e) {
        // fallback
      }
    }
    if (!maxWeeks) maxWeeks = 4;

    const { count: targetCount, weekSpan } = getTaskConfigForDuration(maxWeeks);

    const domainId = application.domain?._id || application.domain;
    let rawAssignments = await Assignment.find({ domain: domainId })
      .sort({ week: 1 })
      .lean();

    // Map to targetCount easy, beginner-friendly milestone tasks
    const assignments = rawAssignments.slice(0, targetCount).map((a, idx) => {
      const startW = idx * weekSpan + 1;
      const endW = idx === targetCount - 1 ? maxWeeks : (idx + 1) * weekSpan;
      const weekLabel = startW === endW ? `Week ${startW}` : `Weeks ${startW}-${endW}`;
      const cleanTitle = a.title.replace(/^(Week|Milestone)\s+[\d\-]+:\s*/i, "");

      return {
        ...a,
        week: idx + 1,
        weekLabel,
        title: `Milestone ${idx + 1}: ${cleanTitle}`,
        description: `${a.description.replace(/\(Guided,.*?\)/i, "").replace(/\(Easy,.*?\)/i, "")} (Beginner effort: ~30-45 mins for ${weekLabel}).`,
      };
    });

    const submissions = await Submission.find({ application: application._id }).lean();

    const merged = assignments.map((a) => ({
      assignment: a,
      submission: submissions.find((s) => String(s.assignment) === String(a._id)) || null,
    }));

    return res.json(merged);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

// POST /api/assignments/:assignmentId/submit
router.post("/:assignmentId/submit", protect, async (req, res) => {
  try {
    const { applicationId, textContent, githubUrl, liveUrl, fileUrl } = req.body;
    const application = await Application.findById(applicationId).lean();
    if (!application) return res.status(404).json({ message: "Application not found" });
    if (String(application.student) !== String(req.user._id)) return res.status(403).json({ message: "Forbidden" });

    let submission = await Submission.findOne({ application: applicationId, assignment: req.params.assignmentId });
    if (submission) {
      Object.assign(submission, { textContent, githubUrl, liveUrl, fileUrl, status: "Submitted" });
      await submission.save();
    } else {
      submission = await Submission.create({
        application: applicationId,
        assignment: req.params.assignmentId,
        student: req.user._id,
        textContent,
        githubUrl,
        liveUrl,
        fileUrl,
      });
    }

    // Backup submission to hybrid spreadsheet ledger
    appendToSpreadsheet("submissions", {
      submissionId: submission._id,
      applicationId: application.applicationId || applicationId,
      assignmentId: req.params.assignmentId,
      studentName: req.user.fullName,
      studentEmail: req.user.email,
      githubUrl: githubUrl || "",
    });

    return res.status(201).json(submission);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;
