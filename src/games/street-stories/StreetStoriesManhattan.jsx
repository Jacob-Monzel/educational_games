import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Map, { Layer, Marker, Source } from "react-map-gl/mapbox";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import "./StreetStoriesManhattan.css";
import {
  MANHATTAN_VIEW,
  NYC_BOUNDS,
  UI_COLORS,
  colorForNeighborhood,
  neighborhoodCentroid,
} from "./storyMapConstants";
import {
  confidenceVisual,
  loadStreetStoryDataset,
  markerColorByConfidence,
} from "./streetStoriesData";
import {
  fetchManhattanCenterlines,
  fetchNtaManhattanGeoJson,
  markerSpiral,
  matchStreetGroupsToCenterlines,
  searchStreetGroups,
} from "./storyMapDataUtils";

const EMPTY_FC = { type: "FeatureCollection", features: [] };

const NTA_FILL_LAYER = {
  id: "nta-fill",
  type: "fill",
  paint: {
    "fill-color": ["coalesce", ["get", "storyColor"], "#D1D5DB"],
    "fill-opacity": 0.13,
  },
};

const NTA_OUTLINE_LAYER = {
  id: "nta-outline",
  type: "line",
  paint: {
    "line-color": "#d2cec3",
    "line-width": 1.1,
    "line-opacity": 0.5,
  },
};

const MATCHED_LINE_LAYER = {
  id: "matched-lines",
  type: "line",
  paint: {
    "line-color": ["coalesce", ["get", "storyColor"], UI_COLORS.roadMuted],
    "line-opacity": ["interpolate", ["linear"], ["zoom"], 11, 0.16, 14, 0.62],
    "line-width": ["interpolate", ["linear"], ["zoom"], 11, 1.2, 14, 2.8],
  },
};

const SELECTED_HALO_LAYER = {
  id: "selected-halo",
  type: "line",
  paint: {
    "line-color": "#fffaf1",
    "line-opacity": 0.96,
    "line-width": 8,
    "line-blur": 0.6,
  },
};

const SELECTED_LINE_LAYER = {
  id: "selected-line",
  type: "line",
  paint: {
    "line-color": ["coalesce", ["get", "storyColor"], "#6b7280"],
    "line-opacity": 1,
    "line-width": 4.2,
  },
};

