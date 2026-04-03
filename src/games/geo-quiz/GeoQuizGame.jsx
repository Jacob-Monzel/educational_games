import GeoQuiz from "../../App";

export default function GeoQuizGame() {
  const isMobile = typeof window !== "undefined" ? window.innerWidth <= 900 : false;

  return (
    <div style={{ position: "relative" }}>
      <a
        href="#/"
        style={{
          position: "fixed",
          top: isMobile ? "calc(env(safe-area-inset-top, 0px) + 8px)" : 12,
          left: isMobile ? "calc(env(safe-area-inset-left, 0px) + 8px)" : 12,
          zIndex: 400,
          textDecoration: "none",
          padding: isMobile ? "10px 12px" : "8px 12px",
          borderRadius: 6,
          border: "1px solid #2a2e3a",
          background: "rgba(24, 27, 36, 0.9)",
          color: "#a78bfa",
          fontFamily: "monospace",
          fontSize: isMobile ? 13 : 12,
          letterSpacing: 0.4,
        }}
      >
        ← Games
      </a>
      <GeoQuiz />
    </div>
  );
}
