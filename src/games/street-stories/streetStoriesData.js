import { MANHATTAN_STREET_SEGMENTS } from "./manhattanData";
import {
  colorForNeighborhood,
  nearestNeighborhoodFromPoint,
  neighborhoodCentroid,
  normalizeLookupKey,
  regionForNeighborhood,
} from "./storyMapConstants";

const DEFAULT_SOURCE_ID = "curated-manhattan-atlas";
const DEFAULT_SOURCE_LABEL = "Curated Manhattan Atlas";

function numericConfidence(confidence) {
  if (typeof confidence === "number") return Math.max(0, Math.min(1, confidence));
  const value = normalizeLookupKey(confidence);
  if (!value) return 0.5;
  if (value.includes("high")) return 0.9;
  if (value.includes("medium")) return 0.65;
  if (value.includes("low")) return 0.35;
  const parsed = Number(confidence);
  if (!Number.isNaN(parsed)) return Math.max(0, Math.min(1, parsed));
  return 0.5;
}

function confidenceBand(score) {
  if (score >= 0.8) return "high";
  if (score >= 0.5) return "medium";
  return "low";
}

function uniqueStrings(values) {
  const result = [];
  const seen = new Set();
  for (const value of values ?? []) {
    if (!value) continue;
    const normalized = normalizeLookupKey(value);
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    result.push(value);
  }
  return result;
}

function deriveRoadType(name) {
  const text = String(name ?? "");
  const match = text.match(
    /\b(street|avenue|road|drive|place|square|parkway|boulevard|lane|terrace|way|bridge|promenade|ramp|expressway|highway|circle|plaza|court)\b/i
  );
  if (!match) return "Segment";
  return match[1]
    .split(" ")
    .map((token) => token.charAt(0).toUpperCase() + token.slice(1).toLowerCase())
    .join(" ");
}

function coordinatesCentroid(coordinates) {
  if (!Array.isArray(coordinates) || !coordinates.length) return null;
  let sumLng = 0;
  let sumLat = 0;
  let count = 0;
  for (const pair of coordinates) {
    if (!Array.isArray(pair) || pair.length < 2) continue;
    const [lng, lat] = pair;
    if (Number.isFinite(lng) && Number.isFinite(lat)) {
      sumLng += lng;
      sumLat += lat;
      count += 1;
    }
  }
  if (!count) return null;
  return { lng: sumLng / count, lat: sumLat / count };
}

function normalizeLegacyRecord(record, index) {
  const centroidFromCoords = coordinatesCentroid(record.coordinates);
  const inferredNeighborhood = centroidFromCoords
    ? nearestNeighborhoodFromPoint(centroidFromCoords.lng, centroidFromCoords.lat)
    : "Perimeter Routes";
  const neighborhood = record.neighborhood ?? inferredNeighborhood;
  const centroid = centroidFromCoords ?? neighborhoodCentroid(neighborhood);
  const score = numericConfidence(record.confidence);
  const sourceReferences = (record.sources ?? []).map((source) => ({
    label: source.label ?? DEFAULT_SOURCE_LABEL,
    url: source.url ?? null,
  }));

  return {
    sourceEntryId: `${DEFAULT_SOURCE_ID}:${record.id ?? index}`,
    sourceId: DEFAULT_SOURCE_ID,
    sourceLabel: DEFAULT_SOURCE_LABEL,
    sourceCitation: {
      label: DEFAULT_SOURCE_LABEL,
      references: sourceReferences,
    },
    recordId: record.id ?? `legacy-${index}`,
    streetName: record.currentName ?? "Unnamed Segment",
    neighborhood,
    region: regionForNeighborhood(neighborhood),
    mapColor: colorForNeighborhood(neighborhood),
    roadType: deriveRoadType(record.currentName),
    bounds: record.bounds ?? record.segmentLabel ?? "",
    segmentLabel: record.segmentLabel ?? "",
    corridor: record.corridor ?? "",
    origin: record.origin ?? "",
    altNames: uniqueStrings(record.altNames ?? []),
    formerNames: uniqueStrings(record.formerNames ?? []),
    timeline: uniqueStrings(record.timeline ?? []),
    confidenceScore: score,
    confidenceBand: confidenceBand(score),
    isStub: String(record.origin ?? "").startsWith("[Entry for") && score <= 0.2,
    centroid,
    coordinates: Array.isArray(record.coordinates) ? record.coordinates : [],
  };
}

