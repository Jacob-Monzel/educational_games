import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import { COUNTRY_MAP } from "./data/countries";

const WORLD_URL =
  "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

function normalizeId(id) {
  return String(id).padStart(3, "0");
}

function topoFeature(topology, object) {
  const arcs = topology.arcs;
  const { scale, translate } = topology.transform;

  function arcToCoords(arcIndex) {
    const reverse = arcIndex < 0;
    const index = reverse ? ~arcIndex : arcIndex;
    const arc = arcs[index];
    const coordinates = [];
    let x = 0;
    let y = 0;

    for (const [dx, dy] of arc) {
      x += dx;
      y += dy;
      coordinates.push([
        x * scale[0] + translate[0],
        y * scale[1] + translate[1],
      ]);
    }

    return reverse ? coordinates.reverse() : coordinates;
  }

  function ringToCoords(ring) {
    return ring.reduce((coordinates, arcIndex) => {
      const arcCoordinates = arcToCoords(arcIndex);
      return coordinates.concat(
        coordinates.length ? arcCoordinates.slice(1) : arcCoordinates,
      );
    }, []);
  }

  function geometryFromTopo(geometry) {
    if (geometry.type === "Polygon") {
      return {
        type: "Polygon",
        coordinates: geometry.arcs.map(ringToCoords),
      };
    }

    if (geometry.type === "MultiPolygon") {
      return {
        type: "MultiPolygon",
        coordinates: geometry.arcs.map((polygon) => polygon.map(ringToCoords)),
      };
    }

    return null;
  }

  return {
    type: "FeatureCollection",
    features: (object.geometries || [])
      .map((geometry) => ({
        type: "Feature",
        id: normalizeId(geometry.id),
        properties: geometry.properties || {},
        geometry: geometryFromTopo(geometry),
      }))
      .filter((feature) => feature.geometry),
  };
}

function chooseRandomFeature(features, previousId) {
  if (features.length <= 1) {
    return features[0];
  }

  let candidate = features[Math.floor(Math.random() * features.length)];
  let attempts = 0;

  while (candidate.id === previousId && attempts < 12) {
    candidate = features[Math.floor(Math.random() * features.length)];
    attempts += 1;
  }

  return candidate;
}

function getFillColor(highlightState, isHovered) {
  if (highlightState === "correct") {
    return "#34d399";
  }

  if (highlightState === "wrong") {
    return "#f87171";
  }

  if (highlightState === "reveal") {
    return "#22c55e";
  }

  return isHovered ? "#39425d" : "#232836";
}

function getStrokeColor(highlightState) {
  if (highlightState === "correct" || highlightState === "reveal") {
    return "#22c55e";
  }

  if (highlightState === "wrong") {
    return "#ef4444";
  }

  return "rgba(100, 107, 130, 0.5)";
}

function getStrokeWidth(highlightState) {
  if (highlightState === "reveal") {
    return 1.8;
  }

  if (highlightState === "correct") {
    return 1.5;
  }

  if (highlightState === "wrong") {
    return 1.1;
  }

  return 0.55;
}

