const express = require("express");
const router = express.Router();
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Application = require("../models/Application");
const Duration = require("../models/Duration");
const { protect } = require("../middleware/auth");
const { appendToSpreadsheet } = require("../utils/spreadsheetStorage");

function getTaskConfigForDuration(maxWeeks) {
  let count = 1;
  if (maxWeeks === 4) count = 1;
  else if (maxWeeks === 6 || maxWeeks === 8) count = 2;
  else if (maxWeeks === 12) count = 3;
  else if (maxWeeks === 24) count = 4;
  else count = Math.max(1, Math.ceil(maxWeeks / 6));

  const weekSpan = Math.max(1, Math.floor(maxWeeks / count));
  return { count, weekSpan };
}

function getBeginnerGuide(domainName = "") {
  const name = domainName.toLowerCase();
  if (/design|ui|ux|figma|graphic|creative/.test(name)) {
    return "1. Pick one simple screen or poster idea.\n2. Create a rough layout with 3-5 sections.\n3. Add readable colors, text, and spacing.\n4. Export a screenshot or share link and write 2 lines about your choices.";
  }
  if (/data|analytics|machine|ai|artificial|python/.test(name)) {
    return "1. Choose a small public dataset or the provided sample data.\n2. Load it and inspect 5-10 rows.\n3. Make one simple chart or calculation.\n4. Write three short observations and share your notebook or report.";
  }
  if (/marketing|content|sales|business|finance|hr|human resource|management/.test(name)) {
    return "1. Choose one realistic business problem.\n2. Collect 3 simple examples or references.\n3. Create a one-page plan, table, or presentation.\n4. Add three practical recommendations and share the document link.";
  }
  if (/legal|law|health|hospital|biotech|biology|supply|logistic|event|environment|sustain|agri/.test(name)) {
    return "1. Choose one beginner-friendly real-world topic.\n2. Find three reliable references or examples.\n3. Make a simple checklist, diagram, summary, or short report.\n4. Add three key learnings and share the final document link.";
  }
  return "1. Create a small starter project with one clear goal.\n2. Add one feature at a time and keep the layout simple.\n3. Test the result with two example inputs.\n4. Add a short README with setup steps and share your repository link.";
}

function getTaskGuide(assignment, domainName) {
  const instructions = String(assignment.instructions || "").trim();
  const numberedSteps = instructions
    .split("\n")
    .filter((line) => /^\s*\d+[.)]\s+/.test(line));

  if (numberedSteps.length >= 2) return numberedSteps.join("\n");
  return getBeginnerGuide(domainName);
}

// GET /api/assignments/for-application/:applicationId
// Returns a smaller milestone set matching the duration track (1 for 4w, 2 for 6-8w, 3 for 12w, 4 for 24w).
router.get("/for-application/:applicationId", protect, async (req, res) => {
  try {
    const application = await Application.findById(req.params.applicationId).populate("duration").populate("domain", "name").lean();
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
        beginnerGuide: getTaskGuide(a, application.domain?.name),
      };
    });

    const submissions = await Submission.find({ application: application._id }).lean();

    const merged = assignments.map((a) => ({
      assignment: a,
      submission: submissions.find((s) => String(s.assignment) === String(a._id)) || null,
    }));

    return res.json(merged);
  } catch (err) {
    console.error("Assignment loading error:", err);
    return res.status(500).json({ message: "Unable to load assignments." });
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
    console.error("Assignment submission error:", err);
    return res.status(500).json({ message: "Unable to submit the assignment." });
  }
});

module.exports = router;
