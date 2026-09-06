import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { Search, Plus, X, Sparkles, Layers, ArrowRight } from "lucide-react";
import DomainCard from "../components/DomainCard";

export default function Domains() {
  const [domains, setDomains] = useState([]);
  const [filteredDomains, setFilteredDomains] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  
  // Custom Domain Request Form State
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customForm, setCustomForm] = useState({ name: "", category: "Custom Track", skills: "", description: "" });
  const [customSubmitting, setCustomSubmitting] = useState(false);

  const navigate = useNavigate();

  const loadDomains = () => {
    setLoading(true);
    axios
      .get("/api/domains")
      .then((res) => {
        setDomains(res.data);
        setFilteredDomains(res.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(loadDomains, []);

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
          (d.skills && d.skills.some((s) => s.toLowerCase().includes(q)))
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
    "Sustainability"
  ];

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customForm.name) return;
    setCustomSubmitting(true);
    try {
      const res = await axios.post("/api/domains/request-custom", customForm);
      setShowCustomModal(false);
      setCustomForm({ name: "", category: "Custom Track", skills: "", description: "" });
      loadDomains();
      if (res.data.domain) {
        navigate(`/domains/${res.data.domain.slug}`);
      }
    } catch (err) {
      alert("Could not submit custom domain.");
    } finally {
      setCustomSubmitting(false);
    }
  };

  return (
    <div className="domains-dashboard-page">
      {/* Header Banner */}
      <section className="domains-hero-banner">
        <div className="container text-center">
          <motion.div 
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="badge-pill badge-pill-cyan"
          >
            <span className="pulse-dot"></span>
            <Sparkles size={14} />
            <span>Live Internship Tracks Catalog</span>
          </motion.div>
          <h1 className="domains-hero-title">Explore Internship Domains</h1>
          <p className="domains-hero-subtitle">
            Browse through 25+ industry-aligned tech tracks. Click any track to inspect the curriculum roadmap and select your preferred program duration.
          </p>

          {/* Search & Filter Bar */}
          <div className="domains-search-panel glass-panel">
            <div className="search-input-group">
              <Search className="search-icon" size={20} />
              <input
                type="text"
                placeholder="Search domain name, skill (e.g. React, Python, Figma, AWS, Java, Security)..."
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

            <div className="categories-scroll-row">
              {categories.map((cat) => (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`cat-pill-btn ${selectedCategory === cat ? "active" : ""}`}
                >
                  {cat}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Main Domains Cards Section */}
      <section className="container domains-grid-section">
        <div className="domains-section-top">
          <span className="results-count">Showing {filteredDomains.length} Active Tracks</span>
          <motion.button 
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setShowCustomModal(true)} 
            className="btn btn-secondary"
          >
            <Plus size={16} />
            <span>Add Specified Custom Domain</span>
          </motion.button>
        </div>

        {loading ? (
          <div className="glass-panel text-center" style={{ padding: "4rem" }}>
            <div className="spinner"></div>
            <p>Loading internship domain catalog...</p>
          </div>
        ) : filteredDomains.length === 0 ? (
          <div className="glass-panel empty-box text-center" style={{ padding: "4rem 2rem" }}>
            <h3>No matching domain found for "{search}"</h3>
            <p style={{ color: "var(--text-muted)", marginTop: "0.5rem" }}>Can't find your domain? Specify your customized track below!</p>
            <button onClick={() => setShowCustomModal(true)} className="btn btn-primary btn-glow" style={{ marginTop: "1.5rem" }}>
              <Plus size={16} />
              <span>Add Specified Custom Domain</span>
            </button>
          </div>
        ) : (
          <div className="grid-3 domains-dashboard-grid">
            {filteredDomains.map((domain, index) => (
              <motion.div
                key={domain._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.05 }}
              >
                <DomainCard domain={domain} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Custom Domain Request Banner */}
        <motion.div 
          whileHover={{ scale: 1.01 }}
          className="glass-panel custom-domain-banner" 
          style={{ marginTop: "4rem" }}
        >
          <div>
            <span className="badge-pill badge-pill-emerald">
              <Layers size={14} />
              <span>Custom Learning Track</span>
            </span>
            <h2>Can't find your specified domain track?</h2>
            <p>Specify your required domain (e.g. Game Development, Sales Analytics, Rust Systems, Blockchain) and start your customized internship track immediately.</p>
          </div>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowCustomModal(true)} 
            className="btn btn-primary btn-glow btn-lg"
          >
            <Plus size={18} />
            <span>Add Specified Domain</span>
          </motion.button>
        </motion.div>
      </section>

      {/* Modal for Custom Domain Creation */}
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
                <button onClick={() => setShowCustomModal(false)} className="close-modal-btn">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCustomSubmit} className="custom-domain-form">
                <div className="input-group">
                  <label className="input-label">Domain Track Name</label>
                  <input
                    className="input-field"
                    placeholder="e.g. Unity Game Development, Rust Microservices, AI Sales Analytics"
                    value={customForm.name}
                    onChange={(e) => setCustomForm({ ...customForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Category</label>
                  <select
                    className="select-field"
                    value={customForm.category}
                    onChange={(e) => setCustomForm({ ...customForm, category: e.target.value })}
                  >
                    <option value="Software Development">Software Development</option>
                    <option value="Data & AI">Data & AI</option>
                    <option value="Cloud & DevOps">Cloud & DevOps</option>
                    <option value="Cybersecurity">Cybersecurity</option>
                    <option value="Design & Product">Design & Product</option>
                    <option value="Marketing & Business">Marketing & Business</option>
                    <option value="Custom Track">Custom Track</option>
                  </select>
                </div>

                <div className="input-group">
                  <label className="input-label">Core Skills / Technologies (Comma Separated)</label>
                  <input
                    className="input-field"
                    placeholder="e.g. C#, Unity, 3D Physics, Shader Graph"
                    value={customForm.skills}
                    onChange={(e) => setCustomForm({ ...customForm, skills: e.target.value })}
                  />
                </div>

                <div className="input-group">
                  <label className="input-label">Short Track Description</label>
                  <textarea
                    className="textarea-field"
                    rows="3"
                    placeholder="Describe what you'd like to build and learn during this customized internship track..."
                    value={customForm.description}
                    onChange={(e) => setCustomForm({ ...customForm, description: e.target.value })}
                  />
                </div>

                <div className="modal-actions">
                  <button type="button" onClick={() => setShowCustomModal(false)} className="btn btn-secondary">
                    Cancel
                  </button>
                  <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} type="submit" className="btn btn-primary btn-glow" disabled={customSubmitting}>
                    <span>{customSubmitting ? "Creating Domain..." : "Create & Start Track"}</span>
                    <ArrowRight size={16} />
                  </motion.button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .domains-hero-banner { padding: 4rem 0 3rem 0; }
        .domains-hero-title { font-size: 3.2rem; font-weight: 900; margin: 0.75rem 0 0.5rem 0; }
        .domains-hero-subtitle { color: var(--text-muted); font-size: 1.1rem; max-width: 720px; margin: 0 auto 2.5rem auto; }
        .domains-search-panel { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.25rem; max-width: 980px; margin: 0 auto; }
        .search-input-group { position: relative; width: 100%; }
        .search-icon { position: absolute; left: 1.25rem; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .domains-search-input { width: 100%; padding: 0.95rem 3rem 0.95rem 3.25rem; background: #060810; border: 1px solid var(--border-color); border-radius: var(--radius-sm); color: #ffffff; font-size: 1rem; }
        .domains-search-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.25); }
        .clear-btn { position: absolute; right: 1rem; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-muted); cursor: pointer; }
        .categories-scroll-row { display: flex; gap: 0.5rem; overflow-x: auto; padding-bottom: 0.25rem; }
        .cat-pill-btn { padding: 0.45rem 1.1rem; background: rgba(255, 255, 255, 0.05); border: 1px solid var(--border-color); border-radius: var(--radius-full); color: var(--text-muted); font-size: 0.85rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: var(--transition-fast); }
        .cat-pill-btn:hover, .cat-pill-btn.active { background: rgba(99, 102, 241, 0.2); border-color: var(--primary); color: #ffffff; }
        .domains-grid-section { padding: 3rem 0 5rem 0; }
        .domains-section-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 2rem; }
        .results-count { color: var(--text-muted); font-weight: 600; font-size: 0.95rem; }
        .custom-domain-banner { display: flex; align-items: center; justify-content: space-between; gap: 2rem; padding: 3rem; background: linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%); border: 1px solid rgba(99, 102, 241, 0.3); }
        .custom-domain-banner h2 { font-size: 1.8rem; font-weight: 800; margin: 0.75rem 0 0.5rem 0; }
        .custom-domain-banner p { color: var(--text-muted); max-width: 700px; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.85); backdrop-filter: blur(12px); z-index: 1000; display: flex; align-items: center; justify-content: center; padding: 1.5rem; }
        .modal-card { width: 100%; max-width: 580px; padding: 2.5rem; }
        .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
        .close-modal-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; }
        .modal-actions { display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1.5rem; }
        @media (max-width: 900px) { .custom-domain-banner { flex-direction: column; align-items: flex-start; } }
      `}</style>
    </div>
  );
}
