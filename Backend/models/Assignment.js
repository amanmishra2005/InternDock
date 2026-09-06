const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema(
  {
    domain: { type: mongoose.Schema.Types.ObjectId, ref: "Domain", required: true },
    week: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, default: "" },
    instructions: { type: String, default: "" },
    resources: [String],
    submissionType: { type: String, enum: ["text", "file", "github", "link"], default: "github" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Assignment", assignmentSchema);
