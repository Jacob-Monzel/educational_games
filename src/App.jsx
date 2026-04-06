import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

const COUNTRIES = [
  { id: "004", cc: "af", n: "Afghanistan", c: "Kabul" },
  { id: "008", cc: "al", n: "Albania", c: "Tirana" },
  { id: "012", cc: "dz", n: "Algeria", c: "Algiers" },
  { id: "020", cc: "ad", n: "Andorra", c: "Andorra la Vella" },
  { id: "024", cc: "ao", n: "Angola", c: "Luanda" },
  { id: "028", cc: "ag", n: "Antigua and Barbuda", c: "St. John's" },
  { id: "032", cc: "ar", n: "Argentina", c: "Buenos Aires" },
  { id: "051", cc: "am", n: "Armenia", c: "Yerevan" },
  { id: "036", cc: "au", n: "Australia", c: "Canberra" },
  { id: "040", cc: "at", n: "Austria", c: "Vienna" },
  { id: "031", cc: "az", n: "Azerbaijan", c: "Baku" },
  { id: "044", cc: "bs", n: "Bahamas", c: "Nassau" },
  { id: "048", cc: "bh", n: "Bahrain", c: "Manama" },
  { id: "050", cc: "bd", n: "Bangladesh", c: "Dhaka" },
  { id: "052", cc: "bb", n: "Barbados", c: "Bridgetown" },
  { id: "112", cc: "by", n: "Belarus", c: "Minsk" },
  { id: "056", cc: "be", n: "Belgium", c: "Brussels" },
  { id: "084", cc: "bz", n: "Belize", c: "Belmopan" },
  { id: "204", cc: "bj", n: "Benin", c: "Porto-Novo" },
  { id: "064", cc: "bt", n: "Bhutan", c: "Thimphu" },
  { id: "068", cc: "bo", n: "Bolivia", c: "Sucre" },
  { id: "070", cc: "ba", n: "Bosnia and Herzegovina", c: "Sarajevo" },
  { id: "072", cc: "bw", n: "Botswana", c: "Gaborone" },
  { id: "076", cc: "br", n: "Brazil", c: "Brasilia" },
  { id: "096", cc: "bn", n: "Brunei", c: "Bandar Seri Begawan" },
  { id: "100", cc: "bg", n: "Bulgaria", c: "Sofia" },
  { id: "854", cc: "bf", n: "Burkina Faso", c: "Ouagadougou" },
  { id: "108", cc: "bi", n: "Burundi", c: "Gitega" },
  { id: "116", cc: "kh", n: "Cambodia", c: "Phnom Penh" },
  { id: "120", cc: "cm", n: "Cameroon", c: "Yaounde" },
  { id: "124", cc: "ca", n: "Canada", c: "Ottawa" },
  { id: "132", cc: "cv", n: "Cape Verde", c: "Praia" },
  { id: "140", cc: "cf", n: "Central African Republic", c: "Bangui" },
  { id: "148", cc: "td", n: "Chad", c: "N'Djamena" },
  { id: "152", cc: "cl", n: "Chile", c: "Santiago" },
  { id: "156", cc: "cn", n: "China", c: "Beijing" },
  { id: "170", cc: "co", n: "Colombia", c: "Bogota" },
  { id: "174", cc: "km", n: "Comoros", c: "Moroni" },
  { id: "178", cc: "cg", n: "Republic of the Congo", c: "Brazzaville" },
  { id: "180", cc: "cd", n: "DR Congo", c: "Kinshasa" },
  { id: "188", cc: "cr", n: "Costa Rica", c: "San Jose" },
  { id: "384", cc: "ci", n: "Cote d'Ivoire", c: "Yamoussoukro" },
  { id: "191", cc: "hr", n: "Croatia", c: "Zagreb" },
  { id: "192", cc: "cu", n: "Cuba", c: "Havana" },
  { id: "196", cc: "cy", n: "Cyprus", c: "Nicosia" },
  { id: "203", cc: "cz", n: "Czechia", c: "Prague" },
  { id: "208", cc: "dk", n: "Denmark", c: "Copenhagen" },
  { id: "262", cc: "dj", n: "Djibouti", c: "Djibouti" },
  { id: "212", cc: "dm", n: "Dominica", c: "Roseau" },
  { id: "214", cc: "do", n: "Dominican Republic", c: "Santo Domingo" },
  { id: "218", cc: "ec", n: "Ecuador", c: "Quito" },
  { id: "818", cc: "eg", n: "Egypt", c: "Cairo" },
  { id: "222", cc: "sv", n: "El Salvador", c: "San Salvador" },
  { id: "226", cc: "gq", n: "Equatorial Guinea", c: "Malabo" },
  { id: "232", cc: "er", n: "Eritrea", c: "Asmara" },
  { id: "233", cc: "ee", n: "Estonia", c: "Tallinn" },
  { id: "748", cc: "sz", n: "Eswatini", c: "Mbabane" },
  { id: "231", cc: "et", n: "Ethiopia", c: "Addis Ababa" },
  { id: "242", cc: "fj", n: "Fiji", c: "Suva" },
  { id: "246", cc: "fi", n: "Finland", c: "Helsinki" },
  { id: "250", cc: "fr", n: "France", c: "Paris" },
  { id: "266", cc: "ga", n: "Gabon", c: "Libreville" },
  { id: "270", cc: "gm", n: "Gambia", c: "Banjul" },
  { id: "268", cc: "ge", n: "Georgia", c: "Tbilisi" },
  { id: "276", cc: "de", n: "Germany", c: "Berlin" },
  { id: "288", cc: "gh", n: "Ghana", c: "Accra" },
  { id: "300", cc: "gr", n: "Greece", c: "Athens" },
  { id: "308", cc: "gd", n: "Grenada", c: "St. George's" },
  { id: "320", cc: "gt", n: "Guatemala", c: "Guatemala City" },
  { id: "324", cc: "gn", n: "Guinea", c: "Conakry" },
  { id: "624", cc: "gw", n: "Guinea-Bissau", c: "Bissau" },
  { id: "328", cc: "gy", n: "Guyana", c: "Georgetown" },
  { id: "332", cc: "ht", n: "Haiti", c: "Port-au-Prince" },
  { id: "340", cc: "hn", n: "Honduras", c: "Tegucigalpa" },
  { id: "348", cc: "hu", n: "Hungary", c: "Budapest" },
  { id: "352", cc: "is", n: "Iceland", c: "Reykjavik" },
  { id: "356", cc: "in", n: "India", c: "New Delhi" },
  { id: "360", cc: "id", n: "Indonesia", c: "Jakarta" },
  { id: "364", cc: "ir", n: "Iran", c: "Tehran" },
  { id: "368", cc: "iq", n: "Iraq", c: "Baghdad" },
  { id: "372", cc: "ie", n: "Ireland", c: "Dublin" },
  { id: "376", cc: "il", n: "Israel", c: "Jerusalem" },
  { id: "380", cc: "it", n: "Italy", c: "Rome" },
  { id: "388", cc: "jm", n: "Jamaica", c: "Kingston" },
  { id: "392", cc: "jp", n: "Japan", c: "Tokyo" },
  { id: "400", cc: "jo", n: "Jordan", c: "Amman" },
  { id: "398", cc: "kz", n: "Kazakhstan", c: "Astana" },
  { id: "404", cc: "ke", n: "Kenya", c: "Nairobi" },
  { id: "296", cc: "ki", n: "Kiribati", c: "Tarawa" },
  { id: "408", cc: "kp", n: "North Korea", c: "Pyongyang" },
  { id: "410", cc: "kr", n: "South Korea", c: "Seoul" },
  { id: "414", cc: "kw", n: "Kuwait", c: "Kuwait City" },
  { id: "417", cc: "kg", n: "Kyrgyzstan", c: "Bishkek" },
  { id: "418", cc: "la", n: "Laos", c: "Vientiane" },
  { id: "428", cc: "lv", n: "Latvia", c: "Riga" },
  { id: "422", cc: "lb", n: "Lebanon", c: "Beirut" },
  { id: "426", cc: "ls", n: "Lesotho", c: "Maseru" },
  { id: "430", cc: "lr", n: "Liberia", c: "Monrovia" },
  { id: "434", cc: "ly", n: "Libya", c: "Tripoli" },
  { id: "438", cc: "li", n: "Liechtenstein", c: "Vaduz" },
  { id: "440", cc: "lt", n: "Lithuania", c: "Vilnius" },
  { id: "442", cc: "lu", n: "Luxembourg", c: "Luxembourg" },
  { id: "450", cc: "mg", n: "Madagascar", c: "Antananarivo" },
  { id: "454", cc: "mw", n: "Malawi", c: "Lilongwe" },
  { id: "458", cc: "my", n: "Malaysia", c: "Kuala Lumpur" },
  { id: "462", cc: "mv", n: "Maldives", c: "Male" },
  { id: "466", cc: "ml", n: "Mali", c: "Bamako" },
  { id: "470", cc: "mt", n: "Malta", c: "Valletta" },
  { id: "584", cc: "mh", n: "Marshall Islands", c: "Majuro" },
  { id: "478", cc: "mr", n: "Mauritania", c: "Nouakchott" },
  { id: "480", cc: "mu", n: "Mauritius", c: "Port Louis" },
  { id: "484", cc: "mx", n: "Mexico", c: "Mexico City" },
  { id: "583", cc: "fm", n: "Micronesia", c: "Palikir" },
  { id: "498", cc: "md", n: "Moldova", c: "Chisinau" },
  { id: "492", cc: "mc", n: "Monaco", c: "Monaco" },
  { id: "496", cc: "mn", n: "Mongolia", c: "Ulaanbaatar" },
  { id: "499", cc: "me", n: "Montenegro", c: "Podgorica" },
  { id: "504", cc: "ma", n: "Morocco", c: "Rabat" },
  { id: "508", cc: "mz", n: "Mozambique", c: "Maputo" },
  { id: "104", cc: "mm", n: "Myanmar", c: "Naypyidaw" },
  { id: "516", cc: "na", n: "Namibia", c: "Windhoek" },
  { id: "520", cc: "nr", n: "Nauru", c: "Yaren" },
  { id: "524", cc: "np", n: "Nepal", c: "Kathmandu" },
  { id: "528", cc: "nl", n: "Netherlands", c: "Amsterdam" },
  { id: "554", cc: "nz", n: "New Zealand", c: "Wellington" },
  { id: "558", cc: "ni", n: "Nicaragua", c: "Managua" },
  { id: "562", cc: "ne", n: "Niger", c: "Niamey" },
  { id: "566", cc: "ng", n: "Nigeria", c: "Abuja" },
  { id: "807", cc: "mk", n: "North Macedonia", c: "Skopje" },
  { id: "578", cc: "no", n: "Norway", c: "Oslo" },
  { id: "512", cc: "om", n: "Oman", c: "Muscat" },
  { id: "586", cc: "pk", n: "Pakistan", c: "Islamabad" },
  { id: "585", cc: "pw", n: "Palau", c: "Ngerulmud" },
  { id: "275", cc: "ps", n: "Palestine", c: "Ramallah" },
  { id: "591", cc: "pa", n: "Panama", c: "Panama City" },
  { id: "598", cc: "pg", n: "Papua New Guinea", c: "Port Moresby" },
  { id: "600", cc: "py", n: "Paraguay", c: "Asuncion" },
  { id: "604", cc: "pe", n: "Peru", c: "Lima" },
  { id: "608", cc: "ph", n: "Philippines", c: "Manila" },
  { id: "616", cc: "pl", n: "Poland", c: "Warsaw" },
  { id: "620", cc: "pt", n: "Portugal", c: "Lisbon" },
  { id: "634", cc: "qa", n: "Qatar", c: "Doha" },
  { id: "642", cc: "ro", n: "Romania", c: "Bucharest" },
  { id: "643", cc: "ru", n: "Russia", c: "Moscow" },
  { id: "646", cc: "rw", n: "Rwanda", c: "Kigali" },
  { id: "659", cc: "kn", n: "Saint Kitts and Nevis", c: "Basseterre" },
  { id: "662", cc: "lc", n: "Saint Lucia", c: "Castries" },
  { id: "670", cc: "vc", n: "Saint Vincent", c: "Kingstown" },
  { id: "882", cc: "ws", n: "Samoa", c: "Apia" },
  { id: "674", cc: "sm", n: "San Marino", c: "San Marino" },
  { id: "678", cc: "st", n: "Sao Tome and Principe", c: "Sao Tome" },
  { id: "682", cc: "sa", n: "Saudi Arabia", c: "Riyadh" },
  { id: "686", cc: "sn", n: "Senegal", c: "Dakar" },
  { id: "688", cc: "rs", n: "Serbia", c: "Belgrade" },
  { id: "690", cc: "sc", n: "Seychelles", c: "Victoria" },
  { id: "694", cc: "sl", n: "Sierra Leone", c: "Freetown" },
  { id: "702", cc: "sg", n: "Singapore", c: "Singapore" },
  { id: "703", cc: "sk", n: "Slovakia", c: "Bratislava" },
  { id: "705", cc: "si", n: "Slovenia", c: "Ljubljana" },
  { id: "090", cc: "sb", n: "Solomon Islands", c: "Honiara" },
  { id: "706", cc: "so", n: "Somalia", c: "Mogadishu" },
  { id: "710", cc: "za", n: "South Africa", c: "Pretoria" },
  { id: "728", cc: "ss", n: "South Sudan", c: "Juba" },
  { id: "724", cc: "es", n: "Spain", c: "Madrid" },
  { id: "144", cc: "lk", n: "Sri Lanka", c: "Sri Jayawardenepura Kotte" },
  { id: "729", cc: "sd", n: "Sudan", c: "Khartoum" },
  { id: "740", cc: "sr", n: "Suriname", c: "Paramaribo" },
  { id: "752", cc: "se", n: "Sweden", c: "Stockholm" },
  { id: "756", cc: "ch", n: "Switzerland", c: "Bern" },
  { id: "760", cc: "sy", n: "Syria", c: "Damascus" },
  { id: "158", cc: "tw", n: "Taiwan", c: "Taipei" },
  { id: "762", cc: "tj", n: "Tajikistan", c: "Dushanbe" },
  { id: "834", cc: "tz", n: "Tanzania", c: "Dodoma" },
  { id: "764", cc: "th", n: "Thailand", c: "Bangkok" },
  { id: "626", cc: "tl", n: "Timor-Leste", c: "Dili" },
  { id: "768", cc: "tg", n: "Togo", c: "Lome" },
  { id: "776", cc: "to", n: "Tonga", c: "Nuku'alofa" },
  { id: "780", cc: "tt", n: "Trinidad and Tobago", c: "Port of Spain" },
  { id: "788", cc: "tn", n: "Tunisia", c: "Tunis" },
  { id: "792", cc: "tr", n: "Turkey", c: "Ankara" },
  { id: "795", cc: "tm", n: "Turkmenistan", c: "Ashgabat" },
  { id: "798", cc: "tv", n: "Tuvalu", c: "Funafuti" },
  { id: "800", cc: "ug", n: "Uganda", c: "Kampala" },
  { id: "804", cc: "ua", n: "Ukraine", c: "Kyiv" },
  { id: "784", cc: "ae", n: "United Arab Emirates", c: "Abu Dhabi" },
  { id: "826", cc: "gb", n: "United Kingdom", c: "London" },
  { id: "840", cc: "us", n: "United States", c: "Washington, D.C." },
  { id: "858", cc: "uy", n: "Uruguay", c: "Montevideo" },
  { id: "860", cc: "uz", n: "Uzbekistan", c: "Tashkent" },
  { id: "548", cc: "vu", n: "Vanuatu", c: "Port Vila" },
  { id: "862", cc: "ve", n: "Venezuela", c: "Caracas" },
  { id: "704", cc: "vn", n: "Vietnam", c: "Hanoi" },
  { id: "887", cc: "ye", n: "Yemen", c: "Sana'a" },
  { id: "894", cc: "zm", n: "Zambia", c: "Lusaka" },
  { id: "716", cc: "zw", n: "Zimbabwe", c: "Harare" },
  { id: "304", cc: "gl", n: "Greenland", c: "Nuuk" },
  { id: "900", cc: "xk", n: "Kosovo", c: "Pristina" },
];

