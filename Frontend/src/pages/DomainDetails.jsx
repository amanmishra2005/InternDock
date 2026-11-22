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
              <FileText className="perk-icon" size={16} color="#38bdf8" />
              <span>Official Selection / Offer Letter issued immediately</span>
            </div>
            <div className="perk-row">
              <Award className="perk-icon" size={16} color="#a855f7" />
              <span>Cryptographically verified Completion Certificate</span>
            </div>
            <div className="perk-row">
              <Briefcase className="perk-icon" size={16} color="#34d399" />
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
        .domain-detail-container { padding: 3.5rem 1.5rem; }
        .back-link { display: inline-flex; align-items: center; gap: 0.4rem; color: #475569 !important; margin-bottom: 1.5rem; font-weight: 700; transition: color 0.2s ease; text-decoration: none; }
        .back-link:hover, .back-link:focus, .back-link:active, .back-link:visited { color: #1e3a8a !important; text-decoration: none; }
        .domain-detail-hero { padding: 3rem; background: #ffffff !important; border: 1px solid #cbd5e1 !important; border-radius: var(--radius-lg); }
        .hero-top-info { display: flex; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap; }
        .domain-title { font-size: 2.8rem; font-weight: 900; margin-bottom: 1rem; color: #0f172a !important; }
        .domain-desc { font-size: 1.15rem; color: #475569 !important; max-width: 820px; margin-bottom: 2rem; line-height: 1.6; }
        .skills-tags { display: flex; flex-wrap: wrap; gap: 0.6rem; margin-top: 0.75rem; }
        .skill-tag-pill { display: inline-flex; align-items: center; gap: 0.35rem; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.25); color: #4f46e5 !important; padding: 0.4rem 0.85rem; border-radius: var(--radius-full); font-weight: 700; font-size: 0.875rem; }
        .pricing-panel, .curriculum-panel { padding: 2.5rem; background: #ffffff !important; border: 1px solid #cbd5e1 !important; border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
        .pricing-panel h2, .curriculum-panel h2 { color: #0f172a !important; font-weight: 800; }
        .pricing-subtitle { color: #475569 !important; font-size: 0.95rem; margin-bottom: 1.5rem; }
        .durations-table { display: flex; flex-direction: column; gap: 0.85rem; margin-bottom: 1.5rem; }
        .duration-row { display: flex; align-items: center; justify-content: space-between; padding: 1.1rem 1.35rem; background: #f8fafc; border: 2px solid #e2e8f0; border-radius: var(--radius-sm); cursor: pointer; transition: all 0.2s ease; }
        .duration-row:hover { border-color: #6366f1; background: rgba(99, 102, 241, 0.03); }
        .duration-row.active-duration-row { border-color: #4f46e5 !important; background: rgba(79, 70, 229, 0.08) !important; box-shadow: 0 0 0 1px #4f46e5; }
        .radio-dot { width: 18px; height: 18px; border-radius: 50%; border: 2px solid #94a3b8; background: #ffffff; flex-shrink: 0; transition: all 0.2s; }
        .radio-dot.checked { border-color: #4f46e5; background: #4f46e5; box-shadow: inset 0 0 0 3px #ffffff; }
        .dur-weeks { display: block; font-weight: 800; font-size: 1.05rem; color: #0f172a !important; }
        .dur-note { font-size: 0.825rem; color: #475569 !important; }
        .dur-price { font-size: 1.4rem; font-weight: 900; color: #0284c7 !important; }
        .duration-perks-box { display: flex; flex-direction: column; gap: 0.65rem; background: #f1f5f9; padding: 1.1rem 1.25rem; border-radius: var(--radius-sm); border: 1px solid #e2e8f0; }
        .perk-row { display: flex; align-items: center; gap: 0.6rem; font-size: 0.875rem; color: #334155 !important; font-weight: 600; }
        .roadmap-timeline { display: flex; flex-direction: column; gap: 1.75rem; margin-top: 1.5rem; position: relative; }
        .timeline-item { display: flex; gap: 1.25rem; }
        .step-num { font-weight: 800; font-size: 0.875rem; color: #4f46e5 !important; background: rgba(79, 70, 229, 0.1); padding: 0.35rem 0.75rem; border-radius: var(--radius-full); height: fit-content; flex-shrink: 0; }
        .timeline-item h4 { font-size: 1.05rem; font-weight: 700; color: #0f172a !important; margin-bottom: 0.25rem; }
        .timeline-item p { font-size: 0.875rem; color: #475569 !important; line-height: 1.5; }
        @media (max-width: 640px) {
          .domain-detail-container { padding: 2rem 0.85rem; }
          .domain-detail-hero { padding: 1.35rem 1rem; border-radius: var(--radius-md); }
          .domain-title { font-size: clamp(1.75rem, 6.5vw, 2.3rem); margin-bottom: 0.75rem; }
          .domain-desc { font-size: 0.95rem; margin-bottom: 1.5rem; }
          .pricing-panel, .curriculum-panel { padding: 1.35rem 1rem; border-radius: var(--radius-md); }
          .detail-content-grid { gap: 1.25rem; }
          .duration-row { padding: 0.95rem 1rem; }
          .pricing-panel .btn-lg { white-space: normal; text-align: center; line-height: 1.35; padding: 0.85rem 1rem; font-size: 0.92rem; }
        }
        @media (max-width: 380px) {
          .duration-row { flex-direction: column; align-items: flex-start; gap: 0.5rem; }
        }
      `}</style>
    </div>
  );
}
