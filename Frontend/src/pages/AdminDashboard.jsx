import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Users, FileText, Star, Zap, GraduationCap, Award, DollarSign, ArrowRight, ShieldCheck } from "lucide-react";
import api from "../api/axios";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/admin/stats")
      .then((res) => setStats(res.data))
      .catch((err) => console.error("Admin stats error:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading || !stats) {
    return (
      <div className="container text-center" style={{ padding: "5rem 1rem" }}>
        <div className="spinner"></div>
        <p>Loading InternDock Admin Analytics...</p>
      </div>
    );
  }

  const cards = [
    { label: "Total Students", value: stats.totalStudents, icon: Users, badgeClass: "badge-pill-cyan" },
    { label: "Total Applications", value: stats.totalApplications, icon: FileText, badgeClass: "badge-pill-purple" },
    { label: "Selected Interns", value: stats.selected, icon: Star, badgeClass: "badge-pill-amber" },
    { label: "Active Workspaces", value: stats.active, icon: Zap, badgeClass: "badge-pill-cyan" },
    { label: "Completed Capstones", value: stats.completed, icon: GraduationCap, badgeClass: "badge-pill-emerald" },
    { label: "Certificates Issued", value: stats.certificatesIssued, icon: Award, badgeClass: "badge-pill-emerald" },
    { label: "Total Platform Revenue", value: `₹${stats.revenue}`, icon: DollarSign, badgeClass: "badge-pill-emerald" },
  ];

  return (
    <div className="container admin-container">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="admin-header glass-panel"
      >
        <div>
          <span className="badge-pill badge-pill-cyan">
            <ShieldCheck size={14} />
            <span>Admin Command Center</span>
          </span>
          <h1 className="admin-title">InternDock Control Panel</h1>
          <p className="admin-subtitle">Monitor platform applications, manage domain tracks, and issue verified credentials.</p>
        </div>

        <div className="admin-quick-actions">
          <Link to="/admin/domains">
            <motion.button whileHover={{ scale: 1.05 }} className="btn btn-secondary">
              <span>Manage Domains</span>
            </motion.button>
          </Link>
          <Link to="/admin/applications">
            <motion.button whileHover={{ scale: 1.05 }} className="btn btn-primary btn-glow">
              <span>Manage Applications</span>
              <ArrowRight size={16} />
            </motion.button>
          </Link>
        </div>
      </motion.div>

      <h2 className="section-title-sm" style={{ margin: "2rem 0 1rem 0" }}>Platform Overview Metrics</h2>

      <div className="grid-4 stats-grid">
        {cards.map((c, index) => {
          const IconComp = c.icon;
          return (
            <motion.div 
              key={c.label} 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: index * 0.05 }}
              whileHover={{ y: -4 }}
              className="glass-card stat-card"
            >
              <div className="stat-header">
                <IconComp className="stat-icon" size={24} color="#818cf8" />
                <span className={`badge-pill ${c.badgeClass}`}>{c.label}</span>
              </div>
              <h2 className="stat-value">{c.value}</h2>
            </motion.div>
          );
        })}
      </div>

      <style>{`
        .admin-container { padding: 3rem 1.5rem; }
        .admin-header { display: flex; align-items: center; justify-content: space-between; padding: 2.5rem; background: #ffffff; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(15, 23, 42, 0.04); }
        .admin-title { font-size: 2.2rem; font-weight: 800; color: #0f172a; margin: 0.5rem 0 0.25rem 0; }
        .admin-subtitle { color: #475569; font-size: 0.95rem; }
        .admin-quick-actions { display: flex; gap: 1rem; }
        .section-title-sm { font-size: 1.3rem; font-weight: 800; color: #0f172a; }
        .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 1.25rem; }
        .stat-card { padding: 1.75rem; display: flex; flex-direction: column; gap: 0.75rem; background: #ffffff !important; border: 1px solid #cbd5e1 !important; border-radius: var(--radius-md); box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05); }
        .stat-header { display: flex; align-items: center; justify-content: space-between; }
        .stat-value { font-family: var(--font-heading); font-size: 2.4rem; font-weight: 900; color: #0f172a !important; margin: 0.25rem 0 0 0; }
        @media (max-width: 900px) { .admin-header { flex-direction: column; align-items: flex-start; gap: 1.5rem; } }
      `}</style>
    </div>
  );
}
