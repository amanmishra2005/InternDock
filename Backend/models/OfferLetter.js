const mongoose = require("mongoose");

const offerLetterSchema = new mongoose.Schema(
  {
    application: { type: mongoose.Schema.Types.ObjectId, ref: "Application", required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    referenceId: { type: String, required: true, unique: true },
    verificationId: { type: String, required: true, unique: true },
    issueDate: { type: Date, default: Date.now },
    pdfUrl: String,
    // Bumped whenever the PDF template design changes (see generatePdf.js
    // TEMPLATE_VERSION). Lets documentRoutes.js detect stale PDFs generated
    // under an older design and regenerate them automatically, instead of
    // serving an outdated file forever.
    templateVersion: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("OfferLetter", offerLetterSchema);
