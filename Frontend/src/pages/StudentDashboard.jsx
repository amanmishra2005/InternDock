import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";
import api from "../api/axios";
import axios from "axios";
import DomainCard from "../components/DomainCard";

export default function StudentDashboard() {
  const [activeTab, setActiveTab] = useState("my-applications");
  const [applications, setApplications] = useState([]);
  const [domains, setDomains] = useState([]);
  const [filteredDomains, setFilteredDomains] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loadingApp, setLoadingApp] = useState(true);
  const [loadingDom, setLoadingDom] = useState(true);

  // Custom Domain Request Form State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({
    name: "",
    category: "Custom Track",
    skills: "",
    description: "",
  });
  const [customSubmitting, setCustomSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const navigate = useNavigate();

  useEffect(() => {
    setLoadingApp(true);
    api
      .get("/applications/mine")
      .then((res) => setApplications(res.data))
      .catch((err) => console.error("Error loading applications:", err))
      .finally(() => setLoadingApp(false));

    setLoadingDom(true);
    axios
      .get("/api/domains")
      .then((res) => {
        setDomains(res.data);
        setFilteredDomains(res.data);
      })
      .catch((err) => console.error("Error loading domains:", err))
      .finally(() => setLoadingDom(false));
  }, []);

  useEffect(() => {
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
    setFilteredDomains(result);
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
      const res = await axios.post("/api/domains/request-custom", customForm);
      setShowCustomModal(false);
      setCustomForm({
        name: "",
        category: "Custom Track",
        skills: "",
        description: "",
      });

      const refreshed = await axios.get("/api/domains");
      setDomains(refreshed.data);

      if (res.data.domain) {
        navigate(`/domains/${res.data.domain.slug}`);
      }
    } catch (err) {
      alert("Could not submit custom domain.");
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
            <span>Student Workspace Dashboard</span>
          </motion.div>
          <h1>Welcome back, {user?.fullName || "Intern"}!</h1>
          <p>
            Manage your internship applications, complete weekly capstone
            milestones, and explore new tech domains.
          </p>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveTab("explore-domains")}
          className="btn btn-primary btn-glow"
        >
          <span>Browse Internship Domains</span>
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
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="glass-panel empty-dashboard-card text-center"
              style={{ padding: "4rem 2rem" }}
            >
              <Folder
                size={48}
                color="#818cf8"
                style={{ marginBottom: "1rem" }}
              />
              <h3>No Active Internships Yet</h3>
              <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>
                You haven't applied for any internship tracks yet. Explore our
                domain catalog to get started.
              </p>
              <button
                onClick={() => setShowCustomModal(true)}
                className="btn btn-primary btn-glow"
                style={{ marginTop: "1.5rem" }}
              >
                <Plus size={16} />
                <span>Add Specified Domain</span>
              </button>
            </motion.div>
          ) : (
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
        @media (max-width: 768px) { .dashboard-welcome-card { flex-direction: column; align-items: flex-start; gap: 1.5rem; } }
      `}</style>
    </div>
  );
}
