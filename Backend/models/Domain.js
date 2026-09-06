const mongoose = require("mongoose");

const domainSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    category: { type: String, default: "General" }, // e.g. Software Development, Data & AI, Cloud & DevOps
    description: { type: String, default: "" },
    icon: { type: String, default: "code" },
    skills: [String],
    prerequisites: [String],
    availableDurations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Duration" }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Domain", domainSchema);