function sourceInitials(sourceId) {
  return sourceId
    .split("-")
    .map((token) => token.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function dedupeBy(items, keyFn) {
  const seen = new Set();
  const result = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(item);
  }
  return result;
}

export default function StreetStoriesManhattan() {
  const mapRef = useRef(null);
  const touchStartRef = useRef(null);

  const mapToken = import.meta.env.VITE_MAPBOX_TOKEN || "";

  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth < 1024 : false
  );
  const [viewState, setViewState] = useState(MANHATTAN_VIEW);
  const [query, setQuery] = useState("");
  const [selectedNeighborhood, setSelectedNeighborhood] = useState(null);
  const [selectedStreetKey, setSelectedStreetKey] = useState(null);
  const [mobileSheetPinned, setMobileSheetPinned] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);

  const [dataset, setDataset] = useState({
    loadedSources: [],
    sourceEntries: [],
    streetGroups: [],
    stats: {
      totalSegments: 0,
      uniqueStreets: 0,
      neighborhoodsCovered: 0,
      sourcesLoaded: 0,
    },
  });
  const [datasetLoading, setDatasetLoading] = useState(true);

  const [ntaGeoJson, setNtaGeoJson] = useState(EMPTY_FC);
  const [ntaStatus, setNtaStatus] = useState("idle");
  const [centerlineStatus, setCenterlineStatus] = useState("idle");
  const [matchedCenterlineGeoJson, setMatchedCenterlineGeoJson] = useState(EMPTY_FC);
  const [matchedStreetKeys, setMatchedStreetKeys] = useState(() => new Set());
  const [streetCenters, setStreetCenters] = useState(() => new Map());

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    let active = true;
    setDatasetLoading(true);
    loadStreetStoryDataset()
      .then((next) => {
        if (!active) return;
        setDataset(next);
      })
      .finally(() => {
        if (active) setDatasetLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setNtaStatus("loading");
    fetchNtaManhattanGeoJson()
      .then((next) => {
        if (!active) return;
        setNtaGeoJson(next);
        setNtaStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setNtaGeoJson(EMPTY_FC);
        setNtaStatus("error");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!dataset.streetGroups.length) return;
    let active = true;
    setCenterlineStatus("loading");
    fetchManhattanCenterlines()
      .then((centerlineGeoJson) => {
        if (!active) return;
        const matchResult = matchStreetGroupsToCenterlines(
          dataset.streetGroups,
          centerlineGeoJson
        );
        setMatchedCenterlineGeoJson(matchResult.featureCollection);
        setMatchedStreetKeys(matchResult.matchedStreetKeys);
        setStreetCenters(matchResult.streetCenter);
        setCenterlineStatus("ready");
      })
      .catch(() => {
        if (!active) return;
        setMatchedCenterlineGeoJson(EMPTY_FC);
        setMatchedStreetKeys(new Set());
        setStreetCenters(new Map());
        setCenterlineStatus("error");
      });
    return () => {
      active = false;
    };
  }, [dataset.streetGroups]);

  const streetByKey = useMemo(
    () => new Map(dataset.streetGroups.map((group) => [group.key, group])),
    [dataset.streetGroups]
  );
  const selectedStreet = selectedStreetKey ? streetByKey.get(selectedStreetKey) ?? null : null;
  const effectiveNeighborhood = selectedStreet?.neighborhood ?? selectedNeighborhood;
  const zoomedIn = viewState.zoom >= 13;

  const unmatchedGroups = useMemo(
    () => dataset.streetGroups.filter((group) => !matchedStreetKeys.has(group.key)),
    [dataset.streetGroups, matchedStreetKeys]
  );

  const unmatchedClusters = useMemo(() => {
    const grouped = new Map();
    for (const street of unmatchedGroups) {
      if (!grouped.has(street.neighborhood)) {
        const centroid = neighborhoodCentroid(street.neighborhood);
        grouped.set(street.neighborhood, {
          neighborhood: street.neighborhood,
          centroid,
          count: 0,
          color: colorForNeighborhood(street.neighborhood),
        });
      }
      grouped.get(street.neighborhood).count += 1;
    }
    return Array.from(grouped.values());
  }, [unmatchedGroups]);

  const expandedMarkers = useMemo(() => {
    if (!zoomedIn || !effectiveNeighborhood) return [];
    const streets = unmatchedGroups.filter((group) => group.neighborhood === effectiveNeighborhood);
    const center = neighborhoodCentroid(effectiveNeighborhood);
    return streets.map((street, index) => ({
      street,
      ...markerSpiral(index, center),
    }));
  }, [effectiveNeighborhood, unmatchedGroups, zoomedIn]);

  const neighborhoodStreetList = useMemo(() => {
    if (!effectiveNeighborhood) return [];
    return dataset.streetGroups
      .filter((street) => street.neighborhood === effectiveNeighborhood)
      .sort((a, b) => a.streetName.localeCompare(b.streetName));
  }, [dataset.streetGroups, effectiveNeighborhood]);

  const searchResults = useMemo(
    () => searchStreetGroups(dataset.streetGroups, query),
    [dataset.streetGroups, query]
  );

  const selectedFilter = useMemo(() => {
    if (!selectedStreetKey) return ["==", ["get", "storyStreetKey"], "__none__"];
    return ["==", ["get", "storyStreetKey"], selectedStreetKey];
  }, [selectedStreetKey]);

  const mapFlyTo = useCallback((lng, lat, zoom = 14.2) => {
    if (!mapRef.current) return;
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom,
      duration: 1500,
      essential: true,
    });
  }, []);

  const chooseStreet = useCallback(
    (street, options = { fly: true }) => {
      if (!street) return;
      setSelectedStreetKey(street.key);
      setSelectedNeighborhood(street.neighborhood);
      if (isMobile) setMobileSheetPinned(true);
      if (!options.fly) return;

      const center = streetCenters.get(street.key) ?? [street.centroid.lng, street.centroid.lat];
      mapFlyTo(center[0], center[1], 14.3);
    },
    [isMobile, mapFlyTo, streetCenters]
  );

  const jumpToRandom = useCallback(() => {
    const candidates = dataset.streetGroups.filter((group) =>
      group.sourceEntries.some((entry) => !entry.isStub)
    );
    if (!candidates.length) return;
    const street = candidates[Math.floor(Math.random() * candidates.length)];
    chooseStreet(street);
  }, [chooseStreet, dataset.streetGroups]);

  const flyToNeighborhood = useCallback(
    (neighborhood, zoom = 13.25) => {
      const centroid = neighborhoodCentroid(neighborhood);
      mapFlyTo(centroid.lng, centroid.lat, zoom);
    },
    [mapFlyTo]
  );

  const onMapClick = useCallback(
    (event) => {
      const feature = event.features?.[0];
      if (!feature) {
        setSelectedStreetKey(null);
        return;
      }

      const layerId = feature.layer?.id;
      if (layerId === "matched-lines" || layerId === "selected-halo" || layerId === "selected-line") {
        const key = feature.properties?.storyStreetKey;
        if (key && streetByKey.has(key)) chooseStreet(streetByKey.get(key), { fly: false });
        return;
      }
      if (layerId === "nta-fill") {
        const neighborhood = feature.properties?.storyNeighborhood ?? feature.properties?.ntaname;
        if (neighborhood) {
          setSelectedNeighborhood(neighborhood);
          setSelectedStreetKey(null);
          if (isMobile) setMobileSheetPinned(true);
          flyToNeighborhood(neighborhood, 13.1);
        }
        return;
      }
      setSelectedStreetKey(null);
    },
    [chooseStreet, flyToNeighborhood, isMobile, streetByKey]
  );

  const clearSelections = useCallback(() => {
    setSelectedStreetKey(null);
    setSelectedNeighborhood(null);
  }, []);

  const expandedByState =
    mobileSheetPinned || Boolean(query) || Boolean(selectedStreetKey) || Boolean(selectedNeighborhood);
  const mobileSheetExpanded = !isMobile || expandedByState;

  const sheetTouchStart = useCallback((event) => {
    touchStartRef.current = event.touches[0].clientY;
  }, []);

  const sheetTouchMove = useCallback((event) => {
    if (touchStartRef.current == null) return;
    const delta = event.touches[0].clientY - touchStartRef.current;
    setDragOffset(Math.max(0, Math.min(160, delta)));
  }, []);

  const sheetTouchEnd = useCallback(() => {
    if (dragOffset > 90) {
      setMobileSheetPinned(false);
      setQuery("");
      clearSelections();
    }
    setDragOffset(0);
    touchStartRef.current = null;
  }, [clearSelections, dragOffset]);

  const renderPanelBody = () => {
    if (selectedStreet) {
      const confidence = confidenceVisual(selectedStreet.confidenceScore);
      return (
        <div>
          <div className="story-card-label">{selectedStreet.roadType}</div>
          <h3 className="story-card-title">{selectedStreet.streetName}</h3>
          {selectedStreet.bounds ? <div className="story-card-meta">{selectedStreet.bounds}</div> : null}
          <span
            className="confidence-pill"
            style={{ background: confidence.bg, color: confidence.text, borderColor: confidence.border }}
          >
            {confidence.label}
          </span>

          {selectedStreet.sourceEntries.map((entry) => (
            <section key={entry.sourceEntryId} className="story-source-section">
              <h4 className="story-source-title">{entry.sourceLabel}</h4>
              <p className="story-origin">{entry.origin || "Origin story unavailable in this source."}</p>
              {entry.isStub ? (
                <div className="story-muted-note">
                  Extracted text is incomplete for this source entry. Refer to the original citation/book
                  page for the full passage.
                </div>
              ) : null}

              {entry.altNames?.length ? (
                <div className="story-tags">
                  {entry.altNames.map((item) => (
                    <span className="story-tag" key={`${entry.sourceEntryId}-alt-${item}`}>
                      Alt: {item}
                    </span>
                  ))}
                </div>
              ) : null}

              {entry.formerNames?.length ? (
                <div className="story-tags">
                  {entry.formerNames.map((item) => (
                    <span className="story-tag" key={`${entry.sourceEntryId}-former-${item}`}>
                      Historic: {item}
                    </span>
                  ))}
                </div>
              ) : null}

              {entry.timeline?.length ? (
                <div className="story-tags">
                  {entry.timeline.map((item) => (
                    <span className="story-tag" key={`${entry.sourceEntryId}-time-${item}`}>
                      {item}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="citation-block">
                <div>{entry.sourceCitation.label}</div>
                {entry.sourceCitation.page ? <div>Page: {entry.sourceCitation.page}</div> : null}
                {entry.sourceCitation.url ? (
                  <div>
                    <a href={entry.sourceCitation.url} target="_blank" rel="noreferrer">
                      {entry.sourceCitation.url}
                    </a>
                  </div>
                ) : null}
                {entry.sourceCitation.references?.length ? (
                  <div>
                    {entry.sourceCitation.references.map((reference) => reference.label).join(" • ")}
                  </div>
                ) : null}
              </div>
            </section>
          ))}
        </div>
      );
    }

    if (effectiveNeighborhood) {
      return (
        <div>
          <div className="street-neighborhood-heading">
            <h3>{effectiveNeighborhood}</h3>
            <p>{neighborhoodStreetList.length} streets</p>
          </div>
          <ul className="street-list">
            {neighborhoodStreetList.map((street) => {
              const sourceBadges = dedupeBy(street.sourceEntries, (entry) => entry.sourceId);
              return (
                <li key={street.key}>
                  <button type="button" onClick={() => chooseStreet(street)}>
                    <div className="row">
                      <strong>{street.streetName}</strong>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: 999,
                          background: markerColorByConfidence(street.confidenceScore),
                        }}
                      />
                    </div>
                    <div className="row" style={{ marginTop: 6 }}>
                      <span className="road-pill">{street.roadType}</span>
                      <span className="source-badges">
                        {sourceBadges.map((source) => (
                          <span className="source-badge" key={`${street.key}-${source.sourceId}`}>
                            {sourceInitials(source.sourceId)}
                          </span>
                        ))}
                      </span>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      );
    }

    return (
      <div>
        <p className="street-panel-subtitle">
          A living editorial atlas of how Manhattan streets got their names, grouped across multiple
          historical sources.
        </p>
        <div className="street-stats-grid">
          <div className="street-stat-card">
            <div className="label">Total segments</div>
            <div className="value">{dataset.stats.totalSegments}</div>
          </div>
          <div className="street-stat-card">
            <div className="label">Unique streets</div>
            <div className="value">{dataset.stats.uniqueStreets}</div>
          </div>
          <div className="street-stat-card">
            <div className="label">Neighborhoods</div>
            <div className="value">{dataset.stats.neighborhoodsCovered}</div>
          </div>
          <div className="street-stat-card">
            <div className="label">Sources loaded</div>
            <div className="value">{dataset.stats.sourcesLoaded}</div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="street-stories-root">
      <div className="street-stories-layout">
        <div className="street-map-wrap">
          {mapToken ? (
            <Map
              ref={mapRef}
              mapLib={mapboxgl}
              mapboxAccessToken={mapToken}
              initialViewState={MANHATTAN_VIEW}
              mapStyle="mapbox://styles/mapbox/light-v11"
              attributionControl={false}
              maxBounds={NYC_BOUNDS}
              minZoom={10}
              maxZoom={17}
              interactiveLayerIds={["nta-fill", "matched-lines", "selected-halo", "selected-line"]}
              onMove={(event) => setViewState(event.viewState)}
              onClick={onMapClick}
              className="street-map"
            >
              <Source id="nta-source" type="geojson" data={ntaGeoJson}>
                <Layer {...NTA_FILL_LAYER} />
                <Layer {...NTA_OUTLINE_LAYER} />
              </Source>

              <Source id="matched-lines-source" type="geojson" data={matchedCenterlineGeoJson}>
                <Layer {...MATCHED_LINE_LAYER} />
                {selectedStreetKey ? <Layer {...SELECTED_HALO_LAYER} filter={selectedFilter} /> : null}
                {selectedStreetKey ? <Layer {...SELECTED_LINE_LAYER} filter={selectedFilter} /> : null}
              </Source>

              {!zoomedIn
                ? unmatchedClusters.map((cluster) => (
                    <Marker
                      key={cluster.neighborhood}
                      longitude={cluster.centroid.lng}
                      latitude={cluster.centroid.lat}
                      anchor="center"
                    >
                      <button
                        type="button"
                        className="street-marker-cluster"
                        onClick={() => {
                          setSelectedNeighborhood(cluster.neighborhood);
                          flyToNeighborhood(cluster.neighborhood, 13.2);
                          if (isMobile) setMobileSheetPinned(true);
                        }}
                        style={{ borderColor: `${cluster.color}99` }}
                        title={`${cluster.neighborhood}: ${cluster.count} unmatched`}
                      >
                        {cluster.count}
                      </button>
                    </Marker>
                  ))
                : null}

              {expandedMarkers.map((marker) => (
                <Marker
                  key={marker.street.key}
                  longitude={marker.lng}
                  latitude={marker.lat}
                  anchor="center"
                >
                  <button
                    type="button"
                    className="street-marker-dot"
                    style={{
                      background: markerColorByConfidence(marker.street.confidenceScore),
                      borderColor:
                        selectedStreetKey === marker.street.key ? "rgba(255,255,255,0.95)" : "rgba(44,44,44,0.25)",
                      transform: selectedStreetKey === marker.street.key ? "scale(1.25)" : "scale(1)",
                    }}
                    onClick={() => chooseStreet(marker.street)}
                    title={marker.street.streetName}
                  />
                </Marker>
              ))}
            </Map>
          ) : (
            <div
              style={{
                height: "100%",
                display: "grid",
                placeItems: "center",
                padding: 24,
                background: "#f3f0e8",
                color: "#4b5563",
              }}
            >
              <div style={{ maxWidth: 520, textAlign: "center" }}>
                <h3 style={{ marginBottom: 8, fontFamily: "Source Serif 4, serif" }}>
                  Mapbox token required
                </h3>
                <p style={{ margin: 0 }}>
                  Set <code>VITE_MAPBOX_TOKEN</code> to render the live Manhattan basemap and street
                  overlays.
                </p>
              </div>
            </div>
          )}

          <div className="map-floating-controls">
            <button type="button" onClick={() => mapRef.current?.zoomIn({ duration: 220 })}>
              +
            </button>
            <button type="button" onClick={() => mapRef.current?.zoomOut({ duration: 220 })}>
              -
            </button>
            <button
              type="button"
              onClick={() =>
                mapRef.current?.flyTo({
                  center: [MANHATTAN_VIEW.longitude, MANHATTAN_VIEW.latitude],
                  zoom: MANHATTAN_VIEW.zoom,
                  duration: 500,
                })
              }
            >
              NYC
            </button>
          </div>

          {(datasetLoading || ntaStatus === "loading" || centerlineStatus === "loading") && (
            <div
              style={{
                position: "absolute",
                left: 14,
                top: 14,
                zIndex: 6,
                fontSize: 12,
                background: "rgba(255,255,255,0.88)",
                border: "1px solid #ddd9cf",
                borderRadius: 8,
                padding: "7px 10px",
              }}
            >
              {datasetLoading
                ? "Loading stories..."
                : centerlineStatus === "loading"
                ? "Matching NYC centerlines..."
                : "Loading neighborhoods..."}
            </div>
          )}
        </div>

        <aside className="street-panel">
          <div className="street-panel-header">
            <a href="#/">{"<- Back to library"}</a>
            <h1 className="street-panel-title">Street Stories: Manhattan</h1>
            <p className="street-panel-subtitle">
              Explore the naming history of Manhattan streets with source-aware stories.
            </p>
            <div className="street-panel-tools">
              <input
                className="street-search"
                type="search"
                placeholder="Search streets and neighborhoods..."
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
              <button className="street-random" type="button" onClick={jumpToRandom}>
                Random segment
              </button>
            </div>
            {query ? (
              <div className="street-search-results">
                {searchResults.length ? (
                  searchResults.map((result) => (
                    <button
                      type="button"
                      key={`search-${result.key}`}
                      onClick={() => {
                        setQuery("");
                        chooseStreet(result);
                      }}
                    >
                      <strong>{result.streetName}</strong>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>{result.neighborhood}</div>
                    </button>
                  ))
                ) : (
                  <div style={{ padding: 12, color: "#6b7280", fontSize: 13 }}>No matches found.</div>
                )}
              </div>
            ) : null}
          </div>

          <div className="street-panel-body">
            {(selectedStreet || effectiveNeighborhood) && (
              <button
                type="button"
                onClick={clearSelections}
                style={{
                  marginBottom: 12,
                  border: "1px solid #d8d2c4",
                  background: "#fff",
                  borderRadius: 8,
                  padding: "6px 10px",
                  fontSize: 12,
                  color: "#555",
                  cursor: "pointer",
                }}
              >
                Back
              </button>
            )}
            {renderPanelBody()}
          </div>
        </aside>
      </div>

      {isMobile ? (
        <div
          className={`mobile-sheet ${mobileSheetExpanded ? "" : "collapsed"}`}
          style={mobileSheetExpanded ? { transform: `translateY(${dragOffset}px)` } : undefined}
        >
          <div
            className="mobile-sheet-header"
            onTouchStart={sheetTouchStart}
            onTouchMove={sheetTouchMove}
            onTouchEnd={sheetTouchEnd}
          >
            <div className="sheet-handle" />
            <h2 className="mobile-sheet-title">Street Stories: Manhattan</h2>
            <div className="street-panel-tools" style={{ marginTop: 10 }}>
              <input
                className="street-search"
                type="search"
                placeholder="Search streets..."
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  if (!mobileSheetExpanded) setMobileSheetPinned(true);
                }}
              />
              <button className="street-random" type="button" onClick={jumpToRandom}>
                Random
              </button>
            </div>
          </div>

          <div className="street-panel-body">
            {query ? (
              <div className="street-search-results" style={{ marginTop: 0 }}>
                {searchResults.length ? (
                  searchResults.map((result) => (
                    <button
                      type="button"
                      key={`mobile-search-${result.key}`}
                      onClick={() => {
                        setQuery("");
                        setMobileSheetPinned(true);
                        chooseStreet(result);
                      }}
                    >
                      <strong>{result.streetName}</strong>
                      <div style={{ color: "#6b7280", fontSize: 12 }}>{result.neighborhood}</div>
                    </button>
                  ))
                ) : (
                  <div style={{ padding: 12, color: "#6b7280", fontSize: 13 }}>No matches found.</div>
                )}
              </div>
            ) : null}
            {renderPanelBody()}
          </div>
        </div>
      ) : null}
    </div>
  );
}
