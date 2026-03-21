import React, { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

// ── Scroll Reveal Hook ────────────────────────────────
function useScrollReveal() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("visible");
          }
        });
      },
      { threshold: 0.1 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

// ── Count-Up Hook ─────────────────────────────────────
function useCountUp(ref, target, suffix = "") {
  useEffect(() => {
    if (!ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        let current = 0;
        const step = target / 60;
        const timer = setInterval(() => {
          current += step;
          if (current >= target) {
            current = target;
            clearInterval(timer);
          }
          el.textContent = Math.floor(current) + suffix;
        }, 16);
        io.disconnect();
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [ref, target, suffix]);
}

// ── Home Page ─────────────────────────────────────────
export default function Home() {
  const navigate = useNavigate();
  useScrollReveal();

  const stat1 = useRef(null);
  const stat2 = useRef(null);
  const stat3 = useRef(null);
  useCountUp(stat1, 10, "×");
  useCountUp(stat2, 94, "%");
  useCountUp(stat3, 50, "k+");

  const S = {
    section: {
      padding: "6rem 4rem",
    },
    sectionTag: {
      fontSize: "0.75rem", fontWeight: 700,
      letterSpacing: "0.15em", textTransform: "uppercase",
      color: "#3dffc0", marginBottom: "0.8rem",
    },
    sectionTitle: {
      fontFamily: "Syne, sans-serif",
      fontSize: "clamp(2rem,4vw,3rem)",
      fontWeight: 800, lineHeight: 1.1,
      letterSpacing: "-0.025em",
      marginBottom: "1rem",
    },
    sectionSub: {
      color: "#6b7a99", fontSize: "1.05rem", lineHeight: 1.7,
      maxWidth: 520,
    },
  };

  return (
    <main>
      {/* ── HERO ─────────────────────────────────────── */}
      <section
        id="hero"
        style={{
          minHeight: "100vh",
          display: "flex", alignItems: "center",
          padding: "8rem 4rem 4rem",
          position: "relative", overflow: "hidden",
        }}
      >
        {/* Grid background */}
        <div className="grid-bg" />

        {/* Gradient orbs */}
        {[
          { size: 600, color: "rgba(61,255,192,0.12)", top: -100, left: -100, delay: 0 },
          { size: 500, color: "rgba(91,141,255,0.10)", top: 100, right: -50, delay: -3 },
          { size: 400, color: "rgba(255,107,107,0.06)", bottom: 0, left: "40%", delay: -5 },
        ].map((orb, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: orb.size, height: orb.size,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
              filter: "blur(80px)",
              pointerEvents: "none",
              animation: `drift 8s ease-in-out infinite alternate`,
              animationDelay: `${orb.delay}s`,
              ...(orb.top !== undefined ? { top: orb.top } : {}),
              ...(orb.bottom !== undefined ? { bottom: orb.bottom } : {}),
              ...(orb.left !== undefined ? { left: orb.left } : {}),
              ...(orb.right !== undefined ? { right: orb.right } : {}),
            }}
          />
        ))}

        {/* Hero content */}
        <div style={{ maxWidth: 700, position: "relative", zIndex: 1 }}>
          {/* Live badge */}
          <div
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.35rem 0.9rem",
              background: "rgba(61,255,192,0.08)",
              border: "1px solid rgba(61,255,192,0.2)",
              borderRadius: "100px",
              fontSize: "0.8rem", fontWeight: 500, color: "#3dffc0",
              marginBottom: "2rem",
              animation: "fadeUp 0.6s ease both",
            }}
          >
            <div
              style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#3dffc0",
                animation: "pulse-dot 2s infinite",
              }}
            />
            Powered by Gemini AI
          </div>

          <h1
            style={{
              fontFamily: "Syne, sans-serif",
              fontSize: "clamp(2.8rem, 6vw, 5rem)",
              fontWeight: 800, lineHeight: 1.08,
              letterSpacing: "-0.03em",
              marginBottom: "1.5rem",
              animation: "fadeUp 0.6s 0.1s ease both",
            }}
          >
            Hire the{" "}
            <span
              style={{
                background: "linear-gradient(135deg, #3dffc0 0%, #5b8dff 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Right Talent,
            </span>
            <br />
            10× Faster.
          </h1>

          <p
            style={{
              fontSize: "1.1rem", color: "#6b7a99", lineHeight: 1.7,
              maxWidth: 520, marginBottom: "2.5rem",
              animation: "fadeUp 0.6s 0.2s ease both",
            }}
          >
            AI-powered recruitment platform that automatically screens resumes,
            ranks candidates, and identifies the perfect match — so you can
            focus on what matters.
          </p>

          <div
            style={{
              display: "flex", alignItems: "center", gap: "1rem",
              flexWrap: "wrap",
              animation: "fadeUp 0.6s 0.3s ease both",
            }}
          >
            <button
              onClick={() => navigate("/login")}
              style={{
                padding: "0.85rem 2rem", borderRadius: 12,
                background: "#3dffc0", color: "#080b12",
                border: "none", fontFamily: "DM Sans, sans-serif",
                fontWeight: 600, fontSize: "1rem", cursor: "none",
                boxShadow: "0 0 32px rgba(61,255,192,0.4)",
                transition: "all 0.25s",
              }}
            >
              Start Free Trial →
            </button>
            <button
              onClick={() => document.getElementById("how").scrollIntoView({ behavior: "smooth" })}
              style={{
                padding: "0.85rem 2rem", borderRadius: 12,
                border: "1px solid rgba(255,255,255,0.1)",
                background: "transparent", color: "#6b7a99",
                fontFamily: "DM Sans, sans-serif", fontSize: "1rem",
                cursor: "none", transition: "all 0.25s",
              }}
            >
              See How It Works
            </button>
          </div>

          {/* Stats */}
          <div
            style={{
              display: "flex", gap: "3rem", marginTop: "4rem",
              animation: "fadeUp 0.6s 0.4s ease both",
            }}
          >
            {[
              { ref: stat1, label: "Faster Hiring" },
              { ref: stat2, label: "Match Accuracy" },
              { ref: stat3, label: "Hires Made" },
            ].map(({ ref, label }) => (
              <div key={label}>
                <div
                  ref={ref}
                  style={{
                    fontFamily: "Syne, sans-serif",
                    fontSize: "2rem", fontWeight: 800,
                    color: "#e8edf5",
                  }}
                >
                  0
                </div>
                <div style={{ fontSize: "0.8rem", color: "#6b7a99", marginTop: "0.2rem" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Floating preview card */}
        <div
          style={{
            position: "absolute", right: "4rem", top: "50%",
            transform: "translateY(-50%)",
            width: 400, zIndex: 1,
            animation: "fadeUp 0.8s 0.3s ease both",
          }}
        >
          <div
            style={{
              background: "#0d1220",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 20, padding: "1.5rem",
              boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
              animation: "float 4s ease-in-out infinite",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.2rem" }}>
              <span style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.95rem" }}>
                Top Candidates
              </span>
              <span style={{ padding: "0.25rem 0.7rem", borderRadius: "100px", fontSize: "0.7rem", fontWeight: 600, background: "rgba(61,255,192,0.15)", color: "#3dffc0" }}>
                3 New
              </span>
            </div>
            {[
              { name: "Priya Agarwal", role: "Senior React Developer", score: 94, grad: ["#3dffc0","#5b8dff"] },
              { name: "Rahul Kumar",  role: "Full Stack Engineer",     score: 87, grad: ["#5b8dff","#ff6b6b"] },
              { name: "Sara Mehta",   role: "UI/UX + Frontend",        score: 82, grad: ["#ff6b6b","#ffd93d"] },
            ].map((a) => (
              <div key={a.name} style={{ display: "flex", alignItems: "center", gap: "0.8rem", padding: "0.7rem 0.9rem", background: "#080b12", borderRadius: 10, border: "1px solid rgba(255,255,255,0.07)", marginBottom: "0.7rem" }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg,${a.grad[0]},${a.grad[1]})`, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: "0.7rem", color: "#080b12", flexShrink: 0 }}>
                  {a.name.split(" ").map(n => n[0]).join("")}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: "0.7rem", color: "#6b7a99" }}>{a.role}</div>
                  <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.07)", marginTop: "0.4rem", overflow: "hidden" }}>
                    <div style={{ width: `${a.score}%`, height: "100%", background: "linear-gradient(90deg,#3dffc0,#5b8dff)", borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, fontSize: "0.8rem", color: "#3dffc0" }}>{a.score}%</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────── */}
      <section id="features" style={{ ...S.section, background: "#0d1220", position: "relative" }}>
        <div style={{ height: 1, background: "linear-gradient(90deg,transparent,#3dffc0,#5b8dff,transparent)", opacity: 0.3, marginBottom: "4rem" }} />
        <div className="reveal" style={{ maxWidth: 500, marginBottom: "3rem" }}>
          <div style={S.sectionTag}>Features</div>
          <h2 style={S.sectionTitle}>Everything you need to hire smarter</h2>
          <p style={S.sectionSub}>A complete recruitment ecosystem powered by cutting-edge AI technology.</p>
        </div>

        <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5px", background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden" }}>
          {[
            { icon: "🤖", color: "rgba(61,255,192,0.1)",  title: "AI Resume Screening",   desc: "Gemini AI reads and understands resumes in seconds, extracting skills, experience, and cultural fit signals automatically." },
            { icon: "📊", color: "rgba(91,141,255,0.1)",  title: "Smart Match Scoring",   desc: "Get a precision match score for each applicant based on JD requirements — no more manual comparison." },
            { icon: "📄", color: "rgba(255,107,107,0.1)", title: "PDF Intelligence",       desc: "Advanced PDF parsing extracts text from any resume format — even scanned documents — with 99.2% accuracy." },
            { icon: "🔐", color: "rgba(255,211,61,0.1)",  title: "Secure Auth & Roles",   desc: "JWT-based authentication with Admin, Recruiter, and Viewer access levels built in from day one." },
            { icon: "📈", color: "rgba(61,255,192,0.1)",  title: "Hiring Analytics",       desc: "Real-time dashboards tracking pipeline velocity, offer acceptance rates, and source quality metrics." },
            { icon: "⚡", color: "rgba(91,141,255,0.1)",  title: "Lightning Fast API",     desc: "FastAPI backend with async processing handles thousands of applications concurrently." },
          ].map((f) => (
            <FeatureCard key={f.title} {...f} />
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────── */}
      <section id="how" style={S.section}>
        <div className="reveal" style={{ textAlign: "center", marginBottom: "3rem" }}>
          <div style={S.sectionTag}>Process</div>
          <h2 style={S.sectionTitle}>From Job Post to Hire in 4 Steps</h2>
          <p style={{ ...S.sectionSub, margin: "0 auto" }}>
            Our streamlined workflow cuts your time-to-hire from weeks to days.
          </p>
        </div>
        <div className="reveal" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.5rem", position: "relative" }}>
          {[
            { num: "01", title: "Post a Job",          desc: "Create a detailed job description. AI automatically extracts key requirements and skills." },
            { num: "02", title: "Collect Resumes",     desc: "Candidates apply and upload PDFs. Our parser instantly processes every document." },
            { num: "03", title: "AI Ranks Matches",    desc: "Gemini AI scores each applicant 0–100 with a detailed breakdown of strengths and gaps." },
            { num: "04", title: "Hire with Confidence",desc: "Interview only your top-ranked candidates. Make data-driven hiring decisions every time." },
          ].map((s) => (
            <StepCard key={s.num} {...s} />
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────── */}
      <section
        id="cta"
        style={{
          padding: "6rem 4rem",
          background: "linear-gradient(135deg, rgba(61,255,192,0.05) 0%, rgba(91,141,255,0.05) 100%)",
          borderTop: "1px solid rgba(255,255,255,0.07)",
          textAlign: "center",
          position: "relative", overflow: "hidden",
        }}
      >
        <div style={{
          position: "absolute", width: 600, height: 300,
          background: "radial-gradient(ellipse, rgba(61,255,192,0.08) 0%, transparent 70%)",
          top: "50%", left: "50%", transform: "translate(-50%,-50%)",
          pointerEvents: "none",
        }} />
        <div className="reveal" style={{ position: "relative", zIndex: 1 }}>
          <div style={S.sectionTag}>Get Started</div>
          <h2 style={{ ...S.sectionTitle, fontSize: "clamp(2rem,4vw,3.5rem)" }}>
            Ready to transform<br />your hiring?
          </h2>
          <p style={{ ...S.sectionSub, margin: "0 auto 2.5rem" }}>
            Join 500+ companies already using TalentAI to find their best hires — faster, smarter, and more confidently.
          </p>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "0.9rem 2.5rem", borderRadius: 12,
              background: "#3dffc0", color: "#080b12",
              border: "none", fontFamily: "DM Sans, sans-serif",
              fontWeight: 700, fontSize: "1rem", cursor: "none",
              boxShadow: "0 0 40px rgba(61,255,192,0.4)",
            }}
          >
            Start Your Free Trial →
          </button>
        </div>
      </section>
    </main>
  );
}

// ── Sub-components ────────────────────────────────────
function FeatureCard({ icon, color, title, desc }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? "#121929" : "#0d1220",
        padding: "2rem", transition: "background 0.3s",
        position: "relative", overflow: "hidden",
      }}
    >
      {hovered && (
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          height: 2, background: "linear-gradient(90deg,#3dffc0,#5b8dff)",
        }} />
      )}
      <div style={{ width: 48, height: 48, borderRadius: 12, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.3rem", marginBottom: "1.2rem" }}>
        {icon}
      </div>
      <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, marginBottom: "0.6rem" }}>{title}</div>
      <p style={{ fontSize: "0.875rem", color: "#6b7a99", lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}

function StepCard({ num, title, desc }) {
  const [hovered, setHovered] = React.useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        textAlign: "center", padding: "2rem 1.5rem",
        background: "#0d1220",
        border: `1px solid ${hovered ? "rgba(61,255,192,0.3)" : "rgba(255,255,255,0.07)"}`,
        borderRadius: 16,
        transform: hovered ? "translateY(-6px)" : "none",
        transition: "all 0.3s",
      }}
    >
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: "#080b12",
        border: `2px solid ${hovered ? "#3dffc0" : "rgba(255,255,255,0.07)"}`,
        boxShadow: hovered ? "0 0 20px rgba(61,255,192,0.3)" : "none",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.1rem",
        color: "#3dffc0", margin: "0 auto 1.2rem",
        transition: "all 0.3s",
      }}>
        {num}
      </div>
      <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 700, marginBottom: "0.5rem" }}>{title}</div>
      <p style={{ fontSize: "0.825rem", color: "#6b7a99", lineHeight: 1.6 }}>{desc}</p>
    </div>
  );
}