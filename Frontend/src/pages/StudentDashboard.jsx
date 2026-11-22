import React, { useEffect, useState, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  Sparkles,
  Plus,
  Folder,
  ArrowRight,
  Search,
  X,
  Layers,
  Award,
  Clock,
  CheckCircle2,
  ExternalLink,
  Zap,
  ShieldCheck,
  Code2,
  GraduationCap,
  Compass,
} from "lucide-react";
import api from "../api/axios";
import { useAuth } from "../context/AuthContext";
import DomainCard from "../components/DomainCard";

const WHATSAPP_COMMUNITY_URL =
  "https://chat.whatsapp.com/HET9cyDkmH8BsBTdqhM6AL";
const WHATSAPP_CHANNEL_URL =
  "https://whatsapp.com/channel/0029VbDhsUN3AzNbMjZikU0r";

function WhatsAppIcon({ size = 18, color = "currentColor" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={color}
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.198.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12.004 2C6.48 2 2 6.48 2 12.004c0 1.947.56 3.766 1.53 5.309L2.2 21.8l4.634-1.298a9.96 9.96 0 0 0 5.17 1.498c5.524 0 10.004-4.48 10.004-10.004C22.008 6.48 17.528 2 12.004 2zm0 18.254c-1.62 0-3.136-.456-4.437-1.25l-.318-.195-2.757.773.784-2.684-.213-.338A8.214 8.214 0 0 1 3.75 12c0-4.557 3.693-8.25 8.254-8.25 4.56 0 8.25 3.693 8.25 8.25 0 4.56-3.69 8.254-8.25 8.254z" />
    </svg>
  );
}

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("my-applications");
  const [applications, setApplications] = useState(() => {
    try {
      const cached = sessionStorage.getItem("cached_student_applications");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [domains, setDomains] = useState(() => {
    try {
      const cached = sessionStorage.getItem("cached_domains_catalog");
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loadingApp, setLoadingApp] = useState(() => {
    try {
      return !sessionStorage.getItem("cached_student_applications");
    } catch {
      return true;
    }
  });
  const [loadingDom, setLoadingDom] = useState(() => {
    try {
      return !sessionStorage.getItem("cached_domains_catalog");
    } catch {
      return true;
    }
  });

  // Custom Domain Request Form State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: "",
    category: "Custom Track",
    skills: "",
    description: "",
  });
  const [customSubmitting, setCustomSubmitting] = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [showWelcomeModal, setShowWelcomeModal] = useState(() => {
    try {
      const isWelcomeParam = searchParams.get("welcome") === "winter";
      const isJustRegistered = sessionStorage.getItem("just_registered") === "true";
      return Boolean(isWelcomeParam || isJustRegistered);
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (showWelcomeModal) {
      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.55 },
        });
      } catch (_) {}
    }
  }, [showWelcomeModal]);

  const handleCloseWelcome = () => {
    setShowWelcomeModal(false);
    try {
      sessionStorage.removeItem("just_registered");
      if (searchParams.get("welcome")) {
        searchParams.delete("welcome");
        setSearchParams(searchParams, { replace: true });
      }
    } catch (_) {}
  };

  useEffect(() => {
    api
      .get("/applications/mine")
      .then((res) => {
        setApplications(res.data);
        try {
          sessionStorage.setItem("cached_student_applications", JSON.stringify(res.data));
        } catch (_) {}
      })
      .catch((err) => console.error("Error loading applications:", err))
      .finally(() => setLoadingApp(false));

    api
      .get("/domains")
      .then((res) => {
        setDomains(res.data);
        try {
          sessionStorage.setItem("cached_domains_catalog", JSON.stringify(res.data));
        } catch (_) {}
      })
      .catch((err) => console.error("Error loading domains:", err))
      .finally(() => setLoadingDom(false));
  }, []);

  // Top featured winter internship tracks for 1-click application
  const featuredWinterTracks = useMemo(() => {
    if (!domains || domains.length === 0) return [];
    const priorityKeywords = [
      "full-stack",
      "web",
      "machine-learning",
      "ai",
      "python",
      "cybersecurity",
      "cloud",
      "data-science",
      "ui-ux",
    ];
    const picked = [];

    // Find priority tracks
    priorityKeywords.forEach((kw) => {
      const match = domains.find(
        (d) =>
          !d.isPersonalized &&
          (d.slug?.toLowerCase().includes(kw) || d.name?.toLowerCase().includes(kw)),
      );
      if (match && !picked.some((p) => p._id === match._id)) {
        picked.push(match);
      }
    });

    // Fill remaining up to 6
    domains.forEach((d) => {
      if (picked.length < 6 && !d.isPersonalized && !picked.some((p) => p._id === d._id)) {
        picked.push(d);
      }
    });

    return picked.slice(0, 6);
  }, [domains]);

  const filteredDomains = useMemo(() => {
    let result = domains;
    if (selectedCategory !== "All") {
      result = result.filter((d) => d.category === selectedCategory);
    }
    if (search.trim() !== "") {
      const q = search.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.description && d.description.toLowerCase().includes(q)) ||
          (d.skills && d.skills.some((s) => s.toLowerCase().includes(q))),
      );
    }
    return result;
  }, [search, selectedCategory, domains]);

  const categories = [
    "All",
    "Software Development",
    "Data & AI",
    "Cloud & DevOps",
    "Cybersecurity",
    "Design & Product",
    "Marketing & Business",
    "Finance & Accounting",
    "Human Resources",
    "Content & Media",
    "Sales & BD",
    "Legal Affairs",
    "Healthcare & Science",
    "Operations & Supply Chain",
    "Events & PR",
    "Sustainability",
  ];

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customForm.name) return;
    setCustomSubmitting(true);
    try {
      const res = await api.post("/domains/request-custom", customForm);
      setShowCustomModal(false);
      setCustomForm({
        name: "",
        category: "Custom Track",
        skills: "",
        description: "",
      });

      const refreshed = await api.get("/domains");
      setDomains(refreshed.data);

      if (res.data.domain) {
        navigate(`/domains/${res.data.domain.slug}`);
      }
    } catch (err) {
      if (err.response?.data?.isFixedDomain && err.response?.data?.domain?.slug) {
        alert(err.response.data.message);
        setShowCustomModal(false);
        navigate(`/domains/${err.response.data.domain.slug}`);
      } else {
        alert(err.response?.data?.message || "Could not submit custom domain.");
      }
    } finally {
      setCustomSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Submitted":
        return <span className="status-pill status-submitted">Submitted</span>;
      case "Under Review":
        return <span className="status-pill status-review">Under Review</span>;
      case "Selected":
        return <span className="status-pill status-selected">Selected ✓</span>;
      case "Active":
        return (
          <span className="status-pill status-active">Active Workspace</span>
        );
      case "Completed":
        return (
          <span className="status-pill status-completed">Completed 🎓</span>
        );
      default:
        return <span className="status-pill">{status}</span>;
    }
  };

  return (
    <div className="container dashboard-container">
      {/* Student Header Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="dashboard-welcome-card glass-panel"
      >
        <div className="welcome-text">
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="badge-pill badge-pill-cyan"
          >
            <span className="pulse-dot"></span>
            <Sparkles size={14} />
            <span>❄️ Official Winter Internship Cohort 2026–2027</span>
          </motion.div>
          <h1>Welcome back, {user?.fullName || "Intern"}!</h1>
          <p>
            {applications.length === 0
              ? "Complete your Winter Internship application to receive your guaranteed Selection Offer Letter and unlock project milestones."
              : "Manage your active internship applications, complete weekly capstone milestones, and track your verified credentials."}
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("explore-domains")}
          className="btn btn-primary btn-glow"
        >
          <span>{applications.length === 0 ? "Apply for Winter Tracks" : "Browse Internship Domains"}</span>
          <ArrowRight size={16} />
        </motion.button>
      </motion.div>

      {/* Workspace Tabs Header */}
      <div className="dashboard-nav-tabs">
        <button
          onClick={() => setActiveTab("my-applications")}
          className={`tab-btn ${activeTab === "my-applications" ? "active" : ""}`}
        >
          My Internships ({applications.length})
        </button>
        <button
          onClick={() => setActiveTab("explore-domains")}
          className={`tab-btn ${activeTab === "explore-domains" ? "active" : ""}`}
        >
          Explore Domains Catalog ({domains.length})
        </button>
      </div>

      {/* Tab 1: My Applications */}
      {activeTab === "my-applications" && (
        <section className="dashboard-tab-content">
          {loadingApp ? (
            <div
              className="glass-panel text-center"
              style={{ padding: "4rem" }}
            >
              <div className="spinner"></div>
              <p>Loading active internship applications...</p>
            </div>
          ) : applications.length === 0 ? (
            <div className="winter-empty-state-wrapper">
              {/* Winter Cohort Hero Banner */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel winter-cohort-cta-card"
              >
                <div className="winter-cta-header">
                  <div className="badge-pill badge-pill-cyan" style={{ alignSelf: "flex-start", marginBottom: "0.5rem" }}>
                    <span className="pulse-dot"></span>
                    <Sparkles size={14} />
                    <span>❄️ Winter Internship Cohort 2026–2027 Applications Live</span>
                  </div>
                  <h2>Lock In Your Winter Internship Track in 60 Seconds</h2>
                  <p>
                    Your account is verified and ready! Choose a high-growth tech track below, pick your schedule, and receive your guaranteed Selection Offer Letter instantly with recruiter ledger verification.
                  </p>

                  <div className="winter-perks-row">
                    <div className="winter-perk-item">
                      <Zap size={16} color="#d97706" />
                      <span>Instant Selection Offer Letter</span>
                    </div>
                    <div className="winter-perk-item">
                      <Award size={16} color="#4f46e5" />
                      <span>Verifiable Certificate</span>
                    </div>
                    <div className="winter-perk-item">
                      <Code2 size={16} color="#059669" />
                      <span>Weekly Practical Capstones</span>
                    </div>
                    <div className="winter-perk-item">
                      <Clock size={16} color="#0284c7" />
                      <span>Self-Paced 4–24 Weeks</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Featured Winter Tracks Grid */}
              <div className="winter-tracks-section">
                <div className="winter-tracks-header">
                  <div>
                    <h3>Recommended Winter Internship Tracks</h3>
                    <p>Select your preferred track to start your application immediately.</p>
                  </div>
                  <button
                    onClick={() => setActiveTab("explore-domains")}
                    className="btn btn-secondary btn-sm"
                  >
                    <span>View All 25+ Tracks</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                <div className="grid-3 featured-winter-grid">
                  {featuredWinterTracks.map((dom) => (
                    <motion.div
                      key={dom._id}
                      whileHover={{ y: -5 }}
                      className="glass-card winter-track-card"
                    >
                      <div className="winter-track-top">
                        <span className="category-pill">{dom.category || "Development"}</span>
                        <span className="winter-badge-mini">❄️ Winter 2026–27</span>
                      </div>
                      <h4 className="winter-track-name">{dom.name}</h4>
                      <p className="winter-track-desc">
                        {dom.description ? `${dom.description.slice(0, 110)}...` : "Build real-world projects and earn verified credentials."}
                      </p>
                      <div className="winter-skills-chips">
                        {dom.skills?.slice(0, 3).map((s) => (
                          <span key={s} className="skill-chip">{s}</span>
                        ))}
                      </div>
                      <div className="winter-card-footer">
                        <div className="fee-info">
                          <span className="fee-label">From</span>
                          <span className="fee-val">₹{dom.availableDurations?.[0]?.fee || 199}</span>
                        </div>
                        <Link to={`/apply/${dom.slug}`}>
                          <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            className="btn btn-primary btn-sm btn-glow"
                          >
                            <span>Apply Now</span>
                            <ArrowRight size={14} />
                          </motion.button>
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Custom domain small prompt */}
                <div className="custom-domain-hint-box text-center">
                  <span>Looking for an unlisted specialization or thesis track?</span>{" "}
                  <button
                    onClick={() => setShowCustomModal(true)}
                    className="link-btn-text"
                  >
                    Propose a custom track
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="glass-panel winter-active-banner">
                <div className="active-banner-left">
                  <span className="badge-pill badge-pill-cyan" style={{ padding: "0.2rem 0.65rem" }}>
                    ❄️ Winter Cohort 2026–27 Active
                  </span>
                  <span className="active-banner-msg">
                    Workspace active! Complete weekly milestones to unlock verified certificates.
                  </span>
                </div>
                <button
                  onClick={() => setActiveTab("explore-domains")}
                  className="btn btn-secondary btn-sm"
                >
                  <Plus size={14} />
                  <span>Enroll in Another Track</span>
                </button>
              </div>
              {applications.some((app) =>
                ["Selected", "Active", "Completed"].includes(app.status),
              ) && (
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="glass-panel whatsapp-community-banner"
                >
                  <div className="whatsapp-banner-left">
                    <div
                      className="badge-pill badge-pill-emerald"
                      style={{ alignSelf: "flex-start", marginBottom: "0.5rem" }}
                    >
                      <span
                        className="pulse-dot"
                        style={{ background: "#25D366" }}
                      ></span>
                      <WhatsAppIcon size={14} color="#059669" />
                      <span>Official WhatsApp Community</span>
                    </div>
                    <h2>Join Selected Interns WhatsApp Hub</h2>
                    <p>
                      Connect with fellow interns in your cohort, discuss weekly
                      project tasks, get mentor support, and stay updated with
                      official announcements.
                    </p>
                  </div>

                  <div className="whatsapp-banner-actions">
                    <motion.a
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      href={WHATSAPP_COMMUNITY_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="btn whatsapp-join-btn"
                    >
                      <WhatsAppIcon size={18} color="#ffffff" />
                      <div className="whatsapp-btn-text">
                        <span className="btn-main-title">Join Community</span>
                        <span className="btn-sub-title">
                          Peer Chat &amp; Q&amp;A
                        </span>
                      </div>
                      <ExternalLink size={15} />
                    </motion.a>

                    <motion.a
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      href={WHATSAPP_CHANNEL_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="btn whatsapp-channel-btn"
                    >
                      <WhatsAppIcon size={18} color="#15803d" />
                      <div className="whatsapp-btn-text">
                        <span className="btn-main-title">Follow Channel</span>
                        <span className="btn-sub-title">Official Updates</span>
                      </div>
                      <ExternalLink size={15} />
                    </motion.a>
                  </div>
                </motion.div>
              )}

              <div className="grid-2 applications-grid">
              {applications.map((app, index) => (
                <motion.div
                  key={app._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.1 }}
                  whileHover={{ y: -4 }}
                  className="application-card glass-card"
                >
                  <div className="app-card-header">
                    {getStatusBadge(app.status)}
                    <span className="app-id-tag">{app.applicationId}</span>
                  </div>

                  <h3 className="app-domain-title">{app.domain?.name}</h3>
                  <div className="app-meta-row">
                    <span>
                      <Clock size={14} className="inline-meta-icon" /> Duration:{" "}
                      <strong>
                        {app.duration?.label || `${app.duration?.weeks} Weeks`}
                      </strong>
                    </span>
                    <span>
                      💰 Program Fee: <strong>₹{app.duration?.fee}</strong>
                    </span>
                  </div>

                  <div className="app-progress-bar-container">
                    <div className="progress-label">
                      <span>Workspace Progress</span>
                      <span>
                        {app.status === "Completed"
                          ? "100%"
                          : app.status === "Active"
                            ? "60%"
                            : app.status === "Selected"
                              ? "20%"
                              : "5%"}
                      </span>
                    </div>
                    <div className="progress-track">
                      <motion.div
                        className="progress-fill"
                        initial={{ width: 0 }}
                        animate={{
                          width:
                            app.status === "Completed"
                              ? "100%"
                              : app.status === "Active"
                                ? "60%"
                                : app.status === "Selected"
                                  ? "20%"
                                  : "5%",
                        }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                      ></motion.div>
                    </div>
                  </div>

                  <div className="app-card-footer">
                    {["Selected", "Active", "Completed"].includes(app.status) && (
                      <a
                        href={WHATSAPP_COMMUNITY_URL}
                        target="_blank"
                        rel="noreferrer"
                        className="whatsapp-quick-chip"
                        title="Join Selected Interns WhatsApp Community"
                      >
                        <WhatsAppIcon size={14} color="#16a34a" />
                        <span>Join WhatsApp Group</span>
                        <ExternalLink size={12} />
                      </a>
                    )}
                    <Link to={`/applications/${app._id}`}>
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        className="btn btn-secondary full-width"
                      >
                        <span>Open Application Workspace</span>
                        <ArrowRight size={16} />
                      </motion.button>
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
            </>
          )}
        </section>
      )}

      {/* Tab 2: Integrated Explore Domains Dashboard */}
      {activeTab === "explore-domains" && (
        <section className="dashboard-tab-content">
          <div
            className="domains-search-panel glass-panel"
            style={{ marginBottom: "2rem" }}
          >
            <div className="search-input-group">
              <Search className="search-icon" size={18} />
              <input
                type="text"
                placeholder="Search domain name or skill (e.g. MERN, Python, Figma, Cloud)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="domains-search-input"
              />
              {search && (
                <button onClick={() => setSearch("")} className="clear-btn">
                  <X size={18} />
                </button>
              )}
            </div>

            <div
              className="categories-scroll-row"
              style={{ marginTop: "1rem" }}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`cat-pill-btn ${selectedCategory === cat ? "active" : ""}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="dashboard-section-top">
            <span className="results-count">
              Showing {filteredDomains.length} Tracks Available
            </span>
            <button
              onClick={() => setShowCustomModal(true)}
              className="btn btn-secondary btn-sm"
            >
              <Plus size={14} />
              <span>Specify Custom Domain</span>
            </button>
          </div>

          {loadingDom ? (
            <div
              className="glass-panel text-center"
              style={{ padding: "4rem" }}
            >
              <div className="spinner"></div>
              <p>Loading domain catalog...</p>
            </div>
          ) : (
            <div className="grid-3 domains-dashboard-grid">
              {filteredDomains.map((domain, index) => (
                <motion.div
                  key={domain._id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <DomainCard domain={domain} />
                </motion.div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Custom Specified Domain Modal */}
      <AnimatePresence>
        {showCustomModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-panel modal-card"
            >
              <div className="modal-header">
                <h2>Add Specified Custom Domain</h2>
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="close-modal-btn"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleCustomSubmit}
                className="custom-domain-form"
              >
                <div className="input-group">
                  <label className="input-label">Domain Track Name</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Unity Game Development or Systems Engineering"
                    value={customForm.name}
                    onChange={(e) =>
                      setCustomForm({ ...customForm, name: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select
                    className="select-field"
                    value={customForm.category}
                    onChange={(e) =>
                      setCustomForm({ ...customForm, category: e.target.value })
                    }
                  >
                    <option value="Software Development">
                      Software Development
                    </option>
                    <option value="Data & AI">Data & AI</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Design & Product">Design & Product</option>
                    <option value="Marketing & Business">
                      Marketing & Business
                    </option>
                    <option value="Custom Track">Custom Track</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">
                    Core Skills / Technologies (Comma Separated)
                  </label>
                  <input
                    className="input-field"
                    placeholder="e.g. C#, Unity, Shaders, 3D Design"
                    value={customForm.skills}
                    onChange={(e) =>
                      setCustomForm({ ...customForm, skills: e.target.value })
                    }
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Short Track Description</label>
                  <textarea
                    className="textarea-field"
                    rows="3"
                    placeholder="Describe what you'd like to build and learn during this customized internship track..."
                    value={customForm.description}
                    onChange={(e) =>
                      setCustomForm({
                        ...customForm,
                        description: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    onClick={() => setShowCustomModal(false)}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    type="submit"
                    className="btn btn-primary btn-glow"
                    disabled={customSubmitting}
                  >
                    <span>
                      {customSubmitting
                        ? "Creating Domain..."
                        : "Create & Start Track"}
                    </span>
                    <ArrowRight size={16} />
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Winter Cohort Welcome & Fast-Track Application Modal */}
      <AnimatePresence>
        {showWelcomeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-overlay"
          >
            <motion.div
              initial={{ scale: 0.9, y: 25 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 25 }}
              className="glass-panel modal-card winter-welcome-modal"
            >
              <div className="winter-welcome-header">
                <div className="badge-pill badge-pill-cyan" style={{ alignSelf: "flex-start" }}>
                  <Sparkles size={14} />
                  <span>❄️ Winter Cohort 2026–2027 Enrolling Now</span>
                </div>
                <button
                  onClick={handleCloseWelcome}
                  className="close-modal-btn"
                  aria-label="Close modal"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="winter-welcome-body">
                <h2>🎉 Welcome to InternDock, {user?.fullName || "Candidate"}!</h2>
                <p className="welcome-intro-text">
                  Your candidate profile is activated. You are now eligible to enroll in the official <strong>Winter Internship Cohort 2026–2027</strong>. Complete your application in 60 seconds to lock your slot and receive your verified Selection Offer Letter!
                </p>

                <div className="modal-perks-row">
                  <div className="modal-perk">
                    <Zap size={15} color="#d97706" />
                    <span>Instant Offer Letter</span>
                  </div>
                  <div className="modal-perk">
                    <Award size={15} color="#4f46e5" />
                    <span>Verifiable Certificate</span>
                  </div>
                  <div className="modal-perk">
                    <Code2 size={15} color="#059669" />
                    <span>Weekly Capstones</span>
                  </div>
                  <div className="modal-perk">
                    <Clock size={15} color="#0284c7" />
                    <span>Self-Paced Flexible</span>
                  </div>
                </div>

                <div className="modal-top-tracks">
                  <span className="tracks-label">Select a track to apply now:</span>
                  <div className="modal-tracks-grid">
                    {featuredWinterTracks.slice(0, 4).map((track) => (
                      <Link
                        key={track._id}
                        to={`/apply/${track.slug}`}
                        onClick={handleCloseWelcome}
                        className="modal-track-card"
                      >
                        <div className="modal-track-info">
                          <strong>{track.name}</strong>
                          <span>{track.category} • From ₹{track.availableDurations?.[0]?.fee || 199}</span>
                        </div>
                        <span className="apply-chip">
                          Apply <ArrowRight size={13} />
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="modal-actions-dual">
                  <button
                    onClick={() => {
                      handleCloseWelcome();
                      setActiveTab("explore-domains");
                    }}
                    className="btn btn-secondary full-width"
                  >
                    <Compass size={15} />
                    <span>Explore All 25+ Tracks</span>
                  </button>
                  <button
                    onClick={handleCloseWelcome}
                    className="btn btn-primary btn-glow full-width"
                  >
                    <span>View Dashboard</span>
                    <ArrowRight size={15} />
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .dashboard-container { padding: 3.5rem 1.5rem; }
        .dashboard-welcome-card { display: flex; align-items: center; justify-content: space-between; padding: 2.75rem 3rem; margin-bottom: 2.5rem; }
        .welcome-text h1 { font-size: 2.3rem; font-weight: 800; margin: 0.5rem 0; color: #0f172a !important; }
        .welcome-text p { color: var(--text-muted) !important; font-size: 1rem; max-width: 650px; }
        .dashboard-nav-tabs { display: flex; gap: 1rem; border-bottom: 2px solid #e2e8f0; margin-bottom: 2rem; }
        .tab-btn { background: none; border: none; color: #64748b !important; font-family: var(--font-heading); font-size: 1.05rem; font-weight: 700; padding: 0.75rem 1.25rem; cursor: pointer; position: relative; transition: var(--transition-fast); }
        .tab-btn:hover { color: #1e3a8a !important; }
        .tab-btn.active { color: #4f46e5 !important; font-weight: 800; }
        .tab-btn.active::after { content: ''; position: absolute; bottom: -2px; left: 0; width: 100%; height: 3px; background: linear-gradient(90deg, var(--primary), var(--accent-purple)); border-radius: var(--radius-full); }
        .dashboard-section-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 1.5rem; }
        .results-count { color: var(--text-muted) !important; font-weight: 600; font-size: 0.9rem; }
        .search-input-group { position: relative; width: 100%; }
        .search-icon { position: absolute; left: 1rem; top: 50%; transform: translateY(-50%); color: #64748b !important; }
        .domains-search-input { width: 100%; padding: 0.85rem 1rem 0.85rem 2.8rem; background: #ffffff !important; border: 1px solid #cbd5e1 !important; border-radius: var(--radius-sm); color: #0f172a !important; font-size: 0.95rem; font-weight: 500; }
        .domains-search-input:focus { border-color: var(--primary) !important; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.15) !important; }
        .clear-btn { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: #64748b !important; cursor: pointer; }
        .categories-scroll-row { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.25rem; }
        .cat-pill-btn { padding: 0.4rem 1rem; background: #f1f5f9 !important; border: 1px solid #cbd5e1 !important; border-radius: var(--radius-full); color: #475569 !important; font-size: 0.825rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s ease; }
        .cat-pill-btn:hover { background: #e2e8f0 !important; color: #0f172a !important; }
        .cat-pill-btn.active { background: rgba(79, 70, 229, 0.12) !important; border-color: var(--primary) !important; color: #4f46e5 !important; font-weight: 700; }
        .application-card { padding: 2rem; display: flex; flex-direction: column; gap: 1.25rem; }
        .app-card-header { display: flex; align-items: center; justify-content: space-between; }
        .app-id-tag { font-family: monospace; font-size: 0.8rem; color: #64748b !important; font-weight: 600; }
        .status-pill { padding: 0.3rem 0.85rem; border-radius: var(--radius-full); font-size: 0.75rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.03em; }
        .status-submitted { background: #f1f5f9 !important; color: #475569 !important; border: 1px solid #cbd5e1; }
        .status-review { background: rgba(245, 158, 11, 0.12) !important; color: #d97706 !important; border: 1px solid rgba(245, 158, 11, 0.3); }
        .status-selected { background: rgba(2, 132, 199, 0.12) !important; color: #0284c7 !important; border: 1px solid rgba(2, 132, 199, 0.3); }
        .status-active { background: rgba(79, 70, 229, 0.12) !important; color: #4f46e5 !important; border: 1px solid rgba(79, 70, 229, 0.3); }
        .status-completed { background: rgba(5, 150, 105, 0.12) !important; color: #059669 !important; border: 1px solid rgba(5, 150, 105, 0.3); }
        .app-domain-title { font-size: 1.4rem; font-weight: 800; color: #0f172a !important; }
        .app-meta-row { display: flex; gap: 1.5rem; font-size: 0.875rem; color: #475569 !important; }
        .inline-meta-icon { vertical-align: middle; margin-right: 2px; }
        .app-progress-bar-container { display: flex; flex-direction: column; gap: 0.4rem; }
        .progress-label { display: flex; justify-content: space-between; font-size: 0.775rem; color: #64748b !important; font-weight: 600; }
        .progress-track { width: 100%; height: 8px; background: #e2e8f0 !important; border-radius: var(--radius-full); overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent-purple)); border-radius: var(--radius-full); }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(12px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .modal-card { width: 100%; max-width: 580px; padding: 2.5rem; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .close-modal-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
        .full-width { width: 100%; }
        .whatsapp-community-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 2rem 2.25rem;
          margin-bottom: 2rem;
          background: linear-gradient(135deg, rgba(37, 211, 102, 0.08), rgba(16, 185, 129, 0.05), rgba(79, 70, 229, 0.04));
          border: 1px solid rgba(37, 211, 102, 0.35);
          border-radius: var(--radius-md);
          gap: 2rem;
        }
        .whatsapp-banner-left h2 {
          font-size: 1.45rem;
          font-weight: 800;
          color: #0f172a !important;
          margin: 0.4rem 0 0.35rem 0;
        }
        .whatsapp-banner-left p {
          color: #475569 !important;
          font-size: 0.925rem;
          line-height: 1.55;
          max-width: 600px;
          margin: 0;
        }
        .whatsapp-banner-actions {
          display: flex;
          gap: 1rem;
          flex-shrink: 0;
        }
        .whatsapp-join-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: #25D366 !important;
          color: #ffffff !important;
          border: 1px solid #22c55e !important;
          padding: 0.75rem 1.25rem;
          border-radius: var(--radius-sm);
          box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);
          text-decoration: none;
          cursor: pointer;
        }
        .whatsapp-join-btn:hover {
          background: #1fb855 !important;
        }
        .whatsapp-channel-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          background: #f0fdf4 !important;
          color: #15803d !important;
          border: 1px solid rgba(37, 211, 102, 0.4) !important;
          padding: 0.75rem 1.25rem;
          border-radius: var(--radius-sm);
          text-decoration: none;
          cursor: pointer;
        }
        .whatsapp-channel-btn:hover {
          background: #dcfce7 !important;
        }
        .whatsapp-btn-text {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          text-align: left;
        }
        .btn-main-title {
          font-size: 0.88rem;
          font-weight: 800;
          line-height: 1.2;
        }
        .btn-sub-title {
          font-size: 0.72rem;
          opacity: 0.85;
          font-weight: 500;
        }
        .whatsapp-quick-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          background: rgba(37, 211, 102, 0.1);
          border: 1px solid rgba(37, 211, 102, 0.3);
          color: #15803d !important;
          padding: 0.45rem 0.85rem;
          border-radius: 6px;
          font-size: 0.8rem;
          font-weight: 700;
          text-decoration: none;
          margin-bottom: 0.5rem;
          transition: all 0.2s;
        }
        .whatsapp-quick-chip:hover {
          background: rgba(37, 211, 102, 0.2);
          border-color: #25D366;
        }
        @media (max-width: 768px) {
          .whatsapp-community-banner {
            flex-direction: column;
            align-items: stretch;
            padding: 1.35rem 1rem;
            gap: 1.25rem;
          }
          .whatsapp-banner-actions {
            flex-direction: column;
            width: 100%;
          }
          .whatsapp-join-btn, .whatsapp-channel-btn {
            width: 100%;
            justify-content: center;
          }
          .featured-winter-grid {
            grid-template-columns: 1fr;
          }
          .winter-perks-row {
            flex-direction: column;
          }
          .modal-perks-row {
            grid-template-columns: 1fr;
          }
          .modal-actions-dual {
            flex-direction: column;
          }
        }

        /* Winter Cohort Empty State & Application Drive Styles */
        .winter-empty-state-wrapper {
          display: flex;
          flex-direction: column;
          gap: 2rem;
        }
        .winter-cohort-cta-card {
          padding: 2.5rem;
          background: linear-gradient(135deg, rgba(79, 70, 229, 0.08) 0%, rgba(2, 132, 199, 0.08) 50%, rgba(124, 58, 237, 0.06) 100%);
          border: 1.5px solid rgba(79, 70, 229, 0.25);
          border-radius: var(--radius-md);
        }
        .winter-cta-header h2 {
          font-size: 1.85rem;
          font-weight: 800;
          color: #0f172a !important;
          margin: 0.5rem 0;
        }
        .winter-cta-header p {
          color: #475569 !important;
          font-size: 1rem;
          max-width: 720px;
          line-height: 1.6;
        }
        .winter-perks-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.85rem 1.5rem;
          margin-top: 1.5rem;
        }
        .winter-perk-item {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.88rem;
          font-weight: 700;
          color: #1e293b !important;
          background: #ffffff;
          padding: 0.4rem 0.9rem;
          border-radius: var(--radius-full);
          border: 1px solid #e2e8f0;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
        }
        .winter-tracks-section {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .winter-tracks-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 0.5rem;
        }
        .winter-tracks-header h3 {
          font-size: 1.45rem;
          font-weight: 800;
          color: #0f172a !important;
          margin: 0 0 0.25rem 0;
        }
        .winter-tracks-header p {
          color: #64748b !important;
          font-size: 0.9rem;
          margin: 0;
        }
        .featured-winter-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 1.5rem;
        }
        .winter-track-card {
          padding: 1.75rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-radius: var(--radius-md);
          border: 1px solid #e2e8f0;
          background: #ffffff;
          transition: all 0.25s ease;
        }
        .winter-track-card:hover {
          border-color: #6366f1;
          box-shadow: 0 10px 25px rgba(99, 102, 241, 0.12);
        }
        .winter-track-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 0.75rem;
        }
        .winter-badge-mini {
          font-size: 0.72rem;
          font-weight: 700;
          color: #0284c7;
          background: rgba(2, 132, 199, 0.08);
          border: 1px solid rgba(2, 132, 199, 0.2);
          padding: 0.2rem 0.55rem;
          border-radius: var(--radius-full);
        }
        .winter-track-name {
          font-size: 1.25rem;
          font-weight: 800;
          color: #0f172a !important;
          margin: 0 0 0.5rem 0;
        }
        .winter-track-desc {
          font-size: 0.85rem;
          color: #64748b !important;
          line-height: 1.5;
          margin-bottom: 1rem;
        }
        .winter-skills-chips {
          display: flex;
          flex-wrap: wrap;
          gap: 0.4rem;
          margin-bottom: 1.25rem;
        }
        .winter-card-footer {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-top: 1rem;
          border-top: 1px solid #f1f5f9;
        }
        .fee-info {
          display: flex;
          flex-direction: column;
        }
        .fee-label {
          font-size: 0.7rem;
          color: #64748b;
          text-transform: uppercase;
          font-weight: 600;
        }
        .fee-val {
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
        }
        .custom-domain-hint-box {
          padding: 1.25rem;
          color: #64748b;
          font-size: 0.9rem;
        }
        .link-btn-text {
          background: none;
          border: none;
          color: #4f46e5;
          font-weight: 700;
          cursor: pointer;
          text-decoration: underline;
          padding: 0;
        }
        .winter-active-banner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 1rem 1.5rem;
          margin-bottom: 1.75rem;
          background: rgba(2, 132, 199, 0.05);
          border: 1px solid rgba(2, 132, 199, 0.25);
          border-radius: var(--radius-sm);
        }
        .active-banner-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
        }
        .active-banner-msg {
          font-size: 0.88rem;
          font-weight: 600;
          color: #1e293b;
        }
        .winter-welcome-modal {
          max-width: 620px !important;
          padding: 2.25rem !important;
        }
        .winter-welcome-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }
        .winter-welcome-body h2 {
          font-size: 1.65rem;
          font-weight: 800;
          color: #0f172a !important;
          margin: 0.5rem 0;
        }
        .welcome-intro-text {
          font-size: 0.925rem;
          color: #475569 !important;
          line-height: 1.55;
          margin-bottom: 1.25rem;
        }
        .modal-perks-row {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 0.6rem;
          margin-bottom: 1.5rem;
        }
        .modal-perk {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          padding: 0.5rem 0.75rem;
          border-radius: var(--radius-sm);
          font-size: 0.8rem;
          font-weight: 700;
          color: #1e293b;
        }
        .modal-top-tracks {
          margin-bottom: 1.5rem;
        }
        .tracks-label {
          display: block;
          font-size: 0.825rem;
          font-weight: 700;
          color: #475569;
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }
        .modal-tracks-grid {
          display: flex;
          flex-direction: column;
          gap: 0.6rem;
        }
        .modal-track-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.75rem 1rem;
          background: #ffffff;
          border: 1.5px solid #e2e8f0;
          border-radius: var(--radius-sm);
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .modal-track-card:hover {
          border-color: #4f46e5;
          background: rgba(79, 70, 229, 0.02);
          transform: translateX(3px);
        }
        .modal-track-info {
          display: flex;
          flex-direction: column;
        }
        .modal-track-info strong {
          color: #0f172a;
          font-size: 0.925rem;
        }
        .modal-track-info span {
          color: #64748b;
          font-size: 0.78rem;
        }
        .apply-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: #4f46e5;
          color: #ffffff;
          font-size: 0.75rem;
          font-weight: 700;
          padding: 0.3rem 0.7rem;
          border-radius: var(--radius-full);
        }
        .modal-actions-dual {
          display: flex;
          gap: 0.75rem;
          margin-top: 1rem;
        }
      `}</style>
    </div>
  );
}
