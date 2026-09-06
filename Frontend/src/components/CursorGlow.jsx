import React, { useEffect, useRef } from "react";

/**
 * A large, soft, light-colored circle that trails the pointer across
 * every page.
 * - Pure CSS transform animation driven by rAF (cheap, GPU-friendly).
 * - pointer-events: none, so it never blocks clicks/interaction.
 * - Only mounts for mouse/trackpad users (pointer: fine) and skips
 *   entirely when the user prefers reduced motion.
 */
export default function CursorGlow() {
  const ringRef = useRef(null);

  useEffect(() => {
    const finePointer = window.matchMedia("(pointer: fine)").matches;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!finePointer || reduceMotion) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let ringX = mouseX;
    let ringY = mouseY;
    let raf;
    let visible = false;

    const onMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      if (!visible) {
        visible = true;
        if (ringRef.current) ringRef.current.style.opacity = "1";
      }
    };

    const onLeave = () => {
      visible = false;
      if (ringRef.current) ringRef.current.style.opacity = "0";
    };

    const tick = () => {
      // Ease the glow circle toward the cursor position
      ringX += (mouseX - ringX) * 0.14;
      ringY += (mouseY - ringY) * 0.14;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0) translate(-50%, -50%)`;
      }
      raf = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    document.addEventListener("mouseleave", onLeave);
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-glow-ring" aria-hidden="true" />
      <style>{`
        .cursor-glow-ring {
          position: fixed;
          top: 0;
          left: 0;
          width: 620px;
          height: 620px;
          border-radius: 50%;
          pointer-events: none;
          z-index: 2;
          opacity: 0;
          transition: opacity 0.5s ease;
          background: radial-gradient(circle, rgba(129, 140, 248, 0.22) 0%, rgba(167, 139, 250, 0.14) 32%, rgba(103, 232, 249, 0.08) 55%, transparent 72%);
          will-change: transform;
        }
        @media (max-width: 900px), (pointer: coarse) {
          .cursor-glow-ring { display: none; }
        }
      `}</style>
    </>
  );
}
