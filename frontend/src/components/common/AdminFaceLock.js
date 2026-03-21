import React, { useState, useEffect, useRef, useCallback } from "react";

// ── AdminFaceLock Component ───────────────────────────
// Webcam face recognition using face-api.js
// Admin Portal enter करताना हा screen येतो
// Face match झाल्यावरच access मिळतो

export default function AdminFaceLock({ onUnlock }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);

  const [status, setStatus] = useState("init"); 
  // init | loading | ready | scanning | matched | failed | setup | saving

  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceDescriptor, setFaceDescriptor] = useState(null); // stored face
  const [attempts, setAttempts] = useState(0);
  const [countdown, setCountdown] = useState(3);
  const [message, setMessage] = useState("Face Recognition लोड होतोय...");
  const [setupMode, setSetupMode] = useState(false); // पहिल्यांदा face register करण्यासाठी

  const MAX_ATTEMPTS = 3;

  // ── Load face-api.js models ───────────────────────
  useEffect(() => {
    const loadModels = async () => {
      try {
        setMessage("AI Models लोड होतोय...");

        // face-api.js CDN वरून load करतो
        const script = document.createElement("script");
        script.src = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
        script.onload = async () => {
          try {
            const MODEL_URL = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights";
            await Promise.all([
              window.faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
              window.faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
              window.faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
            ]);
            setModelsLoaded(true);
            setMessage("Camera सुरू करतोय...");
            startCamera();
          } catch (err) {
            setMessage("Model load failed. Refresh करा.");
            setStatus("failed");
          }
        };
        document.head.appendChild(script);
      } catch (err) {
        setMessage("Face API load failed.");
        setStatus("failed");
      }
    };

    // localStorage मध्ये stored face descriptor आहे का बघ
    const stored = localStorage.getItem("admin_face_descriptor");
    if (!stored) {
      setSetupMode(true);
      setStatus("setup");
      setMessage("पहिल्यांदा तुमचा चेहरा register करा");
    }

    loadModels();
    return () => stopCamera();
  }, []);

  // ── Start webcam ──────────────────────────────────
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: "user" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setStatus(setupMode ? "setup" : "ready");
        setMessage(setupMode ? "तुमचा चेहरा frame मध्ये ठेवा आणि 'Register Face' दाबा" : "तुमचा चेहरा camera कडे ठेवा");
      }
    } catch (err) {
      setMessage("Camera access नाकारली. Browser settings मध्ये Camera allow करा.");
      setStatus("failed");
    }
  };

  // ── Stop webcam ───────────────────────────────────
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }
  };

  // ── Register face (Setup mode) ────────────────────
  const registerFace = async () => {
    if (!window.faceapi || !videoRef.current) return;
    setStatus("saving");
    setMessage("चेहरा capture होतोय...");

    try {
      const detection = await window.faceapi
        .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setMessage("❌ चेहरा दिसला नाही. नीट camera कडे बघा.");
        setStatus("setup");
        return;
      }

      // Face descriptor localStorage मध्ये save करा
      const descriptorArray = Array.from(detection.descriptor);
      localStorage.setItem("admin_face_descriptor", JSON.stringify(descriptorArray));
      setFaceDescriptor(detection.descriptor);
      setSetupMode(false);
      setStatus("ready");
      setMessage("✅ चेहरा registered! आता verify करा.");
    } catch (err) {
      setMessage("Capture failed. पुन्हा try करा.");
      setStatus("setup");
    }
  };

  // ── Verify face ───────────────────────────────────
  const verifyFace = useCallback(async () => {
    if (!window.faceapi || !videoRef.current || status === "scanning") return;

    setStatus("scanning");
    setMessage("चेहरा verify होतोय...");

    // Countdown
    for (let i = 3; i >= 1; i--) {
      setCountdown(i);
      await new Promise((r) => setTimeout(r, 700));
    }

    try {
      const detection = await window.faceapi
        .detectSingleFace(videoRef.current, new window.faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!detection) {
        setAttempts((a) => a + 1);
        setMessage("❌ चेहरा दिसला नाही. नीट camera कडे बघा.");
        setStatus("ready");
        return;
      }

      // Stored descriptor load करा
      const storedArray = JSON.parse(localStorage.getItem("admin_face_descriptor") || "[]");
      const storedDescriptor = new Float32Array(storedArray);

      // Euclidean distance calculate करा
      const distance = window.faceapi.euclideanDistance(
        detection.descriptor,
        storedDescriptor
      );

      console.log("Face distance:", distance); // Debug साठी

      if (distance < 0.5) {
        // ✅ Match! (threshold: 0.5 — कमी = जास्त strict)
        setStatus("matched");
        setMessage("✅ Face verified! Admin Portal उघडतोय...");
        stopCamera();
        setTimeout(() => onUnlock(), 1500);
      } else {
        // ❌ No match
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);

        if (newAttempts >= MAX_ATTEMPTS) {
          setStatus("failed");
          setMessage(`❌ ${MAX_ATTEMPTS} वेळा failed. 30 सेकंद wait करा.`);
          setTimeout(() => {
            setAttempts(0);
            setStatus("ready");
            setMessage("पुन्हा try करा.");
          }, 30000);
        } else {
          setMessage(`❌ Match नाही. ${MAX_ATTEMPTS - newAttempts} attempts बाकी.`);
          setStatus("ready");
        }
      }
    } catch (err) {
      setMessage("Verification error. पुन्हा try करा.");
      setStatus("ready");
    }
  }, [status, attempts, onUnlock]);

  // ── Reset stored face ─────────────────────────────
  const resetFace = () => {
    localStorage.removeItem("admin_face_descriptor");
    setSetupMode(true);
    setStatus("setup");
    setMessage("नवीन चेहरा register करा");
  };

  // ── UI ────────────────────────────────────────────
  const statusColor = {
    matched: "#3dffc0",
    failed: "#ff6b6b",
    scanning: "#5b8dff",
    ready: "#e8edf5",
    setup: "#ffd93d",
    saving: "#ffd93d",
  }[status] || "#6b7a99";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 999,
      background: "#080b12",
      display: "flex", alignItems: "center", justifyContent: "center",
      flexDirection: "column",
    }}>
      {/* Orbs */}
      <div style={{ position: "absolute", width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(61,255,192,0.06) 0%, transparent 70%)", filter: "blur(80px)", top: -100, left: -100, pointerEvents: "none" }} />
      <div style={{ position: "absolute", width: 400, height: 400, borderRadius: "50%", background: "radial-gradient(circle, rgba(91,141,255,0.06) 0%, transparent 70%)", filter: "blur(80px)", bottom: -100, right: -100, pointerEvents: "none" }} />

      {/* Card */}
      <div style={{
        background: "#0d1220",
        border: "1px solid rgba(255,255,255,0.07)",
        borderRadius: 24, padding: "2rem",
        width: "100%", maxWidth: 520,
        position: "relative", zIndex: 1,
        textAlign: "center",
      }}>
        {/* Header */}
        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>
            {status === "matched" ? "✅" : status === "failed" ? "🔒" : "👤"}
          </div>
          <div style={{ fontFamily: "Syne, sans-serif", fontWeight: 800, fontSize: "1.3rem" }}>
            {setupMode ? "Face Setup" : "Admin Face Lock"}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#6b7a99", marginTop: "0.3rem" }}>
            {setupMode ? "पहिल्यांदा चेहरा register करा" : "Admin Portal access साठी verify करा"}
          </div>
        </div>

        {/* Video Feed */}
        <div style={{
          position: "relative",
          width: 320, height: 240,
          margin: "0 auto 1.5rem",
          borderRadius: 16, overflow: "hidden",
          border: `2px solid ${statusColor}44`,
          boxShadow: `0 0 30px ${statusColor}22`,
          background: "#080b12",
        }}>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)" }}
          />
          <canvas ref={canvasRef} style={{ position: "absolute", top: 0, left: 0, display: "none" }} />

          {/* Face frame overlay */}
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none",
          }}>
            <div style={{
              width: 160, height: 180,
              border: `2px solid ${statusColor}`,
              borderRadius: "50%",
              opacity: status === "scanning" ? 1 : 0.4,
              animation: status === "scanning" ? "pulse 1s infinite" : "none",
            }} />
          </div>

          {/* Scanning overlay */}
          {status === "scanning" && (
            <div style={{
              position: "absolute", bottom: 0, left: 0, right: 0,
              background: "linear-gradient(transparent, rgba(91,141,255,0.3))",
              height: "50%",
              animation: "scanLine 1s ease-in-out infinite alternate",
            }} />
          )}

          {/* Countdown */}
          {status === "scanning" && (
            <div style={{
              position: "absolute", top: "50%", left: "50%",
              transform: "translate(-50%, -50%)",
              fontFamily: "Syne, sans-serif", fontWeight: 800,
              fontSize: "3rem", color: "#5b8dff",
              textShadow: "0 0 20px rgba(91,141,255,0.8)",
            }}>
              {countdown}
            </div>
          )}
        </div>

        {/* Status message */}
        <div style={{
          padding: "0.7rem 1rem",
          background: `${statusColor}11`,
          border: `1px solid ${statusColor}33`,
          borderRadius: 10,
          fontSize: "0.85rem", fontWeight: 500,
          color: statusColor,
          marginBottom: "1.5rem",
          minHeight: 40,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          {message}
        </div>

        {/* Attempts indicator */}
        {!setupMode && attempts > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "0.4rem", marginBottom: "1rem" }}>
            {[...Array(MAX_ATTEMPTS)].map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%",
                background: i < attempts ? "#ff6b6b" : "rgba(255,255,255,0.1)",
              }} />
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0.8rem" }}>
          {/* Setup mode — Register button */}
          {setupMode && (status === "setup" || status === "saving") && (
            <button
              onClick={registerFace}
              disabled={status === "saving"}
              style={{
                padding: "0.85rem", borderRadius: 12,
                background: status === "saving" ? "rgba(255,217,61,0.3)" : "#ffd93d",
                color: "#080b12", border: "none",
                fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "1rem",
                cursor: status === "saving" ? "not-allowed" : "pointer",
              }}
            >
              {status === "saving" ? "Saving..." : "📸 Register Face"}
            </button>
          )}

          {/* Verify button */}
          {!setupMode && (status === "ready" || status === "scanning") && (
            <button
              onClick={verifyFace}
              disabled={status === "scanning"}
              style={{
                padding: "0.85rem", borderRadius: 12,
                background: status === "scanning" ? "rgba(91,141,255,0.3)" : "#3dffc0",
                color: "#080b12", border: "none",
                fontFamily: "DM Sans, sans-serif", fontWeight: 700, fontSize: "1rem",
                cursor: status === "scanning" ? "not-allowed" : "pointer",
                boxShadow: status !== "scanning" ? "0 0 24px rgba(61,255,192,0.3)" : "none",
              }}
            >
              {status === "scanning" ? "Scanning..." : "🔍 Verify Face"}
            </button>
          )}

          {/* Reset face option */}
          {!setupMode && (
            <button
              onClick={resetFace}
              style={{
                padding: "0.5rem", borderRadius: 8,
                background: "transparent",
                border: "1px solid rgba(255,255,255,0.07)",
                color: "#6b7a99", fontSize: "0.8rem",
                cursor: "pointer",
              }}
            >
              🔄 Reset & Register New Face
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }
        @keyframes scanLine {
          from { opacity: 0.3; }
          to { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
}
