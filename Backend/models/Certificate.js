const mongoose = require("mongoose");

const certificateSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    certificateId: { type: String, required: true, unique: true },
    verificationId: { type: String, required: true, unique: true },
    issueDate: { type: Date, default: Date.now },
    pdfUrl: String,
    templateVersion: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Certificate", certificateSchema);
