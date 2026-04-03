import { Component, Suspense, lazy, useEffect, useMemo, useState } from "react";
import GeoQuizGame from "./games/geo-quiz/GeoQuizGame";
import RelationalReasoningGame from "./games/relational-reasoning/RelationalReasoningGame";

const StreetStoriesManhattan = lazy(() =>
  import("./games/street-stories/StreetStoriesManhattan")
);

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
    id: "relational-reasoning",
    title: "Relational Reasoning",
    description:
      "SMART-style cognitive training for same/opposite, before/after, and comparison relations.",
    route: "/games/relational-reasoning",
    status: "Live",
    accent: "#3B82F6",
  },
  {
    id: "street-stories-manhattan",
    title: "Street Stories: Manhattan",
    description:
      "Interactive atlas for Manhattan street-name origins, former names, and changing names by segment.",
    route: "/games/street-stories-manhattan",
    status: "MVP",
    accent: "#60a5fa",
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

function RouteLoading() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "#fafaf8",
        color: "#6B7280",
        fontFamily: "'Source Sans 3', sans-serif",
      }}
    >
      Loading map experience...
    </main>
  );
}

class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    this.setState({
      errorMessage:
        error?.message || "Unknown runtime error in Street Stories route.",
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <main
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#fafaf8",
          color: "#2c2c2c",
          fontFamily: "'Source Sans 3', sans-serif",
          padding: 20,
        }}
      >
        <div style={{ maxWidth: 560, textAlign: "center" }}>
          <h2 style={{ margin: "0 0 8px", fontFamily: "'Source Serif 4', serif" }}>
            Street Stories failed to load
          </h2>
          <p style={{ margin: "0 0 14px", color: "#6b7280" }}>
            This route hit a runtime error. Refresh and try again, or return to the library.
          </p>
          {this.state.errorMessage ? (
            <pre
              style={{
                margin: "0 0 14px",
                padding: "10px 12px",
                border: "1px solid #e5dfd2",
                borderRadius: 8,
                background: "#fff",
                color: "#444",
                textAlign: "left",
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontSize: 12,
              }}
            >
              {this.state.errorMessage}
            </pre>
          ) : null}
          <a
            href="#/"
            style={{
              display: "inline-block",
              textDecoration: "none",
              color: "#2c2c2c",
              border: "1px solid #d8d2c4",
              borderRadius: 8,
              padding: "8px 12px",
              background: "#fff",
            }}
          >
            Back to game library
          </a>
        </div>
      </main>
    );
  }
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
    if (route === "/games/relational-reasoning") return <RelationalReasoningGame />;
    if (route === "/games/street-stories-manhattan") {
      return (
        <Suspense fallback={<RouteLoading />}>
          <RouteErrorBoundary>
            <StreetStoriesManhattan />
          </RouteErrorBoundary>
        </Suspense>
      );
    }
    return <NotFound />;
  }, [route]);

  return screen;
}
