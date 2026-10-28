const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Domain = require("../models/Domain");
const User = require("../models/User");
const Duration = require("../models/Duration");
const Assignment = require("../models/Assignment");
const { protect } = require("../middleware/auth");
const { getCache, setCache, clearCache } = require("../utils/cache");

// GET /api/domains (catalog endpoint)
// Other students & public guests ONLY see the 26 official platform domains.
// If a student personalized a domain, that personalized domain is ONLY shown to the student who created it,
// so that only they can view and apply through it.
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;

    let requestingUserId = null;
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        requestingUserId = decoded.id;
      } catch (e) {}
    }

    // High performance in-memory caching of the official 26 fixed domains
    const OFFICIAL_DOMAINS_KEY = "domains_official_catalog";
    let officialDomains = getCache(OFFICIAL_DOMAINS_KEY);
    if (!officialDomains) {
      officialDomains = await Domain.find({
        isActive: true,
        isPersonalized: { $ne: true },
        isPublic: { $ne: false },
      })
        .populate("availableDurations")
        .lean();
      setCache(OFFICIAL_DOMAINS_KEY, officialDomains, 600);
    }

    let personalizedDomains = [];
    if (requestingUserId) {
      personalizedDomains = await Domain.find({
        isActive: true,
        isPersonalized: true,
        createdBy: requestingUserId,
      })
        .populate("availableDurations")
        .lean();
    }

    let domains = [...personalizedDomains, ...officialDomains];

    if (category && category !== "All") {
      domains = domains.filter((d) => d.category === category);
    }

    if (search) {
      const q = search.toLowerCase();
      domains = domains.filter(
        (d) =>
          d.name?.toLowerCase().includes(q) ||
          d.description?.toLowerCase().includes(q) ||
          (Array.isArray(d.skills) && d.skills.some((s) => s.toLowerCase().includes(q)))
      );
    }

    // Sort: Personalized domains for this student appear at the top, followed by alphabetical order
    domains.sort((a, b) => {
      if (a.isPersonalized && !b.isPersonalized) return -1;
      if (!a.isPersonalized && b.isPersonalized) return 1;
      return (a.name || "").localeCompare(b.name || "");
    });

    return res.json(domains);
  } catch (err) {
    console.error("Fetch domains error:", err.message);
    return res.status(500).json({ message: "Error fetching domains catalog" });
  }
});

// GET /api/domains/mine/personalized (fetch student's own personalized domains)
router.get("/mine/personalized", protect, async (req, res) => {
  try {
    const domains = await Domain.find({
      isPersonalized: true,
      createdBy: req.user._id,
      isActive: true,
    })
      .populate("availableDurations")
      .sort({ createdAt: -1 })
      .lean();
    return res.json(domains);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching personalized domains" });
  }
});

// GET /api/domains/:slug
router.get("/:slug", async (req, res) => {
  try {
    const domain = await Domain.findOne({ slug: req.params.slug, isActive: true }).populate("availableDurations").lean();
    if (!domain) return res.status(404).json({ message: "Domain not found" });

    // If personalized, only the creator student (or admin) can access it
    if (domain.isPersonalized) {
      let requestingUserId = null;
      let isAdmin = false;
      const header = req.headers.authorization || "";
      const token = header.startsWith("Bearer ") ? header.split(" ")[1] : null;
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET);
          requestingUserId = decoded.id;
          const user = await User.findById(decoded.id).select("role").lean();
          if (user?.role === "admin") isAdmin = true;
        } catch (e) {}
      }

      if (!isAdmin && (!requestingUserId || String(domain.createdBy) !== String(requestingUserId))) {
        return res.status(403).json({
          message: "This personalized domain is private and only available for the student who requested it.",
        });
      }

      // Do not store private personalized domains in public cache
      return res.json(domain);
    }

    const cacheKey = `domain_slug_${req.params.slug}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    setCache(cacheKey, domain, 600);
    return res.json(domain);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching domain details" });
  }
});

// POST /api/domains/request-custom
// Personalized domain is strictly for the requesting student to apply,
// NEVER added to the final public domain list, and CANNOT tamper with fixed domain names.
router.post("/request-custom", protect, async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const { category, description, skills } = req.body;
    if (!name) return res.status(400).json({ message: "Domain name is required" });

    const cleanSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

    // Guard: Prevent tampering with fixed/official platform domains
    const fixedConflict = await Domain.findOne({
      $or: [
        { slug: cleanSlug },
        { name: { $regex: new RegExp(`^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") } },
      ],
      isPersonalized: { $ne: true },
    });

    if (fixedConflict) {
      return res.status(400).json({
        message: `"${fixedConflict.name}" is already a fixed official domain. Fixed domain names cannot be modified. You can apply directly to "${fixedConflict.name}".`,
        isFixedDomain: true,
        domain: fixedConflict,
      });
    }

    // Personalized slug is namespaced to the student so it never collides or tampers with public domains
    const studentSuffix = req.user._id.toString().slice(-6);
    const personalizedSlug = `${cleanSlug}-${studentSuffix}`;

    let domain = await Domain.findOne({ slug: personalizedSlug, createdBy: req.user._id });

    if (!domain) {
      const durations = await Duration.find({});
      domain = await Domain.create({
        name,
        slug: personalizedSlug,
        category: category || "Custom Track",
        description: description || `Custom personalized internship track in ${name}.`,
        skills: Array.isArray(skills) ? skills : (skills ? skills.split(",").map((s) => s.trim()) : ["Practical Project Work"]),
        availableDurations: durations.map((d) => d._id),
        isActive: true,
        isPersonalized: true,
        isPublic: false,
        createdBy: req.user._id,
      });

      // Seed 4 weekly assignments for the personalized domain
      const assignments = [
        { week: 1, title: `Week 1: Setup & Roadmap for ${name}`, description: `Initialize ${name} environment and task plan.`, instructions: "Submit GitHub repo link.", submissionType: "github" },
        { week: 2, title: `Week 2: Core Foundations in ${name}`, description: `Implement foundational components for ${name}.`, instructions: "Submit GitHub repo link.", submissionType: "github" },
        { week: 3, title: `Week 3: Applied Mini-Project for ${name}`, description: `Build working module for ${name}.`, instructions: "Submit GitHub repo link.", submissionType: "github" },
        { week: 4, title: `Week 4: Capstone & Final Report`, description: `Complete capstone project for ${name}.`, instructions: "Submit GitHub repo link and final report.", submissionType: "github" },
      ].map((a) => ({ ...a, domain: domain._id }));

      await Assignment.insertMany(assignments);
      // Public domain cache is NOT cleared because personalized domains are not in the public catalog
    }

    return res.status(201).json({
      message: "Personalized domain created successfully! You can now proceed to apply.",
      domain,
    });
  } catch (err) {
    console.error("Personalized domain creation error:", err);
    return res.status(500).json({ message: "Failed to create personalized domain" });
  }
});

module.exports = router;

