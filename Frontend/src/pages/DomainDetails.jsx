import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Award, FileText, Briefcase, Check } from "lucide-react";
import api from "../api/axios";

export default function DomainDetails() {
  const { slug } = useParams();
  const [domain, setDomain] = useState(null);
  const [selectedDurationId, setSelectedDurationId] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");

  useEffect(() => {
    api
      .get(`/domains/${slug}`)
      .then((res) => {
        setDomain(res.data);
        if (res.data.availableDurations?.length) {
          setSelectedDurationId(res.data.availableDurations[0]._id);
        }
      })
      .catch((err) => console.error("Error loading domain:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return (
      <div className="container text-center" style={{ padding: "6rem 1rem" }}>
        <div className="spinner"></div>
        <p>Loading domain track details...</p>
      </div>
    );
  }

  if (!domain) {
    return (
      <div className="container text-center" style={{ padding: "6rem 1rem" }}>
        <h2>Domain Track Not Found</h2>
        <Link to="/domains">
          <motion.button whileHover={{ scale: 1.05 }} className="btn btn-primary" style={{ marginTop: "1rem" }}>
            <ArrowLeft size={16} />
            <span>Back to All Domains</span>
          </motion.button>
        </Link>
      </div>
    );
  }

  const handleApply = () => {
    if (!user) return navigate("/login");
    const durParam = selectedDurationId ? `?durationId=${selectedDurationId}` : "";
    navigate(`/apply/${domain.slug}${durParam}`);
  };

  const activeDuration = domain.availableDurations?.find((d) => d._id === selectedDurationId) || domain.availableDurations?.[0];

  return (
    <div className="container domain-detail-container">
      <Link to="/domains" className="back-link">
        <ArrowLeft size={16} />
        <span>Back to All Domains Dashboard</span>
      </Link>

      {/* Domain Header Hero Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="domain-detail-hero glass-panel"
      >
        <div className="hero-top-info">
          <span className="badge-pill badge-pill-cyan">{domain.category}</span>
          <span className="badge-pill badge-pill-emerald">
            <CheckCircle2 size={13} />
            <span>Verified Capstone Track</span>
          </span>
        </div>

        <h1 className="domain-title">{domain.name}</h1>
        <p className="domain-desc">{domain.description}</p>

        <div className="skills-section">
          <h3>Skills &amp; Technologies Covered</h3>
          <div className="skills-tags">
            {domain.skills?.map((skill) => (
              <motion.span 
                key={skill}
                whileHover={{ scale: 1.05 }}
                className="skill-tag-pill"
              >
                <Check size={13} />
                <span>{skill}</span>
              </motion.span>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid-2 detail-content-grid" style={{ marginTop: "2rem" }}>
        {/* Durations & Pricing Table */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="glass-panel pricing-panel"
        >
          <span className="badge-pill badge-pill-amber">Program Duration &amp; Fees</span>
          <h2 style={{ margin: "0.75rem 0 0.5rem 0" }}>Choose Your Duration Track</h2>
          <p className="pricing-subtitle">
            Click to select your preferred program duration below before proceeding to application.
          </p>

          <div className="durations-table">
            {domain.availableDurations?.map((dur) => {
              const isSelected = dur._id === (selectedDurationId || domain.availableDurations[0]?._id);
              return (
                <motion.div 
                  key={dur._id}
                  whileHover={{ x: 4 }}
                  onClick={() => setSelectedDurationId(dur._id)}
                  className={`duration-row ${isSelected ? "active-duration-row" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`radio-dot ${isSelected ? "checked" : ""}`} />
                    <div>
                      <span className="dur-weeks">{dur.label || `${dur.weeks} Weeks`} Track</span>
                      <span className="dur-note">Includes weekly capstones &amp; code review</span>
                    </div>
                  </div>
                  <span className="dur-price">₹{dur.fee}</span>
                </motion.div>
              );
            })}
          </div>

          <div className="duration-perks-box">
            <div className="perk-row">
              <FileText className="perk-icon" size={15} color="#0284c7" />
              <span>Official Selection / Offer Letter issued immediately</span>
            </div>
            <div className="perk-row">
              <Award className="perk-icon" size={15} color="#7c3aed" />
              <span>Cryptographically verified Completion Certificate</span>
            </div>
            <div className="perk-row">
              <Briefcase className="perk-icon" size={15} color="#059669" />
              <span>Downloadable, shareable PDF certificate</span>
            </div>
          </div>

          <motion.button 
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={handleApply} 
            className="btn btn-primary btn-glow full-width btn-lg" 
            style={{ marginTop: "1.75rem" }}
          >
            <span>
              {user 
                ? `Apply for ${activeDuration?.label || "Selected Track"} (₹${activeDuration?.fee})`
                : "Sign In to Apply"}
            </span>
            <ArrowRight size={18} />
          </motion.button>
        </motion.div>

        {/* Curriculum Roadmap */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="glass-panel curriculum-panel"
        >
          <h2>Program Curriculum Roadmap</h2>
          <div className="roadmap-timeline">
            <div className="timeline-item">
              <span className="step-num">Week 1</span>
              <div>
                <h4>Setup &amp; System Architecture Orientation</h4>
                <p>Configure dev environment, starter repositories, git workflows, and project planning.</p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="step-num">Week 2</span>
              <div>
                <h4>Core Domain Foundations</h4>
                <p>Implement core data structures, algorithms, API endpoints, or UI components.</p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="step-num">Week 3</span>
              <div>
                <h4>Applied Feature Mini-Project</h4>
                <p>Build a multi-component production feature module with integration tests.</p>
              </div>
            </div>
            <div className="timeline-item">
              <span className="step-num">Week 4+</span>
              <div>
                <h4>Capstone Submission &amp; Credential Unlocking</h4>
                <p>Deploy capstone project, submit GitHub repository, and receive verified certificate.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        /* ── Page shell ── */
        .domain-detail-container {
          padding: 3rem 0 5rem;
        }
        .back-link {
          display: inline-flex; align-items: center; gap: 0.4rem;
          color: #64748b !important; margin-bottom: 1.75rem;
          font-size: 0.9rem; font-weight: 600;
          transition: color 0.2s ease; text-decoration: none;
        }
        .back-link:hover { color: #4f46e5 !important; }

        /* ── Hero panel ── */
        .domain-detail-hero {
          padding: 2.75rem 3rem;
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: var(--radius-lg);
          box-shadow: 0 2px 16px rgba(20,25,50,0.05);
          margin-bottom: 2rem;
        }
        .hero-top-info { display: flex; gap: 0.65rem; margin-bottom: 1.1rem; flex-wrap: wrap; }
        .domain-title {
          font-size: 2.6rem; font-weight: 900;
          color: #0f172a !important;
          letter-spacing: -0.03em; line-height: 1.15;
          margin-bottom: 0.85rem;
        }
        .domain-desc {
          font-size: 1.08rem; color: #64748b !important;
          max-width: 820px; line-height: 1.65;
          margin-bottom: 1.75rem;
        }
        .skills-section h3 {
          font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.06em; color: #94a3b8; margin-bottom: 0.65rem;
        }
        .skills-tags { display: flex; flex-wrap: wrap; gap: 0.5rem; }
        .skill-tag-pill {
          display: inline-flex; align-items: center; gap: 0.35rem;
          background: #f1f5f9; border: 1px solid #cbd5e1;
          color: #4f46e5 !important; padding: 0.35rem 0.8rem;
          border-radius: var(--radius-full); font-weight: 600; font-size: 0.82rem;
          transition: background 0.15s;
        }
        .skill-tag-pill:hover { background: #e0e7ff; }

        /* ── Two-column grid ── */
        .detail-content-grid { gap: 1.75rem; }

        /* ── Pricing / Duration panel ── */
        .pricing-panel {
          padding: 2rem 2.25rem;
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: var(--radius-md);
          box-shadow: 0 2px 12px rgba(20,25,50,0.04);
        }
        .pricing-panel h2 {
          color: #0f172a !important; font-weight: 800;
          font-size: 1.5rem; margin: 0.65rem 0 0.35rem;
        }
        .pricing-subtitle { color: #94a3b8 !important; font-size: 0.875rem; margin-bottom: 1.5rem; line-height: 1.5; }

        /* Duration rows */
        .durations-table { display: flex; flex-direction: column; gap: 0.65rem; margin-bottom: 1.25rem; }
        .duration-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 1rem 1.25rem;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
          border-radius: var(--radius-sm);
          cursor: pointer; transition: all 0.18s ease;
        }
        .duration-row:hover {
          border-color: #818cf8;
          background: #ffffff;
          box-shadow: 0 2px 8px rgba(74,69,128,0.07);
        }
        .duration-row.active-duration-row {
          border-color: #4f46e5 !important;
          background: #ffffff !important;
          box-shadow: 0 0 0 2.5px rgba(74,69,128,0.15), 0 4px 14px rgba(74,69,128,0.08) !important;
        }
        .radio-dot {
          width: 17px; height: 17px; border-radius: 50%;
          border: 2px solid #cbd5e1; background: #ffffff;
          flex-shrink: 0; transition: all 0.18s;
        }
        .radio-dot.checked {
          border-color: #4f46e5; background: #4f46e5;
          box-shadow: inset 0 0 0 3px #ffffff;
        }
        .dur-weeks { display: block; font-weight: 700; font-size: 1rem; color: #0f172a !important; }
        .dur-note { font-size: 0.78rem; color: #94a3b8 !important; margin-top: 0.1rem; }
        .dur-price { font-size: 1.3rem; font-weight: 800; color: #4f46e5 !important; letter-spacing: -0.02em; }

        /* Perks box */
        .duration-perks-box {
          display: flex; flex-direction: column; gap: 0.6rem;
          background: #f8fafc; padding: 1rem 1.15rem;
          border-radius: var(--radius-sm); border: 1px solid #e2e8f0;
          margin-bottom: 0.25rem;
        }
        .perk-row { display: flex; align-items: center; gap: 0.55rem; font-size: 0.84rem; color: #334155 !important; font-weight: 500; }

        /* Apply CTA */
        .pricing-panel .btn-lg {
          margin-top: 1.5rem !important;
          padding: 1rem 1.5rem !important;
          font-size: 1rem !important; font-weight: 700 !important;
          letter-spacing: 0.01em;
          border-radius: var(--radius-sm) !important;
          box-shadow: 0 6px 20px rgba(74,69,128,0.22) !important;
        }

        /* ── Curriculum panel ── */
        .curriculum-panel {
          padding: 2rem 2.25rem;
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: var(--radius-md);
          box-shadow: 0 2px 12px rgba(20,25,50,0.04);
        }
        .curriculum-panel h2 {
          color: #0f172a !important; font-weight: 800;
          font-size: 1.4rem; margin-bottom: 0.25rem;
        }
        .roadmap-timeline {
          display: flex; flex-direction: column; gap: 0;
          margin-top: 1.5rem; position: relative;
        }
        .roadmap-timeline::before {
          content: ''; position: absolute;
          left: 2.1rem; top: 0.5rem; bottom: 0.5rem; width: 2px;
          background: linear-gradient(180deg, #e2e8f0 0%, transparent 100%);
          border-radius: 2px;
        }
        .timeline-item {
          display: flex; gap: 1.25rem;
          padding: 1.1rem 0;
          border-bottom: 1px solid #f1f5f9;
          position: relative;
        }
        .timeline-item:last-child { border-bottom: none; }
        .step-num {
          font-weight: 700; font-size: 0.72rem;
          color: #4f46e5 !important;
          background: #f1f5f9; border: 1px solid #cbd5e1;
          padding: 0.3rem 0.6rem; border-radius: var(--radius-full);
          height: fit-content; flex-shrink: 0; min-width: 3.5rem;
          text-align: center; letter-spacing: 0.03em;
          position: relative; z-index: 1;
        }
        .timeline-item h4 {
          font-size: 0.98rem; font-weight: 700;
          color: #0f172a !important; margin-bottom: 0.3rem;
        }
        .timeline-item p { font-size: 0.84rem; color: #64748b !important; line-height: 1.55; }

        /* ── Responsive ── */
        @media (max-width: 768px) {
          .domain-detail-hero { padding: 1.5rem 1.25rem; border-radius: var(--radius-md); }
          .domain-title { font-size: clamp(1.75rem, 6vw, 2.2rem); }
          .domain-desc { font-size: 0.95rem; }
          .pricing-panel, .curriculum-panel { padding: 1.5rem 1.25rem; }
          .detail-content-grid { gap: 1.25rem; }
        }
        @media (max-width: 480px) {
          .domain-detail-container { padding: 2rem 0; }
          .duration-row { padding: 0.85rem 1rem; }
          .pricing-panel .btn-lg { white-space: normal; text-align: center; line-height: 1.4; }
        }
        @media (max-width: 380px) {
          .duration-row { flex-direction: column; align-items: flex-start; gap: 0.4rem; }
        }
      `}</style>
    </div>
  );
}