function normalizeSourceRecord(rawRecord, source, index) {
  if (source.kind === "legacy") return normalizeLegacyRecord(rawRecord, index);

  const streetName =
    rawRecord.current_display_name ??
    rawRecord.currentName ??
    rawRecord.street_name ??
    rawRecord.name ??
    "Unnamed Segment";
  const neighborhood = rawRecord.neighborhood ?? rawRecord.neighborhood_name ?? "Perimeter Routes";
  const centroid = rawRecord.centroid
    ? { lng: rawRecord.centroid.lng ?? rawRecord.centroid.lon, lat: rawRecord.centroid.lat }
    : neighborhoodCentroid(neighborhood);

  const score = numericConfidence(rawRecord.confidence ?? rawRecord.confidence_score);
  const citation = rawRecord.citation ?? {};

  return {
    sourceEntryId: `${source.sourceId}:${rawRecord.id ?? index}`,
    sourceId: source.sourceId,
    sourceLabel: source.sourceLabel,
    sourceCitation: {
      label: citation.source_label ?? source.sourceLabel,
      page: citation.page ?? null,
      url: citation.url ?? null,
      references: uniqueStrings(citation.references ?? []).map((label) => ({ label, url: null })),
    },
    recordId: rawRecord.id ?? `${source.sourceId}-${index}`,
    streetName,
    neighborhood,
    region: regionForNeighborhood(neighborhood),
    mapColor: colorForNeighborhood(neighborhood),
    roadType: rawRecord.road_type ?? deriveRoadType(streetName),
    bounds:
      rawRecord.bounds ??
      [rawRecord.start_street, rawRecord.end_street].filter(Boolean).join(" to ") ??
      "",
    segmentLabel: rawRecord.segment_label ?? "",
    corridor: rawRecord.region ?? rawRecord.corridor ?? "",
    origin: rawRecord.origin_story ?? rawRecord.origin ?? "",
    altNames: uniqueStrings(rawRecord.alt_names ?? rawRecord.alternate_names ?? []),
    formerNames: uniqueStrings(rawRecord.former_names ?? rawRecord.historic_names ?? []),
    timeline: uniqueStrings(rawRecord.timeline ?? rawRecord.time_periods ?? []),
    confidenceScore: score,
    confidenceBand: confidenceBand(score),
    isStub: String(rawRecord.origin_story ?? rawRecord.origin ?? "").startsWith("[Entry for") && score <= 0.2,
    centroid,
    coordinates: Array.isArray(rawRecord.coordinates)
      ? rawRecord.coordinates
      : Array.isArray(rawRecord.geometry?.coordinates)
      ? rawRecord.geometry.coordinates
      : [],
  };
}

async function loadOptionalJsonSource(path) {
  const response = await fetch(path);
  if (!response.ok) throw new Error(`Source fetch failed (${response.status})`);
  return response.json();
}

