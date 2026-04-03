export default function RelationalReasoningGame() {
  const isMobile = typeof window !== "undefined" ? window.innerWidth <= 900 : false;

  return (
    <div style={{ position: "relative", height: "100dvh", background: "#0A0A0F" }}>
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
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(10, 10, 15, 0.88)",
          color: "#a78bfa",
          fontFamily: "monospace",
          fontSize: isMobile ? 13 : 12,
          letterSpacing: 0.4,
        }}
      >
        ← Games
      </a>

      <iframe
        title="Relational Reasoning Trainer"
        src="games/relational-reasoning/index.html"
        style={{ width: "100%", height: "100%", border: "none", display: "block" }}
      />
    </div>
  );
}
