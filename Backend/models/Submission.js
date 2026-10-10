const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    assignment: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    textContent: { type: String, maxlength: 3000 },
    githubUrl: { type: String, maxlength: 500 },
    liveUrl: { type: String, maxlength: 500 },
    fileUrl: { type: String, maxlength: 500 },

    status: { type: String, enum: ["Submitted", "Under Review", "Approved", "Needs Revision", "Rejected"], default: "Submitted" },
    feedback: { type: String, maxlength: 1000 },
  },
  { timestamps: true }
);

submissionSchema.index({ application: 1, assignment: 1 });
submissionSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("Submission", submissionSchema);
