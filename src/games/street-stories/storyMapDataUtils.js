import {
  colorForNeighborhood,
  nearestNeighborhoodFromPoint,
  normalizeLookupKey,
} from "./storyMapConstants";

function normalizeStreetName(value) {
  return String(value ?? "")
    .toUpperCase()
    .replace(/['".,]/g, "")
    .replace(/&/g, " AND ")
    .replace(/\//g, " ")
    .replace(/\bAVENUE\b/g, "AVE")
    .replace(/\bSTREET\b/g, "ST")
    .replace(/\bROAD\b/g, "RD")
    .replace(/\bDRIVE\b/g, "DR")
    .replace(/\bPLACE\b/g, "PL")
    .replace(/\bBOULEVARD\b/g, "BLVD")
    .replace(/\bPARKWAY\b/g, "PKWY")
    .replace(/\bSQUARE\b/g, "SQ")
    .replace(/\bTERRACE\b/g, "TER")
    .replace(/\bHIGHWAY\b/g, "HWY")
    .replace(/\bEXPRESSWAY\b/g, "EXPY")
    .replace(/\bSAINT\b/g, "ST")
    .replace(/\s+/g, " ")
    .trim();
}

function streetNameVariants(streetName, altNames = []) {
  const variants = new Set();
  const candidates = [streetName, ...altNames];
  for (const candidate of candidates) {
    if (!candidate) continue;
    const pieces = String(candidate)
      .split("/")
      .map((item) => item.trim())
      .filter(Boolean);
    for (const piece of pieces) {
      const normalized = normalizeStreetName(piece);
      if (!normalized) continue;
      variants.add(normalized);
      variants.add(normalized.replace(/\bTHE\b/g, "").replace(/\s+/g, " ").trim());
      variants.add(normalized.replace(/\bOF\b/g, "").replace(/\s+/g, " ").trim());
    }
  }
  return Array.from(variants).filter(Boolean);
}

function flattenCoordinates(geometry, target = []) {
  if (!geometry) return target;
  if (geometry.type === "Polygon") {
    const ring = geometry.coordinates?.[0];
    if (ring) target.push(ring);
    return target;
  }
  if (geometry.type === "MultiPolygon") {
    for (const polygon of geometry.coordinates ?? []) {
      const ring = polygon?.[0];
      if (ring) target.push(ring);
    }
    return target;
  }
  if (geometry.type === "LineString") {
    target.push(geometry.coordinates);
    return target;
  }
  if (geometry.type === "MultiLineString") {
    for (const segment of geometry.coordinates) target.push(segment);
    return target;
  }
  if (geometry.type === "GeometryCollection") {
    for (const child of geometry.geometries ?? []) flattenCoordinates(child, target);
    return target;
  }
  return target;
}

function coordinatesCentroidFromGeometry(geometry) {
  const lines = flattenCoordinates(geometry);
  let lngSum = 0;
  let latSum = 0;
  let count = 0;
  for (const line of lines) {
    for (const coordinate of line) {
      if (!Array.isArray(coordinate) || coordinate.length < 2) continue;
      const [lng, lat] = coordinate;
      if (Number.isFinite(lng) && Number.isFinite(lat)) {
        lngSum += lng;
        latSum += lat;
        count += 1;
      }
    }
  }
  if (!count) return null;
  return [lngSum / count, latSum / count];
}

export async function fetchNtaManhattanGeoJson() {
  const url =
    "https://data.cityofnewyork.us/resource/9nt8-h7nd.geojson?$where=boroname%3D%27Manhattan%27&$limit=300";
  const response = await fetch(url);
  if (!response.ok) throw new Error(`NTA fetch failed (${response.status})`);
  const payload = await response.json();
  const features = (payload.features ?? []).map((feature) => {
    const centroid = coordinatesCentroidFromGeometry(feature.geometry) ?? [-73.9855, 40.758];
    const neighborhood = nearestNeighborhoodFromPoint(centroid[0], centroid[1]);
    return {
      ...feature,
      properties: {
        ...feature.properties,
        storyNeighborhood: neighborhood,
        storyColor: colorForNeighborhood(neighborhood),
      },
    };
  });
  return { type: "FeatureCollection", features };
}

export async function fetchManhattanCenterlines() {
  const url =
    "https://data.cityofnewyork.us/resource/inkn-q76z.geojson?$select=the_geom%2Cstname_label%2Cfull_street_name%2Cstreet_name%2Cboroughcode&$where=boroughcode%3D%271%27&$limit=15000";
  const response = await fetch(url);
  if (!response.ok) throw new Error(`CSCL fetch failed (${response.status})`);
  return response.json();
}

function tokenScore(a, b) {
  if (!a || !b) return 0;
  const aTokens = new Set(a.split(" ").filter(Boolean));
  const bTokens = new Set(b.split(" ").filter(Boolean));
  if (!aTokens.size || !bTokens.size) return 0;
  let overlap = 0;
  for (const token of aTokens) {
    if (bTokens.has(token)) overlap += 1;
  }
  return overlap / Math.max(aTokens.size, bTokens.size);
}

export function matchStreetGroupsToCenterlines(streetGroups, centerlineGeoJson) {
  const features = centerlineGeoJson?.features ?? [];
  const index = new Map();

  for (const feature of features) {
    const props = feature.properties ?? {};
    const names = [props.stname_label, props.full_street_name, props.street_name];
    for (const name of names) {
      const normalized = normalizeStreetName(name);
      if (!normalized) continue;
      if (!index.has(normalized)) index.set(normalized, []);
      index.get(normalized).push(feature);
    }
  }

  const matched = [];
  const matchedStreetKeys = new Set();
  const streetCenter = new Map();

  for (const group of streetGroups) {
    const variants = streetNameVariants(group.streetName, group.altNames);
    let groupMatches = [];

    for (const variant of variants) {
      const exact = index.get(variant);
      if (exact?.length) groupMatches = groupMatches.concat(exact);
    }

    const deduped = Array.from(new Set(groupMatches));
    if (!deduped.length) continue;

    for (const feature of deduped) {
      const featureClone = {
        type: "Feature",
        geometry: feature.geometry,
        properties: {
          ...(feature.properties ?? {}),
          storyStreetKey: group.key,
          storyStreetName: group.streetName,
          storyNeighborhood: group.neighborhood,
          storyColor: group.mapColor,
        },
      };
      matched.push(featureClone);
    }

    const centroid = coordinatesCentroidFromGeometry(deduped[0].geometry);
    if (centroid) streetCenter.set(group.key, centroid);
    matchedStreetKeys.add(group.key);
  }

  return {
    matchedStreetKeys,
    streetCenter,
    featureCollection: { type: "FeatureCollection", features: matched },
  };
}

export function markerSpiral(index, center, spacing = 0.00135) {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const radius = spacing * Math.sqrt(index + 1);
  const theta = index * goldenAngle;
  return {
    lng: center.lng + radius * Math.cos(theta),
    lat: center.lat + radius * Math.sin(theta),
  };
}

export function searchStreetGroups(streetGroups, query) {
  const normalized = normalizeLookupKey(query);
  if (!normalized) return [];
  return streetGroups
    .filter((group) => {
      const name = normalizeLookupKey(group.streetName);
      const neighborhood = normalizeLookupKey(group.neighborhood);
      return name.includes(normalized) || neighborhood.includes(normalized);
    })
    .slice(0, 16);
}

