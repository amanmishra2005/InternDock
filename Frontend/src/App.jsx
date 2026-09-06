import React, { useEffect } from "react";
import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Header from "./components/Header";
import Footer from "./components/Footer";
import CursorGlow from "./components/CursorGlow";
import { ProtectedRoute, AdminRoute } from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Domains from "./pages/Domains";
import DomainDetails from "./pages/DomainDetails";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Apply from "./pages/Apply";
import StudentDashboard from "./pages/StudentDashboard";
import ApplicationWorkspace from "./pages/ApplicationWorkspace";
import AdminDashboard from "./pages/AdminDashboard";
import AdminDomains from "./pages/AdminDomains";
import AdminApplications from "./pages/AdminApplications";
import VerifyOffer from "./pages/VerifyOffer";
import VerifyCertificate from "./pages/VerifyCertificate";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import TermsOfService from "./pages/TermsOfService";
import RefundPolicy from "./pages/RefundPolicy";

export default function App() {
  const location = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    if (!location.hash) return undefined;

    const targetId = decodeURIComponent(location.hash.slice(1));
    const scrollToTarget = () => {
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ block: "start", behavior: "smooth" });
      }
    };

    const frameId = window.requestAnimationFrame(scrollToTarget);
    return () => window.cancelAnimationFrame(frameId);
  }, [location.pathname, location.hash]);

  return (
    <div
      className="app-shell"
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <CursorGlow />
      <Header />
      <main style={{ flex: 1, position: "relative" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
          >
            <Routes location={location}>
              <Route path="/" element={<Home />} />
              <Route path="/domains" element={<Domains />} />
              <Route path="/domains/:slug" element={<DomainDetails />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/refund-policy" element={<RefundPolicy />} />

              <Route path="/verify/offer" element={<VerifyOffer />} />
              <Route path="/verify/offer/:id" element={<VerifyOffer />} />
              <Route
                path="/verify/certificate"
                element={<VerifyCertificate />}
              />
              <Route
                path="/verify/certificate/:id"
                element={<VerifyCertificate />}
              />

              <Route
                path="/apply/:slug"
                element={
                  <ProtectedRoute>
                    <Apply />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <StudentDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/applications/:id"
                element={
                  <ProtectedRoute>
                    <ApplicationWorkspace />
                  </ProtectedRoute>
                }
              />

              <Route
                path="/admin"
                element={
                  <AdminRoute>
                    <AdminDashboard />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/domains"
                element={
                  <AdminRoute>
                    <AdminDomains />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/applications"
                element={
                  <AdminRoute>
                    <AdminApplications />
                  </AdminRoute>
                }
              />

              <Route
                path="*"
                element={
                  <div
                    className="container"
                    style={{ padding: "5rem 1rem", textAlign: "center" }}
                  >
                    <h2>404 — Page Not Found</h2>
                    <p style={{ color: "var(--text-muted)" }}>
                      The requested route does not exist.
                    </p>
                  </div>
                }
              />
            </Routes>
          </motion.div>
        </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
