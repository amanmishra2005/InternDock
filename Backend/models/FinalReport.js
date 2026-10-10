const mongoose = require("mongoose");

const finalReportSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    title: { type: String, maxlength: 200 },
    introduction: { type: String, maxlength: 2000 },
    objectives: { type: String, maxlength: 2000 },
    technologies: { type: String, maxlength: 500 },
    workCompleted: { type: String, maxlength: 3000 },
    learningOutcomes: { type: String, maxlength: 2000 },
    challenges: { type: String, maxlength: 2000 },
    conclusion: { type: String, maxlength: 2000 },
    githubUrl: { type: String, maxlength: 500 },
    liveUrl: { type: String, maxlength: 500 },
    fileUrl: { type: String, maxlength: 500 },

    status: { type: String, enum: ["Submitted", "Under Review", "Approved", "Needs Revision", "Rejected"], default: "Submitted" },
  },
  { timestamps: true }
);

finalReportSchema.index({ application: 1 }, { unique: true });
finalReportSchema.index({ student: 1, createdAt: -1 });

module.exports = mongoose.model("FinalReport", finalReportSchema);
