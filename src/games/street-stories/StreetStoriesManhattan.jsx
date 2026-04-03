import { useEffect, useMemo, useRef, useState } from "react";
import * as d3 from "d3";
import {
  CONFIDENCE_COLORS,
  MANHATTAN_ISLAND,
  MANHATTAN_STREET_SEGMENTS,
} from "./manhattanData";

function confidenceLabel(level) {
  if (!level) return "Unknown";
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export default function StreetStoriesManhattan() {
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const zoomRef = useRef(null);

  const [selectedId, setSelectedId] = useState(MANHATTAN_STREET_SEGMENTS[0].id);
  const [hoveredId, setHoveredId] = useState(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= 980 : false
  );

  const selectedSegment = useMemo(
    () =>
      MANHATTAN_STREET_SEGMENTS.find((segment) => segment.id === selectedId) ||
      MANHATTAN_STREET_SEGMENTS[0],
    [selectedId]
  );

  const featureCollection = useMemo(
    () => ({
      type: "FeatureCollection",
      features: [
        MANHATTAN_ISLAND,
        ...MANHATTAN_STREET_SEGMENTS.map((segment) => ({
          type: "Feature",
          id: segment.id,
          properties: segment,
          geometry: { type: "LineString", coordinates: segment.coordinates },
        })),
      ],
    }),
    []
  );

  const projection = useMemo(() => {
    if (!size.width || !size.height) return null;
    return d3
      .geoMercator()
      .fitExtent(
        [
          [24, 24],
          [size.width - 24, size.height - 24],
        ],
        featureCollection
      );
  }, [featureCollection, size.height, size.width]);

  const pathFn = useMemo(
    () => (projection ? d3.geoPath(projection) : null),
    [projection]
  );

  useEffect(() => {
    if (!containerRef.current) return undefined;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0].contentRect;
      setSize({ width: next.width, height: next.height });
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 980);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!svgRef.current || !gRef.current) return undefined;
    const svg = d3.select(svgRef.current);
    const zoom = d3
      .zoom()
      .scaleExtent([1, 16])
      .on("zoom", (event) => d3.select(gRef.current).attr("transform", event.transform));
    svg.call(zoom);
    zoomRef.current = { svg, zoom };
    return () => {
      svg.on(".zoom", null);
    };
  }, []);

  const zoomIn = () => {
    if (!zoomRef.current) return;
    zoomRef.current.svg.transition().duration(220).call(zoomRef.current.zoom.scaleBy, 1.4);
  };

  const zoomOut = () => {
    if (!zoomRef.current) return;
    zoomRef.current.svg.transition().duration(220).call(zoomRef.current.zoom.scaleBy, 0.72);
  };

  const zoomReset = () => {
    if (!zoomRef.current) return;
    zoomRef.current.svg
      .transition()
      .duration(280)
      .call(zoomRef.current.zoom.transform, d3.zoomIdentity);
  };

  const jumpToRandom = () => {
    const next =
      MANHATTAN_STREET_SEGMENTS[
        Math.floor(Math.random() * MANHATTAN_STREET_SEGMENTS.length)
      ];
    setSelectedId(next.id);
  };

  return (
    <div
      style={{
        minHeight: "100dvh",
        background:
          "radial-gradient(circle at top left, rgba(59,130,246,0.18), transparent 36%), #0b101a",
        color: "#e2e8f0",
        fontFamily: "'Courier New',monospace",
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          padding: "max(env(safe-area-inset-top), 16px) 16px max(env(safe-area-inset-bottom), 18px)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: isMobile ? "flex-start" : "center",
            flexDirection: isMobile ? "column" : "row",
            gap: 12,
            marginBottom: 14,
          }}
        >
          <div>
            <a
              href="#/"
              style={{
                color: "#93c5fd",
                textDecoration: "none",
                fontSize: 12,
                letterSpacing: 0.4,
                display: "inline-block",
                marginBottom: 8,
              }}
            >
              {"<- Back to library"}
            </a>
            <h1
              style={{
                margin: 0,
                fontFamily: "Georgia,serif",
                fontSize: "clamp(24px, 3.5vw, 38px)",
                lineHeight: 1.1,
                letterSpacing: -0.5,
              }}
            >
              Street Stories: Manhattan
            </h1>
            <p style={{ margin: "8px 0 0", color: "#94a3b8", fontSize: 13, maxWidth: 720 }}>
              Click a highlighted street segment to explore naming origins, old names, and
              citations. This is a curated MVP and designed to improve as new sources are added.
            </p>
          </div>
          <button
            onClick={jumpToRandom}
            style={{
              border: "1px solid #334155",
              background: "rgba(15, 23, 42, 0.7)",
              color: "#cbd5e1",
              borderRadius: 8,
              padding: "9px 12px",
              fontSize: 12,
              cursor: "pointer",
            }}
          >
            Random segment
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1.75fr 1fr",
            gap: 12,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              border: "1px solid #1f2937",
              borderRadius: 14,
              overflow: "hidden",
              background: "#0b1220",
              minHeight: isMobile ? 420 : 700,
              position: "relative",
            }}
          >
            <div
              ref={containerRef}
              style={{
                width: "100%",
                height: "100%",
                minHeight: isMobile ? 420 : 700,
                position: "relative",
              }}
            >
              <svg
                ref={svgRef}
                width={size.width || "100%"}
                height={size.height || "100%"}
                style={{ width: "100%", height: "100%", display: "block", touchAction: "none" }}
              >
                <rect width="100%" height="100%" fill="#0a1222" />
                {pathFn && (
                  <g ref={gRef}>
                    <path d={pathFn(MANHATTAN_ISLAND)} fill="#121f35" stroke="#1e293b" strokeWidth={1.2} />
                    {MANHATTAN_STREET_SEGMENTS.map((segment) => {
                      const isSelected = selectedId === segment.id;
                      const isHovered = hoveredId === segment.id;
                      const color = isSelected ? "#60a5fa" : isHovered ? "#93c5fd" : "#475569";
                      return (
                        <path
                          key={segment.id}
                          d={pathFn({
                            type: "Feature",
                            geometry: { type: "LineString", coordinates: segment.coordinates },
                          })}
                          fill="none"
                          stroke={color}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={isSelected ? 4.6 : isHovered ? 3.4 : 2.1}
                          style={{ cursor: "pointer", transition: "all 140ms ease" }}
                          onMouseEnter={() => setHoveredId(segment.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          onClick={() => setSelectedId(segment.id)}
                        />
                      );
                    })}
                  </g>
                )}
              </svg>
            </div>

            <div
              style={{
                position: "absolute",
                right: 12,
                bottom: 12,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {[
                { id: "in", label: "+", action: zoomIn },
                { id: "out", label: "-", action: zoomOut },
                { id: "reset", label: "R", action: zoomReset },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={item.action}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 7,
                    border: "1px solid #334155",
                    background: "rgba(15, 23, 42, 0.85)",
                    color: "#cbd5e1",
                    fontSize: item.id === "reset" ? 12 : 21,
                    cursor: "pointer",
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <aside
            style={{
              border: "1px solid #1f2937",
              borderRadius: 14,
              background: "linear-gradient(180deg, rgba(15,23,42,0.95), rgba(11,18,32,0.95))",
              padding: 14,
            }}
          >
            <div
              style={{
                display: "inline-block",
                borderRadius: 999,
                border: "1px solid #334155",
                color: "#94a3b8",
                fontSize: 10,
                textTransform: "uppercase",
                letterSpacing: 1.2,
                padding: "3px 8px",
                marginBottom: 10,
              }}
            >
              {selectedSegment.corridor}
            </div>

            <h2 style={{ margin: "0 0 2px", fontFamily: "Georgia,serif", fontSize: 28 }}>
              {selectedSegment.currentName}
            </h2>
            <div style={{ color: "#93c5fd", fontSize: 12, marginBottom: 8 }}>
              {selectedSegment.segmentLabel}
            </div>
            <div style={{ color: "#94a3b8", fontSize: 12, marginBottom: 10 }}>
              {selectedSegment.bounds}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                marginBottom: 12,
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  border: `1px solid ${CONFIDENCE_COLORS[selectedSegment.confidence] ?? "#64748b"}66`,
                  color: CONFIDENCE_COLORS[selectedSegment.confidence] ?? "#cbd5e1",
                  borderRadius: 999,
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 1.1,
                  padding: "3px 8px",
                }}
              >
                Confidence: {confidenceLabel(selectedSegment.confidence)}
              </span>
            </div>

            <section style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 1.3,
                  color: "#64748b",
                  marginBottom: 6,
                }}
              >
                Name origin
              </div>
              <p style={{ margin: 0, color: "#cbd5e1", fontSize: 13, lineHeight: 1.58 }}>
                {selectedSegment.origin}
              </p>
            </section>

            {!!selectedSegment.altNames.length && (
              <section style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 1.3,
                    color: "#64748b",
                    marginBottom: 6,
                  }}
                >
                  Also known as
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1", fontSize: 12.5, lineHeight: 1.5 }}>
                  {selectedSegment.altNames.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </section>
            )}

            {!!selectedSegment.formerNames.length && (
              <section style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 10,
                    textTransform: "uppercase",
                    letterSpacing: 1.3,
                    color: "#64748b",
                    marginBottom: 6,
                  }}
                >
                  Former / historical names
                </div>
                <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1", fontSize: 12.5, lineHeight: 1.5 }}>
                  {selectedSegment.formerNames.map((name) => (
                    <li key={name}>{name}</li>
                  ))}
                </ul>
              </section>
            )}

            <section style={{ marginBottom: 14 }}>
              <div
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 1.3,
                  color: "#64748b",
                  marginBottom: 6,
                }}
              >
                Timeline
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#cbd5e1", fontSize: 12.5, lineHeight: 1.5 }}>
                {selectedSegment.timeline.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>

            <section>
              <div
                style={{
                  fontSize: 10,
                  textTransform: "uppercase",
                  letterSpacing: 1.3,
                  color: "#64748b",
                  marginBottom: 6,
                }}
              >
                Sources
              </div>
              <ul style={{ margin: 0, paddingLeft: 18, color: "#93c5fd", fontSize: 12.5, lineHeight: 1.6 }}>
                {selectedSegment.sources.map((source) => (
                  <li key={`${source.label}-${source.url}`}>
                    <a
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#93c5fd", textDecoration: "none" }}
                    >
                      {source.label}
                    </a>
                  </li>
                ))}
              </ul>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