const COUNTRY_MAP = {};
COUNTRIES.forEach((c) => {
  COUNTRY_MAP[c.id] = c;
});

// Minimal TopoJSON decoder
function topoFeature(topology, obj) {
  const arcsArr = topology.arcs;

  function arcToCoords(arcIdx) {
    const reverse = arcIdx < 0;
    const idx = reverse ? ~arcIdx : arcIdx;
    const arc = arcsArr[idx];
    const coords = [];
    let x = 0;
    let y = 0;
    for (const [dx, dy] of arc) {
      x += dx;
      y += dy;
      const lon = x * topology.transform.scale[0] + topology.transform.translate[0];
      const lat = y * topology.transform.scale[1] + topology.transform.translate[1];
      coords.push([lon, lat]);
    }
    if (reverse) coords.reverse();
    return coords;
  }

  function ringToCoords(ring) {
    let coords = [];
    for (const arcIdx of ring) {
      const c = arcToCoords(arcIdx);
      coords = coords.concat(coords.length ? c.slice(1) : c);
    }
    return coords;
  }

  function geoFromTopo(o) {
    if (o.type === "Polygon") {
      return { type: "Polygon", coordinates: o.arcs.map(ringToCoords) };
    }
    if (o.type === "MultiPolygon") {
      return {
        type: "MultiPolygon",
        coordinates: o.arcs.map((poly) => poly.map(ringToCoords)),
      };
    }
    return null;
  }

  const geoms = obj.geometries || [];
  return {
    type: "FeatureCollection",
    features: geoms
      .map((g) => ({
        type: "Feature",
        id: String(g.id).padStart(3, "0"),
        properties: g.properties || {},
        geometry: geoFromTopo(g),
      }))
      .filter((f) => f.geometry),
  };
}

