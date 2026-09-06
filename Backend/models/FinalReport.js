const mongoose = require("mongoose");

const finalReportSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: String,
    introduction: String,
    objectives: String,
    technologies: String,
    workCompleted: String,
    learningOutcomes: String,
    challenges: String,
    conclusion: String,
    githubUrl: String,
    liveUrl: String,
    fileUrl: String,

    status: { type: String, enum: ["Submitted", "Under Review", "Approved", "Needs Revision", "Rejected"], default: "Submitted" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FinalReport", finalReportSchema);
