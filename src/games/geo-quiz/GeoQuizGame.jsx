import GeoQuiz from "../../App";

export default function GeoQuizGame() {
  return (
    <div style={{ position: "relative" }}>
      <a
        href="#/"
        style={{
          position: "fixed",
          top: 12,
          left: 12,
          zIndex: 400,
          textDecoration: "none",
          padding: "8px 12px",
          borderRadius: 6,
          border: "1px solid #2a2e3a",
          background: "rgba(24, 27, 36, 0.9)",
          color: "#a78bfa",
          fontFamily: "monospace",
          fontSize: 12,
          letterSpacing: 0.4,
        }}
      >
        ← Games
      </a>
      <GeoQuiz />
    </div>
  );
}