export default function GeoQuiz() {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomRef = useRef(null);
  const timeoutRef = useRef(null);
  const previousQuestionIdRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [features, setFeatures] = useState([]);
  const [mode, setMode] = useState("mixed");
  const [question, setQuestion] = useState(null);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [answering, setAnswering] = useState(true);
  const [highlights, setHighlights] = useState({});
  const [hoveredId, setHoveredId] = useState(null);
  const [tooltip, setTooltip] = useState(null);
  const [viewport, setViewport] = useState({ width: 0, height: 0 });

  const loadMap = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(WORLD_URL);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const topology = await response.json();
      const collection = topoFeature(topology, topology.objects.countries);
      const supportedFeatures = collection.features.filter(
        (feature) => COUNTRY_MAP[feature.id],
      );

      setFeatures(supportedFeatures);
      setLoading(false);
    } catch (loadError) {
      setError(loadError.message || "Unable to load the world map.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMap();
  }, [loadMap]);

  useEffect(() => {
    if (!containerRef.current) {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      setViewport({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      });
    });

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const featureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features,
    }),
    [features],
  );

  const projection = useMemo(() => {
    if (!features.length || !viewport.width || !viewport.height) {
      return null;
    }

    const safeWidth = Math.max(viewport.width, 320);
    const safeHeight = Math.max(viewport.height, 320);
    const projectionValue = d3.geoNaturalEarth1();

    projectionValue.fitExtent(
      [
        [16, 16],
        [safeWidth - 16, safeHeight - 16],
      ],
      featureCollection,
    );

    return projectionValue;
  }, [featureCollection, features.length, viewport.height, viewport.width]);

  const pathGenerator = useMemo(
    () => (projection ? d3.geoPath(projection) : null),
    [projection],
  );

  const graticule = useMemo(() => d3.geoGraticule10(), []);

  const pickQuestion = useCallback(
    (selectedMode) => {
      if (!features.length) {
        return;
      }

      const nextFeature = chooseRandomFeature(
        features,
        previousQuestionIdRef.current,
      );
      const nextMode =
        selectedMode === "mixed"
          ? Math.random() < 0.5
            ? "flag"
            : "capital"
          : selectedMode;

      previousQuestionIdRef.current = nextFeature.id;
      setQuestion({
        featureId: nextFeature.id,
        info: COUNTRY_MAP[nextFeature.id],
        mode: nextMode,
      });
      setAnswering(true);
      setHighlights({});
      setHoveredId(null);
      setTooltip(null);
    },
    [features],
  );

  useEffect(() => {
    if (features.length && !question) {
      pickQuestion(mode);
    }
  }, [features, mode, pickQuestion, question]);

  useEffect(() => {
    if (!pathGenerator || !svgRef.current || !gRef.current) {
      return undefined;
    }

    const svg = d3.select(svgRef.current);
    const group = d3.select(gRef.current);
    const zoomBehavior = d3
      .zoom()
      .scaleExtent([1, 12])
      .on("zoom", (event) => {
        group.attr("transform", event.transform);
      });

    svg.call(zoomBehavior);
    svg.call(zoomBehavior.transform, d3.zoomIdentity);
    zoomRef.current = { svg, zoomBehavior };

    return () => {
      svg.on(".zoom", null);
    };
  }, [pathGenerator]);

  const queueNextQuestion = useCallback(
    (delay) => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setFeedback(null);
        pickQuestion(mode);
      }, delay);
    },
    [mode, pickQuestion],
  );

  const handleClick = useCallback(
    (featureId) => {
      if (!answering || !question) {
        return;
      }

      setAnswering(false);
      setHoveredId(null);
      setTooltip(null);

      const isCorrect = featureId === question.featureId;

      if (isCorrect) {
        setScore((currentScore) => currentScore + 1);
        setStreak((currentStreak) => currentStreak + 1);
        setHighlights({ [featureId]: "correct" });
        setFeedback({
          type: "correct",
          message: `Correct - ${question.info.n}`,
        });
      } else {
        setStreak(0);
        setHighlights({
          [featureId]: "wrong",
          [question.featureId]: "reveal",
        });
        setFeedback({
          type: "wrong",
          message: `Not quite - it was ${question.info.n}`,
        });
      }

      setTotal((currentTotal) => currentTotal + 1);
      queueNextQuestion(isCorrect ? 1200 : 2300);
    },
    [answering, question, queueNextQuestion],
  );

  const skipQuestion = useCallback(() => {
    if (!answering || !question) {
      return;
    }

    setAnswering(false);
    setStreak(0);
    setHoveredId(null);
    setTooltip(null);
    setTotal((currentTotal) => currentTotal + 1);
    setHighlights({ [question.featureId]: "reveal" });
    setFeedback({
      type: "wrong",
      message: `Skipped - ${question.info.n}`,
    });
    queueNextQuestion(2200);
  }, [answering, question, queueNextQuestion]);

  const changeMode = useCallback(
    (nextMode) => {
      setMode(nextMode);
      setFeedback(null);
      pickQuestion(nextMode);
    },
    [pickQuestion],
  );

  const zoomIn = useCallback(() => {
    if (!zoomRef.current) {
      return;
    }

    zoomRef.current.svg
      .transition()
      .duration(250)
      .call(zoomRef.current.zoomBehavior.scaleBy, 1.4);
  }, []);

  const zoomOut = useCallback(() => {
    if (!zoomRef.current) {
      return;
    }

    zoomRef.current.svg
      .transition()
      .duration(250)
      .call(zoomRef.current.zoomBehavior.scaleBy, 0.72);
  }, []);

  const zoomReset = useCallback(() => {
    if (!zoomRef.current) {
      return;
    }

    zoomRef.current.svg
      .transition()
      .duration(300)
      .call(zoomRef.current.zoomBehavior.transform, d3.zoomIdentity);
  }, []);

  const handleFlagError = useCallback(() => {
    setQuestion((currentQuestion) => {
      if (!currentQuestion || currentQuestion.mode !== "flag") {
        return currentQuestion;
      }

      return {
        ...currentQuestion,
        mode: "capital",
      };
    });
  }, []);

  const accuracy = total ? Math.round((score / total) * 100) : 0;
  const promptLabel = question?.mode || "mixed";
  const flagUrl = question
    ? `https://flagcdn.com/w160/${question.info.cc}.png`
    : "";

  if (loading) {
    return (
      <div className="geoquiz-shell geoquiz-center-panel">
        <div className="geoquiz-spinner" />
        <p className="geoquiz-subtle">Loading world atlas...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="geoquiz-shell geoquiz-center-panel">
        <h1>Map data failed to load</h1>
        <p className="geoquiz-subtle">{error}</p>
        <button className="geoquiz-button geoquiz-button-primary" onClick={loadMap}>
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="geoquiz-shell">
      <header className="geoquiz-header">
        <div>
          <p className="geoquiz-eyebrow">Interactive world geography challenge</p>
          <h1>GeoQuiz</h1>
        </div>

        <div className="geoquiz-stats">
          <div className="geoquiz-stat-card">
            <span className="geoquiz-stat-value">{score}</span>
            <span className="geoquiz-stat-label">Score</span>
          </div>
          <div className="geoquiz-stat-card">
            <span className="geoquiz-stat-value geoquiz-stat-value-gold">
              {streak}
            </span>
            <span className="geoquiz-stat-label">Streak</span>
          </div>
          <div className="geoquiz-stat-card">
            <span className="geoquiz-stat-value">{total}</span>
            <span className="geoquiz-stat-label">Played</span>
          </div>
          <div className="geoquiz-stat-card">
            <span className="geoquiz-stat-value">{accuracy}%</span>
            <span className="geoquiz-stat-label">Accuracy</span>
          </div>
        </div>
      </header>

      <section className="geoquiz-prompt-bar">
        <span className="geoquiz-chip">{promptLabel}</span>

        {question?.mode === "flag" ? (
          <div className="geoquiz-prompt">
            <img
              className="geoquiz-flag"
              src={flagUrl}
              alt={`Flag of ${question.info.n}`}
              onError={handleFlagError}
            />
            <div>
              <strong>Find this country on the map</strong>
              <span>Click the country that matches the flag.</span>
            </div>
          </div>
        ) : question ? (
          <div className="geoquiz-prompt">
            <div>
              <strong>Capital: {question.info.c}</strong>
              <span>Click the country where this capital belongs.</span>
            </div>
          </div>
        ) : null}
      </section>

      <section className="geoquiz-map-panel">
        <div className="geoquiz-map-wrap" ref={containerRef}>
          <svg ref={svgRef} className="geoquiz-map" viewBox={`0 0 ${viewport.width || 1000} ${viewport.height || 700}`}>
            {pathGenerator ? (
              <g ref={gRef}>
                <path
                  d={pathGenerator(graticule)}
                  fill="none"
                  stroke="#1f2432"
                  strokeWidth="0.45"
                />

                {features.map((feature) => {
                  const highlightState = highlights[feature.id];
                  const isHovered = hoveredId === feature.id && !highlightState;
                  const country = COUNTRY_MAP[feature.id];

                  return (
                    <path
                      key={feature.id}
                      d={pathGenerator(feature)}
                      className="geoquiz-country"
                      fill={getFillColor(highlightState, isHovered)}
                      stroke={getStrokeColor(highlightState)}
                      strokeWidth={getStrokeWidth(highlightState)}
                      onClick={() => handleClick(feature.id)}
                      onMouseEnter={(event) => {
                        setHoveredId(feature.id);
                        setTooltip({
                          name: country?.n || "Unknown country",
                          x: event.clientX,
                          y: event.clientY,
                        });
                      }}
                      onMouseMove={(event) => {
                        setTooltip((currentTooltip) =>
                          currentTooltip
                            ? {
                                ...currentTooltip,
                                x: event.clientX,
                                y: event.clientY,
                              }
                            : currentTooltip,
                        );
                      }}
                      onMouseLeave={() => {
                        setHoveredId((currentHoveredId) =>
                          currentHoveredId === feature.id ? null : currentHoveredId,
                        );
                        setTooltip(null);
                      }}
                    />
                  );
                })}
              </g>
            ) : null}
          </svg>

          <div className="geoquiz-zoom-controls">
            <button
              className="geoquiz-icon-button"
              onClick={zoomIn}
              aria-label="Zoom in"
            >
              +
            </button>
            <button
              className="geoquiz-icon-button"
              onClick={zoomOut}
              aria-label="Zoom out"
            >
              -
            </button>
            <button
              className="geoquiz-icon-button"
              onClick={zoomReset}
              aria-label="Reset zoom"
            >
              Reset
            </button>
          </div>
        </div>
      </section>

      <footer className="geoquiz-footer">
        <div className="geoquiz-mode-group">
          {["mixed", "flag", "capital"].map((entryMode) => (
            <button
              key={entryMode}
              className={`geoquiz-button ${
                mode === entryMode ? "geoquiz-button-primary" : ""
              }`}
              onClick={() => changeMode(entryMode)}
            >
              {entryMode}
            </button>
          ))}
        </div>

        <div className="geoquiz-footer-meta">
          <span>{features.length} countries loaded</span>
          <button className="geoquiz-button" onClick={skipQuestion}>
            Skip
          </button>
        </div>
      </footer>

      {feedback ? (
        <div className={`geoquiz-feedback geoquiz-feedback-${feedback.type}`}>
          {feedback.message}
        </div>
      ) : null}

      {tooltip ? (
        <div
          className="geoquiz-tooltip"
          style={{ left: tooltip.x + 14, top: tooltip.y - 14 }}
        >
          {tooltip.name}
        </div>
      ) : null}
    </div>
  );
}
