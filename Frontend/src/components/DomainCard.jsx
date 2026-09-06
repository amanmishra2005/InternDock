import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Code2 } from "lucide-react";

export default function DomainCard({ domain }) {
  return (
    <motion.div 
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="animated-domain-card"
    >
      <div className="glass-card domain-card-inner">
        <div className="card-top-row">
          <span className="category-pill">
            <Code2 size={13} />
            <span>{domain.category || "Development"}</span>
          </span>
          <span className="track-badge">
            <CheckCircle2 size={13} color="#059669" />
            <span>Verified Track</span>
          </span>
        </div>

        <h3 className="card-domain-title">{domain.name}</h3>
        <p className="card-domain-desc">{domain.description}</p>

        {/* Skills Chips */}
        <div className="card-skills-row">
          {domain.skills && domain.skills.map((skill) => (
            <span key={skill} className="skill-chip">
              {skill}
            </span>
          ))}
        </div>

        <div className="card-bottom-action">
          <Link to={`/domains/${domain.slug}`}>
            <motion.button 
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="btn btn-primary btn-glow full-width"
            >
              <span>Explore Track & Durations</span>
              <ArrowRight size={16} />
            </motion.button>
          </Link>
        </div>
      </div>

      <style>{`
        .domain-card-inner {
          padding: 1.85rem;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          height: 100%;
          border: none !important;
        }
        .card-top-row {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1rem;
        }
        .category-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          font-size: 0.775rem;
          font-weight: 700;
          color: #0284c7;
          background: rgba(2, 132, 199, 0.08);
          border: 1px solid rgba(2, 132, 199, 0.25);
          padding: 0.25rem 0.7rem;
          border-radius: var(--radius-full);
        }
        .track-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.3rem;
          font-size: 0.75rem;
          color: #059669;
          font-weight: 700;
        }
        .card-domain-title {
          font-size: 1.35rem;
          font-weight: 800;
          margin-bottom: 0.5rem;
          color: #0f172a;
        }
        .card-domain-desc {
          color: var(--text-muted);
          font-size: 0.9rem;
          line-height: 1.55;
          margin-bottom: 1.25rem;
          flex-grow: 1;
        }
        .card-skills-row {
          display: flex;
          flex-wrap: wrap;
          gap: 0.45rem;
          margin-bottom: 1.5rem;
        }
        .skill-chip {
          background: rgba(241, 245, 249, 0.9);
          border: 1px solid rgba(203, 213, 225, 0.8);
          padding: 0.2rem 0.6rem;
          border-radius: var(--radius-sm);
          font-size: 0.775rem;
          color: #334155;
          font-weight: 500;
        }
        .card-bottom-action {
          margin-top: auto;
        }
        .full-width {
          width: 100%;
        }
      `}</style>
    </motion.div>
  );
}
