import { useEffect, useMemo, useState } from "react";
import GeoQuizGame from "./games/geo-quiz/GeoQuizGame";

const GAME_LIBRARY = [
  {
    id: "geo-quiz",
    title: "Geo Quiz",
    description: "Given a flag or a capital, click the correct country on the world map.",
    route: "/games/geo-quiz",
    status: "Live",
    accent: "#a78bfa",
  },
  {
    id: "math-sprint",
    title: "Math Sprint",
    description: "Fast mental-math rounds with streak scoring.",
    route: null,
    status: "Coming Soon",
    accent: "#34d399",
  },
  {
    id: "word-grid",
    title: "Word Grid",
    description: "Find hidden words before time runs out.",
    route: null,
    status: "Coming Soon",
    accent: "#f59e0b",
  },
];

function getRouteFromHash() {
  const raw = window.location.hash.replace(/^#/, "");
  if (!raw) return "/";
  return raw.startsWith("/") ? raw : `/${raw}`;
}

function LibraryHome() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(167,139,250,0.2), transparent 35%), #0f1117",
        color: "#e2e4ea",
        fontFamily: "'Courier New',monospace",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "max(env(safe-area-inset-top), 24px) 20px max(env(safe-area-inset-bottom), 24px)",
        }}
      >
        <header style={{ marginBottom: 26 }}>
          <div
            style={{
              display: "inline-block",
              fontSize: 11,
              padding: "4px 10px",
              borderRadius: 999,
              textTransform: "uppercase",
              letterSpacing: 1.4,
              border: "1px solid #2a2e3a",
              color: "#8b8fa3",
            }}
          >
            Educational Games
          </div>
          <h1
            style={{
              margin: "16px 0 12px",
              fontFamily: "Georgia,serif",
              fontSize: "clamp(32px, 5vw, 52px)",
              lineHeight: 1.1,
              letterSpacing: -0.6,
            }}
          >
            Pick a game
          </h1>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 14,
          }}
        >
          {GAME_LIBRARY.map((game) => {
            const live = Boolean(game.route);
            const cardStyle = {
              border: "1px solid #2a2e3a",
              borderRadius: 10,
              padding: "16px 16px 14px",
              background: "#181b24",
              textDecoration: "none",
              color: "#e2e4ea",
              display: "block",
              transition: "transform 0.15s ease, border-color 0.15s ease",
            };

            return live ? (
              <a key={game.id} href={`#${game.route}`} style={cardStyle}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ margin: 0, fontSize: 22, fontFamily: "Georgia,serif" }}>{game.title}</h2>
                  <span
                    style={{
                      color: game.accent,
                      border: `1px solid ${game.accent}55`,
                      padding: "3px 8px",
                      borderRadius: 999,
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: 1.1,
                    }}
                  >
                    {game.status}
                  </span>
                </div>
                <p style={{ color: "#8b8fa3", marginBottom: 0, lineHeight: 1.45 }}>{game.description}</p>
              </a>
            ) : (
              <div key={game.id} style={{ ...cardStyle, opacity: 0.72 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <h2 style={{ margin: 0, fontSize: 22, fontFamily: "Georgia,serif" }}>{game.title}</h2>
                  <span
                    style={{
                      color: game.accent,
                      border: `1px solid ${game.accent}55`,
                      padding: "3px 8px",
                      borderRadius: 999,
                      fontSize: 10,
                      textTransform: "uppercase",
                      letterSpacing: 1.1,
                    }}
                  >
                    {game.status}
                  </span>
                </div>
                <p style={{ color: "#8b8fa3", marginBottom: 0, lineHeight: 1.45 }}>{game.description}</p>
              </div>
            );
          })}
        </section>
      </div>
    </main>
  );
}

function NotFound() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#0f1117",
        color: "#e2e4ea",
        fontFamily: "'Courier New',monospace",
      }}
    >
      <div style={{ textAlign: "center" }}>
        <h2 style={{ fontFamily: "Georgia,serif", marginBottom: 8 }}>Game not found</h2>
        <p style={{ color: "#8b8fa3", marginTop: 0 }}>That route does not map to a game yet.</p>
        <a
          href="#/"
          style={{
            display: "inline-block",
            marginTop: 10,
            textDecoration: "none",
            color: "#a78bfa",
            border: "1px solid #2a2e3a",
            borderRadius: 6,
            padding: "8px 12px",
          }}
        >
          Back to game library
        </a>
      </div>
    </main>
  );
}

export default function SiteApp() {
  const [route, setRoute] = useState(getRouteFromHash);

  useEffect(() => {
    const onHashChange = () => setRoute(getRouteFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const screen = useMemo(() => {
    if (route === "/") return <LibraryHome />;
    if (route === "/games/geo-quiz") return <GeoQuizGame />;
    return <NotFound />;
  }, [route]);

  return screen;
}
