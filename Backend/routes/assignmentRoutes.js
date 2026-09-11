const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Assignment = require("../models/Assignment");
const Submission = require("../models/Submission");
const Application = require("../models/Application");
const Duration = require("../models/Duration");
const { protect } = require("../middleware/auth");
const { appendToSpreadsheet, readSpreadsheet } = require("../utils/spreadsheetStorage");
const { supportTargetEmail } = require("../utils/emailTargets");
const { sendEmail, templates } = require("../utils/sendEmail");

async function findApplicationByIdentifier(identifier) {
  if (!identifier) return null;

  if (mongoose.Types.ObjectId.isValid(identifier)) {
    return Application.findById(identifier)
      .populate("duration")
      .populate("domain", "name")
      .populate("student", "fullName email college");
  }

  return Application.findOne({ applicationId: identifier })
    .populate("duration")
    .populate("domain", "name")
    .populate("student", "fullName email college");
}

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
    const application = await findApplicationByIdentifier(req.params.applicationId);
    if (!application) return res.status(404).json({ message: "Application not found" });

    const studentId = application.student?._id ? application.student._id : application.student;
    if (String(studentId) !== String(req.user._id) && !["admin", "superadmin"].includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (!["Active", "Completed", "Selected"].includes(application.status)) {
      return res.status(400).json({ message: "Internship workspace unlocks once you're selected and active." });
    }

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
    let rawAssignments = await Assignment.find({ domain: domainId }).sort({ week: 1 }).lean();

    // Self-healing: if domain has no assignments, dynamically generate and seed full 24-week curriculum
    if (!rawAssignments || rawAssignments.length === 0) {
      const domainName = application.domain?.name || "Internship Track";
      const fallbackTasks = [
        {
          week: 1,
          title: "Week 1: Setup & Project Roadmap",
          description: `Configure workspace for ${domainName}, initialize project repository, and outline goals.`,
          instructions: `1. Install required development tools and libraries for ${domainName}.\n2. Create a clean project folder and Git repository.\n3. Write initial code structure and verify execution.\n4. Commit to GitHub and submit your repository link below.`,
          submissionType: "github",
        },
        {
          week: 2,
          title: "Week 2: Core Foundations & Module Logic",
          description: `Build foundational logic, core algorithms, and primary modules for ${domainName}.`,
          instructions: `1. Implement core features and business logic.\n2. Handle basic edge cases and input validation.\n3. Test with sample inputs.\n4. Commit to GitHub and submit link below.`,
          submissionType: "github",
        },
        {
          week: 3,
          title: "Week 3: Applied Feature Mini-Project",
          description: `Develop a functional, applied module with integration testing for ${domainName}.`,
          instructions: `1. Connect modular components together.\n2. Add clean error handling and documentation.\n3. Verify all features run without errors.\n4. Commit to GitHub and submit link below.`,
          submissionType: "github",
        },
        {
          week: 4,
          title: "Week 4: Final Capstone Project & Mentor Demo",
          description: `Polish code architecture, prepare demo links, and submit capstone deliverables for ${domainName}.`,
          instructions: `1. Write comprehensive project documentation and README.\n2. Ensure code is clean and properly formatted.\n3. Verify deployment or live demo URL.\n4. Submit your completed repository link below.`,
          submissionType: "github",
        },
      ];

      const full24 = [];
      for (let w = 1; w <= 24; w++) {
        const base = fallbackTasks[(w - 1) % fallbackTasks.length];
        full24.push({
          ...base,
          week: w,
          title: `Week ${w}: ${base.title.replace(/^Week \d+:\s*/, "")}`,
          domain: domainId,
        });
      }

      try {
        await Assignment.insertMany(full24);
        rawAssignments = await Assignment.find({ domain: domainId }).sort({ week: 1 }).lean();
      } catch (insertErr) {
        console.warn("Auto-healing assignments insert failed:", insertErr.message);
        rawAssignments = full24;
      }
    }

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

router.post("/:assignmentId/submit", protect, async (req, res) => {
  try {
    const { applicationId, textContent, githubUrl, liveUrl, fileUrl } = req.body;
    const application = await findApplicationByIdentifier(applicationId);

    if (!application) return res.status(404).json({ message: "Application not found" });
    if (String(application.student?._id || application.student) !== String(req.user._id)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const assignment = await Assignment.findById(req.params.assignmentId);
    if (!assignment) return res.status(404).json({ message: "Assignment not found" });

    const existing = await Submission.findOne({
      application: application._id,
      assignment: assignment._id,
      student: req.user._id,
    });

    const payload = {
      application: application._id,
      assignment: assignment._id,
      student: req.user._id,
      githubUrl: githubUrl || "",
      liveUrl: liveUrl || "",
      fileUrl: fileUrl || "",
      textContent: textContent || "",
      status: "Submitted",
    };

    const submissionDoc = existing
      ? await Submission.findByIdAndUpdate(existing._id, payload, { new: true })
      : await Submission.create(payload);

    const submission = {
      submissionId: submissionDoc._id,
      applicationId: application.applicationId || applicationId,
      assignmentId: String(assignment._id),
      studentName: req.user.fullName,
      studentEmail: req.user.email,
      githubUrl: githubUrl || "",
      liveUrl: liveUrl || "",
      fileUrl: fileUrl || "",
      textContent: textContent || "",
      status: "Submitted",
    };

    appendToSpreadsheet("submissions", submission);

    // Notify support desk of milestone task submission
    const notifyTarget = supportTargetEmail();
    const assignmentEmailTemplate = templates.assignmentSubmitted(
      req.user.fullName,
      req.user.email,
      application.applicationId || applicationId,
      assignment.title,
      githubUrl || liveUrl || fileUrl || ""
    );
    sendEmail({
      to: notifyTarget,
      replyTo: req.user.email,
      ...assignmentEmailTemplate,
    }).catch((emailErr) => console.error("Assignment submission email error:", emailErr));

    return res.status(201).json(submission);
  } catch (err) {
    console.error("Assignment submission error:", err);
    return res.status(500).json({ message: "Unable to submit the assignment." });
  }
});

module.exports = router;
