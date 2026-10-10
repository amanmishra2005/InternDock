const test = require("node:test");
const assert = require("node:assert/strict");
const Domain = require("../models/Domain");

test("Domain schema defaults isPersonalized to false and isPublic to true", () => {
  const domain = new Domain({
    name: "Web Development",
    slug: "web-development",
  });

  assert.equal(domain.isPersonalized, false);
  assert.equal(domain.isPublic, true);
  assert.equal(domain.createdBy, null);
});

test("Public domain catalog filter strictly excludes personalized domains", () => {
  const domains = [
    { name: "Full Stack Development", slug: "full-stack-development", isActive: true, isPersonalized: false, isPublic: true },
    { name: "Artificial Intelligence & ML", slug: "artificial-intelligence-ml", isActive: true, isPersonalized: false, isPublic: true },
    { name: "Personalized Rust Embedded Track", slug: "personalized-rust-embedded-123456", isActive: true, isPersonalized: true, isPublic: false, createdBy: "user_1" },
    { name: "Personalized Quant Modeling", slug: "personalized-quant-modeling-789012", isActive: true, isPersonalized: true, isPublic: false, createdBy: "user_2" },
  ];

  // Simulating the database query filter used in GET /api/domains
  const filter = {
    isActive: true,
    isPersonalized: { $ne: true },
    isPublic: { $ne: false },
  };

  const publicDomains = domains.filter(d => 
    d.isActive === filter.isActive &&
    (filter.isPersonalized.$ne ? d.isPersonalized !== true : true) &&
    (filter.isPublic.$ne ? d.isPublic !== false : true)
  );

  assert.equal(publicDomains.length, 2);
  assert.deepEqual(publicDomains.map(d => d.name), [
    "Full Stack Development",
    "Artificial Intelligence & ML"
  ]);
  assert.ok(!publicDomains.some(d => d.isPersonalized === true));
  assert.ok(!publicDomains.some(d => d.name.includes("Personalized")));
});

test("Personalized domain request cannot tamper with existing fixed official domains", () => {
  const fixedDomains = [
    { name: "Full Stack Development", slug: "full-stack-development", isPersonalized: false },
    { name: "Web Development", slug: "web-development", isPersonalized: false },
    { name: "Python Programming", slug: "python-programming", isPersonalized: false },
  ];

  function validateCustomRequest(requestedName) {
    const cleanSlug = requestedName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const match = fixedDomains.find(d => 
      (d.slug === cleanSlug || d.name.toLowerCase() === requestedName.toLowerCase().trim()) &&
      d.isPersonalized !== true
    );

    if (match) {
      return {
        allowed: false,
        error: `"${match.name}" is already a fixed official domain. Fixed domain names cannot be modified.`,
        isFixedDomain: true,
        fixedDomain: match,
      };
    }

    return { allowed: true, cleanSlug };
  }

  // Attempting to request fixed domain names
  const fullStackAttempt = validateCustomRequest("Full Stack Development");
  assert.equal(fullStackAttempt.allowed, false);
  assert.equal(fullStackAttempt.isFixedDomain, true);

  const webDevAttempt = validateCustomRequest("web-development");
  assert.equal(webDevAttempt.allowed, false);
  assert.equal(webDevAttempt.isFixedDomain, true);

  // Attempting to request a new personalized track
  const personalizedAttempt = validateCustomRequest("Autonomous Robotics & Drone Navigation");
  assert.equal(personalizedAttempt.allowed, true);
  assert.equal(personalizedAttempt.cleanSlug, "autonomous-robotics-drone-navigation");
});

test("Personalized domain is only accessible and applicable by the creator student or admin", () => {
  const creatorStudentId = "64f1a2b3c4d5e6f7a8b9c0d1";
  const otherStudentId = "64f1a2b3c4d5e6f7a8b9c0d2";
  const adminId = "64f1a2b3c4d5e6f7a8b9c0d9";

  const personalizedDomain = {
    _id: "domain_custom_999",
    name: "Custom Embedded Rust",
    slug: "custom-embedded-rust-b9c0d1",
    isPersonalized: true,
    isPublic: false,
    createdBy: creatorStudentId,
  };

  function canAccessOrApply(user, domain) {
    if (!domain.isPersonalized) return true;
    if (user.role === "admin") return true;
    return String(domain.createdBy) === String(user._id);
  }

  // Creator student can access & apply
  assert.equal(canAccessOrApply({ _id: creatorStudentId, role: "student" }, personalizedDomain), true);

  // Admin can access & manage
  assert.equal(canAccessOrApply({ _id: adminId, role: "admin" }, personalizedDomain), true);

  // Another student CANNOT access or apply
  assert.equal(canAccessOrApply({ _id: otherStudentId, role: "student" }, personalizedDomain), false);
});

test("Personalized domain is visible in catalog only to the student who created it, other students only see fixed domains", () => {
  const studentA = "64f1a2b3c4d5e6f7a8b9c0d1";
  const studentB = "64f1a2b3c4d5e6f7a8b9c0d2";

  // 26 fixed official platform domains + 1 personalized domain created by student A
  const allDatabaseDomains = [];
  for (let i = 1; i <= 26; i++) {
    allDatabaseDomains.push({
      _id: `fixed_${i}`,
      name: `Official Platform Domain ${i}`,
      isPersonalized: false,
      isPublic: true,
      isActive: true,
    });
  }

  // Student A's personalized domain
  allDatabaseDomains.push({
    _id: "custom_domain_student_a",
    name: "Student A Personalized AI Robotics",
    isPersonalized: true,
    isPublic: false,
    isActive: true,
    createdBy: studentA,
  });

  function getDomainsCatalogForUser(userId) {
    let filter;
    if (userId) {
      filter = (d) =>
        d.isActive &&
        ((!d.isPersonalized && d.isPublic !== false) ||
         (d.isPersonalized && String(d.createdBy) === String(userId)));
    } else {
      filter = (d) => d.isActive && !d.isPersonalized && d.isPublic !== false;
    }

    return allDatabaseDomains.filter(filter);
  }

  // Public/guest sees strictly the 26 fixed official domains
  const publicCatalog = getDomainsCatalogForUser(null);
  assert.equal(publicCatalog.length, 26);
  assert.ok(!publicCatalog.some(d => d.isPersonalized));

  // Student B (another student) sees strictly the 26 fixed official domains
  const studentBCatalog = getDomainsCatalogForUser(studentB);
  assert.equal(studentBCatalog.length, 26);
  assert.ok(!studentBCatalog.some(d => d.isPersonalized));
  assert.ok(!studentBCatalog.some(d => d.name.includes("Student A")));

  // Student A (creator) sees the 26 fixed domains PLUS their personalized domain (total 27)
  const studentACatalog = getDomainsCatalogForUser(studentA);
  assert.equal(studentACatalog.length, 27);
  assert.ok(studentACatalog.some(d => d._id === "custom_domain_student_a"));
});

