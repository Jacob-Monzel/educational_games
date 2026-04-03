export const NYC_BOUNDS = [
  [-74.3, 40.55],
  [-73.65, 40.95],
];

export const MANHATTAN_VIEW = {
  longitude: -73.9855,
  latitude: 40.758,
  zoom: 11.5,
};

export const NEIGHBORHOOD_CENTROIDS = {
  "Financial District": { lat: 40.7075, lng: -74.0113 },
  "Battery Park City": { lat: 40.7117, lng: -74.0165 },
  "Civic Center & South Street Seaport": { lat: 40.7115, lng: -74.003 },
  TriBeCa: { lat: 40.7163, lng: -74.0086 },
  Chinatown: { lat: 40.7158, lng: -73.997 },
  "Little Italy & NoLIta": { lat: 40.7191, lng: -73.9973 },
  "SoHo / NoCa": { lat: 40.7233, lng: -74.0 },
  "East Village": { lat: 40.7265, lng: -73.9815 },
  NoHo: { lat: 40.7264, lng: -73.9927 },
  "Greenwich Village": { lat: 40.7336, lng: -74.0027 },
  "West Village": { lat: 40.7358, lng: -74.0036 },
  "Gramercy / Union Square / Chelsea": { lat: 40.739, lng: -73.986 },
  "Kips Bay & Murray Hill": { lat: 40.748, lng: -73.978 },
  NoMad: { lat: 40.7454, lng: -73.988 },
  "Lower West Side / Fashion Center": { lat: 40.753, lng: -73.994 },
  "East Midtown": { lat: 40.755, lng: -73.971 },
  "Central Midtown & Entertainment District": { lat: 40.758, lng: -73.9855 },
  Clinton: { lat: 40.763, lng: -73.993 },
  "Lower East Side": { lat: 40.715, lng: -73.984 },
  "Upper East Side": { lat: 40.7736, lng: -73.9566 },
  "East / Spanish Harlem": { lat: 40.7957, lng: -73.9432 },
  "Lincoln Center Area": { lat: 40.7725, lng: -73.9835 },
  "Upper West Side & Manhattan Valley": { lat: 40.787, lng: -73.9754 },
  "Central Harlem": { lat: 40.8116, lng: -73.9465 },
  "Morningside & Hamilton Heights": { lat: 40.822, lng: -73.958 },
  "Washington Heights": { lat: 40.8417, lng: -73.9394 },
  Inwood: { lat: 40.8677, lng: -73.9212 },
  "Marble Hill": { lat: 40.8764, lng: -73.9106 },
  "Perimeter Routes": { lat: 40.7831, lng: -73.9712 },
};

export const REGION_COLORS = {
  "Lower Manhattan": "#88b6b0",
  "Mid-Lower Manhattan": "#d9c7a1",
  Villages: "#9bb39d",
  "Midtown South": "#caa4ab",
  Midtown: "#9ca9bf",
  "East Side": "#b9add2",
  "West Side": "#d1b37c",
  "Upper Manhattan": "#bf8f78",
  "Perimeter Routes": "#9ca3af",
};

const REGION_BY_NEIGHBORHOOD = {
  "Financial District": "Lower Manhattan",
  "Battery Park City": "Lower Manhattan",
  "Civic Center & South Street Seaport": "Lower Manhattan",
  TriBeCa: "Lower Manhattan",
  Chinatown: "Lower Manhattan",
  "Little Italy & NoLIta": "Lower Manhattan",
  "SoHo / NoCa": "Mid-Lower Manhattan",
  "Lower East Side": "Mid-Lower Manhattan",
  "East Village": "Villages",
  NoHo: "Villages",
  "Greenwich Village": "Villages",
  "West Village": "Villages",
  "Gramercy / Union Square / Chelsea": "Midtown South",
  "Kips Bay & Murray Hill": "Midtown South",
  NoMad: "Midtown South",
  "Lower West Side / Fashion Center": "Midtown South",
  "East Midtown": "Midtown",
  "Central Midtown & Entertainment District": "Midtown",
  Clinton: "Midtown",
  "Upper East Side": "East Side",
  "East / Spanish Harlem": "East Side",
  "Lincoln Center Area": "West Side",
  "Upper West Side & Manhattan Valley": "West Side",
  "Central Harlem": "Upper Manhattan",
  "Morningside & Hamilton Heights": "Upper Manhattan",
  "Washington Heights": "Upper Manhattan",
  Inwood: "Upper Manhattan",
  "Marble Hill": "Upper Manhattan",
  "Perimeter Routes": "Perimeter Routes",
};

export const UI_COLORS = {
  bg: "#FAFAF8",
  panel: "#F3F1EB",
  panelElevated: "#FFFFFF",
  textPrimary: "#2C2C2C",
  textMuted: "#6B7280",
  border: "#DDD9CF",
  roadMuted: "#A3A3A3",
  water: "#D9E2E8",
};

export function normalizeLookupKey(value) {
  return String(value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function neighborhoodCentroid(neighborhood) {
  return NEIGHBORHOOD_CENTROIDS[neighborhood] ?? NEIGHBORHOOD_CENTROIDS["Perimeter Routes"];
}

export function regionForNeighborhood(neighborhood) {
  return REGION_BY_NEIGHBORHOOD[neighborhood] ?? "Perimeter Routes";
}

export function colorForNeighborhood(neighborhood) {
  return REGION_COLORS[regionForNeighborhood(neighborhood)] ?? REGION_COLORS["Perimeter Routes"];
}

function distance2(a, b) {
  const dx = a.lng - b.lng;
  const dy = a.lat - b.lat;
  return dx * dx + dy * dy;
}

export function nearestNeighborhoodFromPoint(lng, lat) {
  const point = { lng, lat };
  let bestName = "Perimeter Routes";
  let bestScore = Number.POSITIVE_INFINITY;
  for (const [name, centroid] of Object.entries(NEIGHBORHOOD_CENTROIDS)) {
    const score = distance2(point, centroid);
    if (score < bestScore) {
      bestScore = score;
      bestName = name;
    }
  }
  return bestName;
}

