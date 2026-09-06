import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Sparkles, Layers, CheckCircle2, XCircle } from "lucide-react";
import api from "../api/axios";

const emptyForm = { name: "", slug: "", category: "Software Development", description: "", skills: "" };

export default function AdminDomains() {
  const [domains, setDomains] = useState([]);
  const [durations, setDurations] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    Promise.all([api.get("/admin/domains"), api.get("/admin/durations")])
      .then(([domRes, durRes]) => {
        setDomains(domRes.data);
        setDurations(durRes.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const createDomain = async (e) => {
    e.preventDefault();
    try {
      await api.post("/admin/domains", {
        ...form,
        skills: form.skills.split(",").map((s) => s.trim()).filter(Boolean),
        availableDurations: durations.map((d) => d._id),
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      alert("Error creating domain.");
    }
  };

  const toggleActive = async (domain) => {
    try {
      if (domain.isActive) {
        await api.delete(`/admin/domains/${domain._id}`);
      } else {
        await api.put(`/admin/domains/${domain._id}`, { isActive: true });
      }
      load();
    } catch (err) {
      alert("Error toggling active state.");
    }
  };

  return (
    <div className="container admin-container">
      <Link to="/admin" className="back-link">
        <ArrowLeft size={16} />
        <span>Back to Admin Control Center</span>
      </Link>

      <div className="grid-2" style={{ gap: "2rem" }}>
        {/* Create Domain Form */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel"
        >
          <span className="badge-pill badge-pill-cyan">
            <Layers size={14} />
            <span>Catalog Management</span>
          </span>
          <h2 style={{ fontSize: "1.5rem", margin: "0.75rem 0 1rem 0" }}>Create New Domain Track</h2>

          <form onSubmit={createDomain} className="admin-form">
            <div className="input-group">
              <label className="input-label">Domain Name</label>
              <input
                className="input-field"
                placeholder="e.g. AI & LLM Engineering"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">URL Slug</label>
              <input
                className="input-field"
                placeholder="e.g. ai-llm-engineering"
                value={form.slug}
                onChange={(e) => setForm({ ...form, slug: e.target.value })}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Category</label>
              <input
                className="input-field"
                placeholder="Software Development / Data & AI"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea
                className="textarea-field"
                rows="3"
                placeholder="Brief summary of what interns will build..."
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Skills (Comma Separated)</label>
              <input
                className="input-field"
                placeholder="Python, LangChain, PyTorch, OpenAI"
                value={form.skills}
                onChange={(e) => setForm({ ...form, skills: e.target.value })}
              />
            </div>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" className="btn btn-primary btn-glow full-width">
              <Plus size={18} />
              <span>Publish Domain Track</span>
            </motion.button>
          </form>
        </motion.div>

        {/* Existing Domains List */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-panel"
        >
          <span className="badge-pill badge-pill-emerald">
            <Sparkles size={14} />
            <span>Live Catalog</span>
          </span>
          <h2 style={{ fontSize: "1.5rem", margin: "0.75rem 0 1rem 0" }}>Active Internship Tracks ({domains.length})</h2>

          {loading ? (
            <div className="spinner"></div>
          ) : (
            <div className="domains-admin-list">
              {domains.map((dom) => (
                <div key={dom._id} className="domain-admin-item">
                  <div>
                    <strong style={{ fontSize: "1.05rem", color: "#ffffff" }}>{dom.name}</strong>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {dom.category}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(dom)}
                    className={`btn btn-sm ${dom.isActive ? "btn-secondary" : "btn-primary"}`}
                  >
                    {dom.isActive ? "Deactivate" : "Activate"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <style>{`
        .admin-container { padding: 3rem 1.5rem; }
        .back-link { display: inline-flex; align-items: center; gap: 0.4rem; color: #475569 !important; font-weight: 700; margin-bottom: 1.5rem; text-decoration: none; }
        .back-link:hover, .back-link:focus, .back-link:active, .back-link:visited { color: #1e3a8a !important; text-decoration: none; }
        .domains-admin-list { display: flex; flex-direction: column; gap: 0.75rem; max-height: 520px; overflow-y: auto; }
        .domain-admin-item { display: flex; align-items: center; justify-content: space-between; padding: 1rem; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-color); border-radius: var(--radius-sm); }
        .full-width { width: 100%; }
      `}</style>
    </div>
  );
}
