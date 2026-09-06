const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    textContent: String,
    githubUrl: String,
    liveUrl: String,
    fileUrl: String,

    status: { type: String, enum: ["Submitted", "Under Review", "Approved", "Needs Revision", "Rejected"], default: "Submitted" },
    feedback: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Submission", submissionSchema);
