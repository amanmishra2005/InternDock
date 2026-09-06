const express = require("express");
const router = express.Router();
const Domain = require("../models/Domain");
const { getCache, setCache, clearCache } = require("../utils/cache");

// GET /api/domains (public, with in-memory caching to withstand heavy traffic)
router.get("/", async (req, res) => {
  try {
    const { search, category } = req.query;
    const cacheKey = `domains_${search || ""}_${category || ""}`;

    // Return cached response if available
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const filter = { isActive: true };
    if (category) filter.category = category;
    if (search) filter.name = { $regex: search, $options: "i" };

    // Use .lean() for fast execution & minimal memory consumption
    const domains = await Domain.find(filter).populate("availableDurations").sort({ name: 1 }).lean();
    setCache(cacheKey, domains, 600); // 10 minutes cache
    return res.json(domains);
  } catch (err) {
    console.error("Fetch domains error:", err.message);
    return res.status(500).json({ message: "Error fetching domains catalog" });
  }
});

// GET /api/domains/:slug
router.get("/:slug", async (req, res) => {
  try {
    const cacheKey = `domain_slug_${req.params.slug}`;
    const cached = getCache(cacheKey);
    if (cached) return res.json(cached);

    const domain = await Domain.findOne({ slug: req.params.slug, isActive: true }).populate("availableDurations").lean();
    if (!domain) return res.status(404).json({ message: "Domain not found" });

    setCache(cacheKey, domain, 600);
    return res.json(domain);
  } catch (err) {
    return res.status(500).json({ message: "Error fetching domain details" });
  }
});

// POST /api/domains/request-custom
router.post("/request-custom", async (req, res) => {
  try {
    const { name, category, description, skills } = req.body;
    if (!name) return res.status(400).json({ message: "Domain name is required" });

    const Duration = require("../models/Duration");
    const Assignment = require("../models/Assignment");

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let domain = await Domain.findOne({ slug });

    if (!domain) {
      const durations = await Duration.find({});
      domain = await Domain.create({
        name,
        slug,
        category: category || "Custom Track",
        description: description || `Custom internship track in ${name}.`,
        skills: Array.isArray(skills) ? skills : (skills ? skills.split(",").map(s => s.trim()) : ["Practical Project Work"]),
        availableDurations: durations.map(d => d._id),
        isActive: true,
      });

      // Seed 4 assignments
      const assignments = [
        { week: 1, title: "Week 1: Setup & Roadmap", description: `Initialize ${name} environment and task plan.`, instructions: "Submit GitHub repo link.", submissionType: "github" },
        { week: 2, title: "Week 2: Core Foundations", description: `Implement foundational components for ${name}.`, instructions: "Submit GitHub repo link.", submissionType: "github" },
        { week: 3, title: "Week 3: Applied Mini-Project", description: `Build working module for ${name}.`, instructions: "Submit GitHub repo link.", submissionType: "github" },
        { week: 4, title: "Week 4: Capstone & Final Report", description: `Complete capstone project for ${name}.`, instructions: "Submit GitHub repo link and final report.", submissionType: "github" },
      ].map(a => ({ ...a, domain: domain._id }));

      await Assignment.insertMany(assignments);
      clearCache(); // Invalidate cache on new domain creation
    }

    return res.status(201).json({ message: "Custom domain created successfully!", domain });
  } catch (err) {
    console.error("Custom domain creation error:", err);
    return res.status(500).json({ message: "Failed to create custom domain" });
  }
});

module.exports = router;