export async function loadStreetStoryDataset() {
  const baseUrl = import.meta.env.BASE_URL || "/";
  const configuredSources = [
    {
      sourceId: DEFAULT_SOURCE_ID,
      sourceLabel: DEFAULT_SOURCE_LABEL,
      kind: "legacy",
      records: MANHATTAN_STREET_SEGMENTS,
    },
    {
      sourceId: "feirstein-2001",
      sourceLabel: "Feirstein, 2001",
      kind: "json",
      optionalPath: `${baseUrl}data/nyc_road_segments.json`,
    },
  ];

  const sourceEntries = [];
  const loadedSourceMeta = [];

  for (const source of configuredSources) {
    let records = source.records ?? [];
    if (source.kind === "json" && source.optionalPath) {
      try {
        const payload = await loadOptionalJsonSource(source.optionalPath);
        records = Array.isArray(payload) ? payload : payload.records ?? [];
      } catch {
        records = [];
      }
    }
    if (!records.length) continue;

    loadedSourceMeta.push({
      sourceId: source.sourceId,
      sourceLabel: source.sourceLabel,
      recordCount: records.length,
    });

    records.forEach((record, index) => {
      sourceEntries.push(normalizeSourceRecord(record, source, index));
    });
  }

  const grouped = new Map();
  for (const entry of sourceEntries) {
    const key = `${normalizeLookupKey(entry.streetName)}|${normalizeLookupKey(entry.neighborhood)}`;
    if (!grouped.has(key)) {
      grouped.set(key, {
        key,
        streetName: entry.streetName,
        neighborhood: entry.neighborhood,
        region: entry.region,
        roadType: entry.roadType,
        bounds: entry.bounds,
        centroid: entry.centroid ?? neighborhoodCentroid(entry.neighborhood),
        mapColor: entry.mapColor,
        confidenceScore: entry.confidenceScore,
        confidenceBand: entry.confidenceBand,
        sourceEntries: [],
        altNames: [],
        formerNames: [],
        timeline: [],
      });
    }

    const group = grouped.get(key);
    group.sourceEntries.push(entry);
    group.altNames = uniqueStrings([...group.altNames, ...(entry.altNames ?? [])]);
    group.formerNames = uniqueStrings([...group.formerNames, ...(entry.formerNames ?? [])]);
    group.timeline = uniqueStrings([...group.timeline, ...(entry.timeline ?? [])]);
    if (!group.bounds && entry.bounds) group.bounds = entry.bounds;
    if (entry.confidenceScore > group.confidenceScore) {
      group.confidenceScore = entry.confidenceScore;
      group.confidenceBand = entry.confidenceBand;
    }
  }

  const streetGroups = Array.from(grouped.values())
    .map((group) => {
      const sortedSources = [...group.sourceEntries].sort((a, b) => b.confidenceScore - a.confidenceScore);
      const preferred = sortedSources[0];
      return {
        ...group,
        roadType: group.roadType || preferred?.roadType || deriveRoadType(group.streetName),
        centroid: group.centroid || preferred?.centroid || neighborhoodCentroid(group.neighborhood),
        primaryOrigin: preferred?.origin ?? "",
        sourceEntries: sortedSources,
        coordinates: preferred?.coordinates ?? [],
      };
    })
    .sort((a, b) => a.streetName.localeCompare(b.streetName));

  const neighborhoods = new Set(streetGroups.map((group) => group.neighborhood));
  const sourceIds = new Set(sourceEntries.map((entry) => entry.sourceId));

  return {
    loadedSources: loadedSourceMeta,
    sourceEntries,
    streetGroups,
    stats: {
      totalSegments: sourceEntries.length,
      uniqueStreets: streetGroups.length,
      neighborhoodsCovered: neighborhoods.size,
      sourcesLoaded: sourceIds.size,
    },
  };
}

export function confidenceVisual(confidenceScore) {
  if (confidenceScore >= 0.8) {
    return { label: "High confidence", bg: "#DCEBDD", text: "#1F6A33", border: "#9DCEA8" };
  }
  if (confidenceScore >= 0.5) {
    return { label: "Medium confidence", bg: "#F6E9CF", text: "#9A6700", border: "#E2C690" };
  }
  return { label: "Low confidence", bg: "#F7DDDA", text: "#9E2F2A", border: "#E2A8A3" };
}

export function markerColorByConfidence(confidenceScore) {
  if (confidenceScore >= 0.8) return "#3F8F59";
  if (confidenceScore >= 0.5) return "#C4882A";
  return "#B44A43";
}