const WORLD_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";
const FLAG_SOURCES = [
  (cc) => `https://flagcdn.com/w160/${cc}.png`,
  (cc) => `https://cdn.jsdelivr.net/npm/flag-icons/flags/4x3/${cc}.svg`,
  (cc) => `https://raw.githubusercontent.com/lipis/flag-icons/main/flags/4x3/${cc}.svg`,
  (cc) => `https://hatscripts.github.io/circle-flags/flags/${cc}.svg`,
];
const MOBILE_BREAKPOINT = 900;
const FULL_HEIGHT = "100dvh";

function countryCodeToEmoji(cc) {
  if (!cc || cc.length !== 2) return null;
  const upper = cc.toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper) || upper === "XK") return null;
  const base = 127397;
  return String.fromCodePoint(...upper.split("").map((char) => char.charCodeAt(0) + base));
}

export default function App() {
  const svgRef = useRef(null);
  const gRef = useRef(null);
  const projRef = useRef(null);
  const pathRef = useRef(null);
  const zoomRef = useRef(null);
  const featRef = useRef([]);
  const timeoutRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [features, setFeatures] = useState([]);
  const [question, setQuestion] = useState(null);
  const [mode, setMode] = useState("mixed");
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [answering, setAnswering] = useState(true);
  const [highlights, setHighlights] = useState({});
  const [tooltip, setTooltip] = useState(null);
  const [flagFailed, setFlagFailed] = useState(false);
  const [flagSourceIndex, setFlagSourceIndex] = useState(0);
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" ? window.innerWidth <= MOBILE_BREAKPOINT : false
  );

  useEffect(() => {
    fetch(WORLD_URL)
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((topo) => {
        const fc = topoFeature(topo, topo.objects.countries);
        const valid = fc.features.filter((f) => COUNTRY_MAP[f.id]);
        featRef.current = valid;
        setFeatures(valid);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  const pickQuestion = useCallback((feats, m) => {
    const pool = feats.length ? feats : featRef.current;
    if (!pool.length) return;
    const f = pool[Math.floor(Math.random() * pool.length)];
    const info = COUNTRY_MAP[f.id];
    let qm = m;
    if (m === "mixed") qm = Math.random() < 0.5 ? "flag" : "capital";
    setQuestion({ featureId: f.id, info, mode: qm });
    setAnswering(true);
    setHighlights({});
  }, []);

  useEffect(() => {
    if (features.length && !question) pickQuestion(features, mode);
  }, [features, question, mode, pickQuestion]);

  useEffect(() => {
    setFlagFailed(false);
    setFlagSourceIndex(0);
  }, [question?.featureId]);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BREAKPOINT);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  // Setup d3 projection + zoom
  useEffect(() => {
    if (!features.length || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const w = svgRef.current.parentElement.clientWidth;
    const h = svgRef.current.parentElement.clientHeight;
    svg.attr("width", w).attr("height", h);

    const proj = d3
      .geoNaturalEarth1()
      .fitSize([w - 20, h - 20], { type: "FeatureCollection", features });
    proj.translate([w / 2, h / 2]);
    projRef.current = proj;
    pathRef.current = d3.geoPath().projection(proj);

    const zoom = d3.zoom().scaleExtent([1, 12]).on("zoom", (e) => {
      // Read the current group node at event time so zoom still works
      // even if the <g> mounts after this effect's first run.
      const gNode = gRef.current;
      if (gNode) d3.select(gNode).attr("transform", e.transform);
    });
    svg.call(zoom);
    zoomRef.current = { zoom, svg };

    return () => svg.on(".zoom", null);
  }, [features]);

  const queueNext = useCallback(
    (delayMs) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        setFeedback(null);
        pickQuestion(features, mode);
      }, delayMs);
    },
    [features, mode, pickQuestion]
  );

  const handleClick = (fId) => {
    if (!answering || !question) return;
    setAnswering(false);
    const isCorrect = fId === question.featureId;
    const name = question.info.n;
    if (isCorrect) {
      setScore((s) => s + 1);
      setStreak((s) => s + 1);
      setHighlights({ [fId]: "correct" });
      setFeedback({ msg: `✓ ${name}`, type: "correct" });
    } else {
      setStreak(0);
      setHighlights({ [fId]: "wrong", [question.featureId]: "reveal" });
      setFeedback({ msg: `✗ It was ${name}`, type: "wrong" });
    }
    setTotal((t) => t + 1);
    queueNext(isCorrect ? 1200 : 2500);
  };

  const skip = () => {
    if (!answering || !question) return;
    setAnswering(false);
    setStreak(0);
    setTotal((t) => t + 1);
    setHighlights({ [question.featureId]: "reveal" });
    setFeedback({ msg: `Skipped - ${question.info.n}`, type: "wrong" });
    queueNext(2200);
  };

  const zoomIn = () => {
    if (!zoomRef.current) return;
    zoomRef.current.svg
      .transition()
      .duration(300)
      .call(zoomRef.current.zoom.scaleBy, 1.5);
  };

  const zoomOut = () => {
    if (!zoomRef.current) return;
    zoomRef.current.svg
      .transition()
      .duration(300)
      .call(zoomRef.current.zoom.scaleBy, 0.667);
  };

  const zoomReset = () => {
    if (!zoomRef.current) return;
    zoomRef.current.svg
      .transition()
      .duration(400)
      .call(zoomRef.current.zoom.transform, d3.zoomIdentity);
  };

  const changeMode = (m) => {
    setMode(m);
    pickQuestion(features, m);
  };

  const onFlagLoadError = () => {
    const nextIndex = flagSourceIndex + 1;
    if (nextIndex < FLAG_SOURCES.length) {
      setFlagSourceIndex(nextIndex);
    } else {
      setFlagFailed(true);
    }
  };

  if (error) {
    return (
      <div
        style={{
          background: "#0f1117",
          color: "#e2e4ea",
          height: FULL_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          fontFamily: "monospace",
          gap: 12,
        }}
      >
        <div style={{ fontSize: 18 }}>Failed to load map data</div>
        <div style={{ color: "#8b8fa3", fontSize: 13 }}>{error}</div>
        <div style={{ color: "#8b8fa3", fontSize: 12, marginTop: 8 }}>
          Try refreshing or check network
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          background: "#0f1117",
          color: "#e2e4ea",
          height: FULL_HEIGHT,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          fontFamily: "monospace",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid #2a2e3a",
            borderTopColor: "#a78bfa",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <div
          style={{
            fontSize: 13,
            color: "#8b8fa3",
            letterSpacing: 2,
            textTransform: "uppercase",
          }}
        >
          Loading atlas...
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const pathFn = pathRef.current;
  const flagUrl = question ? FLAG_SOURCES[flagSourceIndex](question.info.cc) : "";
  const flagEmoji = question ? countryCodeToEmoji(question.info.cc) : null;
  const showTooltip = !isMobile && Boolean(tooltip);

  return (
    <div
      style={{
        background: "#0f1117",
        color: "#e2e4ea",
        height: FULL_HEIGHT,
        display: "flex",
        flexDirection: "column",
        fontFamily: "'Courier New',monospace",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "10px 12px" : "12px 20px",
          borderBottom: "1px solid #2a2e3a",
          background: "#181b24",
          flexShrink: 0,
          gap: isMobile ? 10 : 0,
        }}
      >
        <div
          style={{
            fontSize: isMobile ? 20 : 24,
            fontFamily: "Georgia,serif",
            letterSpacing: -0.5,
            whiteSpace: "nowrap",
          }}
        >
          Geo<span style={{ color: "#a78bfa", fontStyle: "italic" }}>Quiz</span>
        </div>
        <div style={{ display: "flex", gap: isMobile ? 10 : 24 }}>
          {[
            ["Score", score, "#e2e4ea"],
            ["Streak", streak, "#fbbf24"],
            ["Played", total, "#e2e4ea"],
          ].map(([label, val, col]) => (
            <div key={label} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 20, fontWeight: 600, color: col, lineHeight: 1.2 }}>{val}</div>
              <div
                style={{
                  fontSize: isMobile ? 9 : 10,
                  color: "#8b8fa3",
                  textTransform: "uppercase",
                  letterSpacing: isMobile ? 1 : 1.5,
                }}
              >
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Prompt */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: isMobile ? 10 : 16,
          padding: isMobile ? "10px 10px" : "12px 20px",
          background: "#181b24",
          borderBottom: "1px solid #2a2e3a",
          minHeight: isMobile ? 58 : 64,
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <span
          style={{
            fontSize: isMobile ? 9 : 10,
            textTransform: "uppercase",
            letterSpacing: 2,
            color: "#0f1117",
            background: "#a78bfa",
            padding: "3px 10px",
            borderRadius: 3,
            fontWeight: 600,
          }}
        >
          {question?.mode || "flag"}
        </span>
        {question && question.mode === "flag" ? (
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {!flagFailed ? (
              <img
                src={flagUrl}
                alt={`${question.info.n} flag`}
                key={flagUrl}
                style={{
                  width: isMobile ? 46 : 56,
                  height: isMobile ? 31 : 38,
                  borderRadius: 4,
                  objectFit: "cover",
                  border: "1px solid #2a2e3a",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
                }}
                loading="eager"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={onFlagLoadError}
              />
            ) : flagEmoji ? (
              <div
                aria-label={`${question.info.n} flag emoji`}
                style={{
                  fontSize: isMobile ? 28 : 30,
                  lineHeight: 1,
                  minWidth: isMobile ? 46 : 56,
                  textAlign: "center",
                  border: "1px dashed #8b8fa3",
                  borderRadius: 6,
                  padding: "4px 8px",
                }}
              >
                {flagEmoji}
              </div>
            ) : (
              <div
                style={{
                  border: "1px dashed #8b8fa3",
                  color: "#8b8fa3",
                  fontSize: 10,
                  padding: "8px 10px",
                  borderRadius: 6,
                  textTransform: "uppercase",
                  letterSpacing: 1.1,
                }}
              >
                Flag unavailable
              </div>
            )}
            <span style={{ fontFamily: "Georgia,serif", fontSize: isMobile ? 16 : 18 }}>
              Which country?
            </span>
          </div>
        ) : question ? (
          <span style={{ fontFamily: "Georgia,serif", fontSize: isMobile ? 16 : 18 }}>
            Capital: <strong style={{ color: "#a78bfa" }}>{question.info.c}</strong>
          </span>
        ) : null}
        <span style={{ fontSize: isMobile ? 10 : 11, color: "#8b8fa3", marginLeft: 8 }}>
          {isMobile ? "tap the country" : "click the country"}
        </span>
      </div>

      {/* Map */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
          cursor: "grab",
          touchAction: "none",
        }}
      >
        <svg ref={svgRef} style={{ display: "block", background: "#0f1117", width: "100%", height: "100%" }}>
          {/* Graticule */}
          {pathFn && (
            <g ref={gRef}>
              <path d={pathFn(d3.geoGraticule()())} fill="none" stroke="#1e2230" strokeWidth={0.4} />
              {features.map((f) => {
                const hl = highlights[f.id];
                let fill = "#232836";
                let stroke = "#3d425490";
                let sw = 0.5;
                if (hl === "correct") {
                  fill = "#34d399";
                  stroke = "#22c55e";
                  sw = 1.5;
                } else if (hl === "wrong") {
                  fill = "#f87171";
                  stroke = "#ef4444";
                  sw = 1;
                } else if (hl === "reveal") {
                  fill = "#34d399";
                  stroke = "#22c55e";
                  sw = 2;
                }
                return (
                  <path
                    key={f.id}
                    d={pathFn(f)}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={sw}
                    style={{ cursor: "pointer", transition: "fill 0.15s", touchAction: "none" }}
                    onClick={() => handleClick(f.id)}
                    onPointerEnter={(e) => {
                      const info = COUNTRY_MAP[f.id];
                      if (!isMobile && info && !highlights[f.id]) {
                        e.currentTarget.style.fill = "#3a4058";
                      }
                      if (info) {
                        setTooltip({ name: info.n, x: e.clientX, y: e.clientY });
                      }
                    }}
                    onPointerMove={(e) => {
                      setTooltip((t) => (t ? { ...t, x: e.clientX, y: e.clientY } : null));
                    }}
                    onPointerLeave={(e) => {
                      if (!highlights[f.id]) e.currentTarget.style.fill = "";
                      setTooltip(null);
                    }}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Zoom controls */}
        <div
          style={{
            position: "absolute",
            bottom: 16,
            right: 16,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            zIndex: 50,
          }}
        >
          {[
            ["zoom-in", "+", zoomIn],
            ["zoom-out", "-", zoomOut],
            ["zoom-reset", "\u27f2", zoomReset],
          ].map(([k, label, fn]) => (
            <button
              key={k}
              onClick={fn}
              aria-label={k}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "#181b24",
                border: "1px solid #2a2e3a",
                borderRadius: 4,
                color: "#8b8fa3",
                fontSize: label === "\u27f2" ? 14 : isMobile ? 20 : 22,
                cursor: "pointer",
                width: isMobile ? 40 : 36,
                height: isMobile ? 40 : 36,
              }}
            >
              {label}
            </button>
          ))}
        </div>

      </div>

      {/* Tooltip — rendered outside the overflow:hidden map container */}
      {showTooltip && (
        <div
          style={{
            position: "fixed",
            left: tooltip.x + 14,
            top: tooltip.y - 10,
            padding: "4px 10px",
            background: "rgba(0,0,0,0.85)",
            color: "#e2e4ea",
            fontSize: 12,
            borderRadius: 4,
            pointerEvents: "none",
            zIndex: 200,
            border: "1px solid #2a2e3a",
            backdropFilter: "blur(4px)",
          }}
        >
          {tooltip.name}
        </div>
      )}

      {/* Feedback toast */}
      {feedback && (
        <div
          style={{
            position: "fixed",
            top: 140,
            left: "50%",
            transform: "translateX(-50%)",
            padding: "10px 24px",
            borderRadius: 6,
            fontSize: 14,
            fontWeight: 500,
            letterSpacing: 0.5,
            zIndex: 100,
            background: feedback.type === "correct" ? "#065f46" : "#7f1d1d",
            color: feedback.type === "correct" ? "#6ee7b7" : "#fca5a5",
            border: `1px solid ${feedback.type === "correct" ? "#34d39950" : "#f8717150"}`,
            animation: "fadeIn 0.3s ease",
          }}
        >
          {feedback.msg}
        </div>
      )}

      {/* Controls */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: isMobile ? "10px 10px" : "10px 20px",
          borderTop: "1px solid #2a2e3a",
          background: "#181b24",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        {["mixed", "flag", "capital"].map((m) => (
          <button
            key={m}
            onClick={() => changeMode(m)}
            style={{
              fontFamily: "monospace",
              fontSize: isMobile ? 12 : 11,
              letterSpacing: 1,
              textTransform: "uppercase",
              padding: isMobile ? "10px 16px" : "7px 16px",
              border: `1px solid ${mode === m ? "#a78bfa" : "#2a2e3a"}`,
              borderRadius: 4,
              background: mode === m ? "rgba(167,139,250,0.08)" : "transparent",
              color: mode === m ? "#a78bfa" : "#8b8fa3",
              cursor: "pointer",
              minHeight: isMobile ? 42 : "auto",
            }}
          >
            {m}
          </button>
        ))}
        <span style={{ color: "#2a2e3a", margin: "0 4px" }}>|</span>
        <button
          onClick={skip}
          style={{
            fontFamily: "monospace",
            fontSize: isMobile ? 12 : 11,
            letterSpacing: 1,
            textTransform: "uppercase",
            padding: isMobile ? "10px 16px" : "7px 16px",
            border: "1px solid #8b8fa3",
            borderRadius: 4,
            background: "transparent",
            color: "#8b8fa3",
            cursor: "pointer",
            minHeight: isMobile ? 42 : "auto",
          }}
        >
          Skip -&gt;
        </button>
      </div>

      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateX(-50%) translateY(-10px)}to{opacity:1;transform:translateX(-50%) translateY(0)}}`}</style>
    </div>
  );
}
