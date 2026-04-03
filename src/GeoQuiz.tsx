import { useState, useEffect, useRef, useCallback } from "react";
import * as d3 from "d3";

interface Country {
  id: string;
  cc: string;
  n: string;
  c: string;
}

interface Question {
  featureId: string;
  info: Country;
  mode: "flag" | "capital";
}

interface Feedback {
  msg: string;
  type: "correct" | "wrong";
}

interface Tooltip {
  name: string;
  x: number;
  y: number;
}

const COUNTRIES: Country[] = [
  {id:'004',cc:'af',n:'Afghanistan',c:'Kabul'},{id:'008',cc:'al',n:'Albania',c:'Tirana'},
  {id:'012',cc:'dz',n:'Algeria',c:'Algiers'},{id:'020',cc:'ad',n:'Andorra',c:'Andorra la Vella'},
  {id:'024',cc:'ao',n:'Angola',c:'Luanda'},{id:'028',cc:'ag',n:'Antigua and Barbuda',c:"St. John's"},
  {id:'032',cc:'ar',n:'Argentina',c:'Buenos Aires'},{id:'051',cc:'am',n:'Armenia',c:'Yerevan'},
  {id:'036',cc:'au',n:'Australia',c:'Canberra'},{id:'040',cc:'at',n:'Austria',c:'Vienna'},
  {id:'031',cc:'az',n:'Azerbaijan',c:'Baku'},{id:'044',cc:'bs',n:'Bahamas',c:'Nassau'},
  {id:'048',cc:'bh',n:'Bahrain',c:'Manama'},{id:'050',cc:'bd',n:'Bangladesh',c:'Dhaka'},
  {id:'052',cc:'bb',n:'Barbados',c:'Bridgetown'},{id:'112',cc:'by',n:'Belarus',c:'Minsk'},
  {id:'056',cc:'be',n:'Belgium',c:'Brussels'},{id:'084',cc:'bz',n:'Belize',c:'Belmopan'},
  {id:'204',cc:'bj',n:'Benin',c:'Porto-Novo'},{id:'064',cc:'bt',n:'Bhutan',c:'Thimphu'},
  {id:'068',cc:'bo',n:'Bolivia',c:'Sucre'},{id:'070',cc:'ba',n:'Bosnia and Herzegovina',c:'Sarajevo'},
  {id:'072',cc:'bw',n:'Botswana',c:'Gaborone'},{id:'076',cc:'br',n:'Brazil',c:'Brasília'},
  {id:'096',cc:'bn',n:'Brunei',c:'Bandar Seri Begawan'},{id:'100',cc:'bg',n:'Bulgaria',c:'Sofia'},
  {id:'854',cc:'bf',n:'Burkina Faso',c:'Ouagadougou'},{id:'108',cc:'bi',n:'Burundi',c:'Gitega'},
  {id:'116',cc:'kh',n:'Cambodia',c:'Phnom Penh'},{id:'120',cc:'cm',n:'Cameroon',c:'Yaoundé'},
  {id:'124',cc:'ca',n:'Canada',c:'Ottawa'},{id:'132',cc:'cv',n:'Cape Verde',c:'Praia'},
  {id:'140',cc:'cf',n:'Central African Republic',c:'Bangui'},{id:'148',cc:'td',n:'Chad',c:"N'Djamena"},
  {id:'152',cc:'cl',n:'Chile',c:'Santiago'},{id:'156',cc:'cn',n:'China',c:'Beijing'},
  {id:'170',cc:'co',n:'Colombia',c:'Bogotá'},{id:'174',cc:'km',n:'Comoros',c:'Moroni'},
  {id:'178',cc:'cg',n:'Republic of the Congo',c:'Brazzaville'},{id:'180',cc:'cd',n:'DR Congo',c:'Kinshasa'},
  {id:'188',cc:'cr',n:'Costa Rica',c:'San José'},{id:'384',cc:'ci',n:"Côte d'Ivoire",c:'Yamoussoukro'},
  {id:'191',cc:'hr',n:'Croatia',c:'Zagreb'},{id:'192',cc:'cu',n:'Cuba',c:'Havana'},
  {id:'196',cc:'cy',n:'Cyprus',c:'Nicosia'},{id:'203',cc:'cz',n:'Czechia',c:'Prague'},
  {id:'208',cc:'dk',n:'Denmark',c:'Copenhagen'},{id:'262',cc:'dj',n:'Djibouti',c:'Djibouti'},
  {id:'212',cc:'dm',n:'Dominica',c:'Roseau'},{id:'214',cc:'do',n:'Dominican Republic',c:'Santo Domingo'},
  {id:'218',cc:'ec',n:'Ecuador',c:'Quito'},{id:'818',cc:'eg',n:'Egypt',c:'Cairo'},
  {id:'222',cc:'sv',n:'El Salvador',c:'San Salvador'},{id:'226',cc:'gq',n:'Equatorial Guinea',c:'Malabo'},
  {id:'232',cc:'er',n:'Eritrea',c:'Asmara'},{id:'233',cc:'ee',n:'Estonia',c:'Tallinn'},
  {id:'748',cc:'sz',n:'Eswatini',c:'Mbabane'},{id:'231',cc:'et',n:'Ethiopia',c:'Addis Ababa'},
  {id:'242',cc:'fj',n:'Fiji',c:'Suva'},{id:'246',cc:'fi',n:'Finland',c:'Helsinki'},
  {id:'250',cc:'fr',n:'France',c:'Paris'},{id:'266',cc:'ga',n:'Gabon',c:'Libreville'},
  {id:'270',cc:'gm',n:'Gambia',c:'Banjul'},{id:'268',cc:'ge',n:'Georgia',c:'Tbilisi'},
  {id:'276',cc:'de',n:'Germany',c:'Berlin'},{id:'288',cc:'gh',n:'Ghana',c:'Accra'},
  {id:'300',cc:'gr',n:'Greece',c:'Athens'},{id:'308',cc:'gd',n:'Grenada',c:"St. George's"},
  {id:'320',cc:'gt',n:'Guatemala',c:'Guatemala City'},{id:'324',cc:'gn',n:'Guinea',c:'Conakry'},
  {id:'624',cc:'gw',n:'Guinea-Bissau',c:'Bissau'},{id:'328',cc:'gy',n:'Guyana',c:'Georgetown'},
  {id:'332',cc:'ht',n:'Haiti',c:'Port-au-Prince'},{id:'340',cc:'hn',n:'Honduras',c:'Tegucigalpa'},
  {id:'348',cc:'hu',n:'Hungary',c:'Budapest'},{id:'352',cc:'is',n:'Iceland',c:'Reykjavik'},
  {id:'356',cc:'in',n:'India',c:'New Delhi'},{id:'360',cc:'id',n:'Indonesia',c:'Jakarta'},
  {id:'364',cc:'ir',n:'Iran',c:'Tehran'},{id:'368',cc:'iq',n:'Iraq',c:'Baghdad'},
  {id:'372',cc:'ie',n:'Ireland',c:'Dublin'},{id:'376',cc:'il',n:'Israel',c:'Jerusalem'},
  {id:'380',cc:'it',n:'Italy',c:'Rome'},{id:'388',cc:'jm',n:'Jamaica',c:'Kingston'},
  {id:'392',cc:'jp',n:'Japan',c:'Tokyo'},{id:'400',cc:'jo',n:'Jordan',c:'Amman'},
  {id:'398',cc:'kz',n:'Kazakhstan',c:'Astana'},{id:'404',cc:'ke',n:'Kenya',c:'Nairobi'},
  {id:'296',cc:'ki',n:'Kiribati',c:'Tarawa'},{id:'408',cc:'kp',n:'North Korea',c:'Pyongyang'},
  {id:'410',cc:'kr',n:'South Korea',c:'Seoul'},{id:'414',cc:'kw',n:'Kuwait',c:'Kuwait City'},
  {id:'417',cc:'kg',n:'Kyrgyzstan',c:'Bishkek'},{id:'418',cc:'la',n:'Laos',c:'Vientiane'},
  {id:'428',cc:'lv',n:'Latvia',c:'Riga'},{id:'422',cc:'lb',n:'Lebanon',c:'Beirut'},
  {id:'426',cc:'ls',n:'Lesotho',c:'Maseru'},{id:'430',cc:'lr',n:'Liberia',c:'Monrovia'},
  {id:'434',cc:'ly',n:'Libya',c:'Tripoli'},{id:'438',cc:'li',n:'Liechtenstein',c:'Vaduz'},
  {id:'440',cc:'lt',n:'Lithuania',c:'Vilnius'},{id:'442',cc:'lu',n:'Luxembourg',c:'Luxembourg'},
  {id:'450',cc:'mg',n:'Madagascar',c:'Antananarivo'},{id:'454',cc:'mw',n:'Malawi',c:'Lilongwe'},
  {id:'458',cc:'my',n:'Malaysia',c:'Kuala Lumpur'},{id:'462',cc:'mv',n:'Maldives',c:'Malé'},
  {id:'466',cc:'ml',n:'Mali',c:'Bamako'},{id:'470',cc:'mt',n:'Malta',c:'Valletta'},
  {id:'584',cc:'mh',n:'Marshall Islands',c:'Majuro'},{id:'478',cc:'mr',n:'Mauritania',c:'Nouakchott'},
  {id:'480',cc:'mu',n:'Mauritius',c:'Port Louis'},{id:'484',cc:'mx',n:'Mexico',c:'Mexico City'},
  {id:'583',cc:'fm',n:'Micronesia',c:'Palikir'},{id:'498',cc:'md',n:'Moldova',c:'Chișinău'},
  {id:'492',cc:'mc',n:'Monaco',c:'Monaco'},{id:'496',cc:'mn',n:'Mongolia',c:'Ulaanbaatar'},
  {id:'499',cc:'me',n:'Montenegro',c:'Podgorica'},{id:'504',cc:'ma',n:'Morocco',c:'Rabat'},
  {id:'508',cc:'mz',n:'Mozambique',c:'Maputo'},{id:'104',cc:'mm',n:'Myanmar',c:'Naypyidaw'},
  {id:'516',cc:'na',n:'Namibia',c:'Windhoek'},{id:'520',cc:'nr',n:'Nauru',c:'Yaren'},
  {id:'524',cc:'np',n:'Nepal',c:'Kathmandu'},{id:'528',cc:'nl',n:'Netherlands',c:'Amsterdam'},
  {id:'554',cc:'nz',n:'New Zealand',c:'Wellington'},{id:'558',cc:'ni',n:'Nicaragua',c:'Managua'},
  {id:'562',cc:'ne',n:'Niger',c:'Niamey'},{id:'566',cc:'ng',n:'Nigeria',c:'Abuja'},
  {id:'807',cc:'mk',n:'North Macedonia',c:'Skopje'},{id:'578',cc:'no',n:'Norway',c:'Oslo'},
  {id:'512',cc:'om',n:'Oman',c:'Muscat'},{id:'586',cc:'pk',n:'Pakistan',c:'Islamabad'},
  {id:'585',cc:'pw',n:'Palau',c:'Ngerulmud'},{id:'275',cc:'ps',n:'Palestine',c:'Ramallah'},
  {id:'591',cc:'pa',n:'Panama',c:'Panama City'},{id:'598',cc:'pg',n:'Papua New Guinea',c:'Port Moresby'},
  {id:'600',cc:'py',n:'Paraguay',c:'Asunción'},{id:'604',cc:'pe',n:'Peru',c:'Lima'},
  {id:'608',cc:'ph',n:'Philippines',c:'Manila'},{id:'616',cc:'pl',n:'Poland',c:'Warsaw'},
  {id:'620',cc:'pt',n:'Portugal',c:'Lisbon'},{id:'634',cc:'qa',n:'Qatar',c:'Doha'},
  {id:'642',cc:'ro',n:'Romania',c:'Bucharest'},{id:'643',cc:'ru',n:'Russia',c:'Moscow'},
  {id:'646',cc:'rw',n:'Rwanda',c:'Kigali'},{id:'659',cc:'kn',n:'Saint Kitts and Nevis',c:'Basseterre'},
  {id:'662',cc:'lc',n:'Saint Lucia',c:'Castries'},{id:'670',cc:'vc',n:'Saint Vincent',c:'Kingstown'},
  {id:'882',cc:'ws',n:'Samoa',c:'Apia'},{id:'674',cc:'sm',n:'San Marino',c:'San Marino'},
  {id:'678',cc:'st',n:'São Tomé and Príncipe',c:'São Tomé'},
  {id:'682',cc:'sa',n:'Saudi Arabia',c:'Riyadh'},{id:'686',cc:'sn',n:'Senegal',c:'Dakar'},
  {id:'688',cc:'rs',n:'Serbia',c:'Belgrade'},{id:'690',cc:'sc',n:'Seychelles',c:'Victoria'},
  {id:'694',cc:'sl',n:'Sierra Leone',c:'Freetown'},{id:'702',cc:'sg',n:'Singapore',c:'Singapore'},
  {id:'703',cc:'sk',n:'Slovakia',c:'Bratislava'},{id:'705',cc:'si',n:'Slovenia',c:'Ljubljana'},
  {id:'090',cc:'sb',n:'Solomon Islands',c:'Honiara'},{id:'706',cc:'so',n:'Somalia',c:'Mogadishu'},
  {id:'710',cc:'za',n:'South Africa',c:'Pretoria'},{id:'728',cc:'ss',n:'South Sudan',c:'Juba'},
  {id:'724',cc:'es',n:'Spain',c:'Madrid'},{id:'144',cc:'lk',n:'Sri Lanka',c:'Sri Jayawardenepura Kotte'},
  {id:'729',cc:'sd',n:'Sudan',c:'Khartoum'},{id:'740',cc:'sr',n:'Suriname',c:'Paramaribo'},
  {id:'752',cc:'se',n:'Sweden',c:'Stockholm'},{id:'756',cc:'ch',n:'Switzerland',c:'Bern'},
  {id:'760',cc:'sy',n:'Syria',c:'Damascus'},{id:'158',cc:'tw',n:'Taiwan',c:'Taipei'},
  {id:'762',cc:'tj',n:'Tajikistan',c:'Dushanbe'},{id:'834',cc:'tz',n:'Tanzania',c:'Dodoma'},
  {id:'764',cc:'th',n:'Thailand',c:'Bangkok'},{id:'626',cc:'tl',n:'Timor-Leste',c:'Dili'},
  {id:'768',cc:'tg',n:'Togo',c:'Lomé'},{id:'776',cc:'to',n:'Tonga',c:'Nukuʻalofa'},
  {id:'780',cc:'tt',n:'Trinidad and Tobago',c:'Port of Spain'},
  {id:'788',cc:'tn',n:'Tunisia',c:'Tunis'},{id:'792',cc:'tr',n:'Turkey',c:'Ankara'},
  {id:'795',cc:'tm',n:'Turkmenistan',c:'Ashgabat'},{id:'798',cc:'tv',n:'Tuvalu',c:'Funafuti'},
  {id:'800',cc:'ug',n:'Uganda',c:'Kampala'},{id:'804',cc:'ua',n:'Ukraine',c:'Kyiv'},
  {id:'784',cc:'ae',n:'United Arab Emirates',c:'Abu Dhabi'},
  {id:'826',cc:'gb',n:'United Kingdom',c:'London'},
  {id:'840',cc:'us',n:'United States',c:'Washington, D.C.'},
  {id:'858',cc:'uy',n:'Uruguay',c:'Montevideo'},{id:'860',cc:'uz',n:'Uzbekistan',c:'Tashkent'},
  {id:'548',cc:'vu',n:'Vanuatu',c:'Port Vila'},{id:'862',cc:'ve',n:'Venezuela',c:'Caracas'},
  {id:'704',cc:'vn',n:'Vietnam',c:'Hanoi'},{id:'887',cc:'ye',n:'Yemen',c:"Sana'a"},
  {id:'894',cc:'zm',n:'Zambia',c:'Lusaka'},{id:'716',cc:'zw',n:'Zimbabwe',c:'Harare'},
  {id:'304',cc:'gl',n:'Greenland',c:'Nuuk'},{id:'900',cc:'xk',n:'Kosovo',c:'Pristina'},
];

const COUNTRY_MAP: Record<string, Country> = {};
COUNTRIES.forEach(c => { COUNTRY_MAP[c.id] = c; });

interface TopoTransform {
  scale: [number, number];
  translate: [number, number];
}

interface TopoGeometry {
  type: string;
  id: string;
  properties: Record<string, unknown>;
  arcs: number[][] | number[][][];
}

interface TopoObject {
  geometries: TopoGeometry[];
}

interface Topology {
  arcs: number[][][];
  transform: TopoTransform;
  objects: Record<string, TopoObject>;
}

function topoFeature(topology: Topology, obj: TopoObject): GeoJSON.FeatureCollection {
  const arcsArr = topology.arcs;
  function arcToCoords(arcIdx: number): [number, number][] {
    const reverse = arcIdx < 0;
    const idx = reverse ? ~arcIdx : arcIdx;
    const arc = arcsArr[idx];
    const coords: [number, number][] = [];
    let x = 0, y = 0;
    for (const [dx, dy] of arc) {
      x += dx; y += dy;
      const lon = x * topology.transform.scale[0] + topology.transform.translate[0];
      const lat = y * topology.transform.scale[1] + topology.transform.translate[1];
      coords.push([lon, lat]);
    }
    if (reverse) coords.reverse();
    return coords;
  }
  function ringToCoords(ring: number[]): [number, number][] {
    let coords: [number, number][] = [];
    for (const arcIdx of ring) {
      const c = arcToCoords(arcIdx);
      coords = coords.concat(coords.length ? c.slice(1) : c);
    }
    return coords;
  }
  function geoFromTopo(o: TopoGeometry): GeoJSON.Geometry | null {
    if (o.type === 'Polygon') {
      return { type: 'Polygon', coordinates: (o.arcs as number[][]).map(ringToCoords) };
    } else if (o.type === 'MultiPolygon') {
      return { type: 'MultiPolygon', coordinates: (o.arcs as number[][][]).map(poly => poly.map(ringToCoords)) };
    }
    return null;
  }
  const geoms = obj.geometries || [];
  return {
    type: 'FeatureCollection',
    features: geoms.map(g => ({
      type: 'Feature' as const,
      id: g.id,
      properties: g.properties || {},
      geometry: geoFromTopo(g)!,
    })).filter(f => f.geometry)
  };
}

const WORLD_URL = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json';

type QuizMode = 'mixed' | 'flag' | 'capital';

export default function GeoQuiz() {
  const svgRef = useRef<SVGSVGElement>(null);
  const gRef = useRef<SVGGElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [features, setFeatures] = useState<GeoJSON.Feature[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [mode, setMode] = useState<QuizMode>('mixed');
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [total, setTotal] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [answering, setAnswering] = useState(true);
  const [highlights, setHighlights] = useState<Record<string, string>>({});
  const [tooltip, setTooltip] = useState<Tooltip | null>(null);
  const [pathFn, setPathFn] = useState<d3.GeoPath | null>(null);
  const projRef = useRef<d3.GeoProjection | null>(null);
  const zoomRef = useRef<{ zoom: d3.ZoomBehavior<SVGSVGElement, unknown>; svg: d3.Selection<SVGSVGElement, unknown, null, undefined> } | null>(null);
  const featRef = useRef<GeoJSON.Feature[]>([]);

  const pickQuestion = useCallback((feats: GeoJSON.Feature[], m: QuizMode) => {
    const pool = feats.length ? feats : featRef.current;
    if (!pool.length) return;
    const f = pool[Math.floor(Math.random() * pool.length)];
    const info = COUNTRY_MAP[f.id as string];
    const qm: 'flag' | 'capital' = m === 'mixed' ? (Math.random() < 0.5 ? 'flag' : 'capital') : m as 'flag' | 'capital';
    setQuestion({ featureId: f.id as string, info, mode: qm });
    setAnswering(true);
    setHighlights({});
  }, []);

  useEffect(() => {
    fetch(WORLD_URL)
      .then(r => { if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
      .then((topo: Topology) => {
        const fc = topoFeature(topo, topo.objects.countries);
        const valid = fc.features.filter(f => COUNTRY_MAP[f.id as string]);
        featRef.current = valid;
        setFeatures(valid);
        setLoading(false);
        const first = valid[Math.floor(Math.random() * valid.length)];
        const info = COUNTRY_MAP[first.id as string];
        const qm: 'flag' | 'capital' = Math.random() < 0.5 ? 'flag' : 'capital';
        setQuestion({ featureId: first.id as string, info, mode: qm });
      })
      .catch(e => setError(e.message));
  }, []);

  useEffect(() => {
    if (!features.length || !svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const g = d3.select(gRef.current);
    const parent = svgRef.current.parentElement;
    if (!parent) return;
    const w = parent.clientWidth;
    const h = parent.clientHeight;
    svg.attr('width', w).attr('height', h);

    const proj = d3.geoNaturalEarth1().fitSize([w - 20, h - 20], { type: 'FeatureCollection', features });
    proj.translate([w/2, h/2]);
    projRef.current = proj;
    setPathFn(() => d3.geoPath().projection(proj));

    const zoom = d3.zoom<SVGSVGElement, unknown>().scaleExtent([1, 12]).on('zoom', (e: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
      g.attr('transform', e.transform.toString());
    });
    svg.call(zoom);
    zoomRef.current = { zoom, svg };

    return () => { svg.on('.zoom', null); };
  }, [features]);

  const handleClick = (fId: string) => {
    if (!answering || !question) return;
    setAnswering(false);
    const isCorrect = fId === question.featureId;
    const name = question.info.n;
    if (isCorrect) {
      setScore(s => s + 1);
      setStreak(s => {
        const next = s + 1;
        setBestStreak(b => Math.max(b, next));
        return next;
      });
      setHighlights({ [fId]: 'correct' });
      setFeedback({ msg: `Correct! ${name}`, type: 'correct' });
    } else {
      setStreak(0);
      setHighlights({ [fId]: 'wrong', [question.featureId]: 'reveal' });
      const clickedInfo = COUNTRY_MAP[fId];
      const clickedName = clickedInfo ? clickedInfo.n : 'Unknown';
      setFeedback({ msg: `Wrong — you clicked ${clickedName}. It was ${name}`, type: 'wrong' });
    }
    setTotal(t => t + 1);
    setTimeout(() => {
      setFeedback(null);
      pickQuestion(features, mode);
    }, isCorrect ? 1200 : 2800);
  };

  const skip = () => {
    if (!answering || !question) return;
    setAnswering(false);
    setStreak(0);
    setTotal(t => t + 1);
    setHighlights({ [question.featureId]: 'reveal' });
    setFeedback({ msg: `Skipped — ${question.info.n}`, type: 'wrong' });
    setTimeout(() => {
      setFeedback(null);
      pickQuestion(features, mode);
    }, 2200);
  };

  const zoomIn = () => {
    if (!zoomRef.current) return;
    zoomRef.current.svg.transition().duration(300).call(zoomRef.current.zoom.scaleBy, 1.5);
  };
  const zoomOut = () => {
    if (!zoomRef.current) return;
    zoomRef.current.svg.transition().duration(300).call(zoomRef.current.zoom.scaleBy, 0.667);
  };
  const zoomReset = () => {
    if (!zoomRef.current) return;
    zoomRef.current.svg.transition().duration(400).call(zoomRef.current.zoom.transform, d3.zoomIdentity);
  };

  const changeMode = (m: QuizMode) => {
    setMode(m);
    pickQuestion(features, m);
  };

  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  if (error) return (
    <div className="geo-error">
      <div className="geo-error-icon">!</div>
      <div className="geo-error-title">Failed to load map data</div>
      <div className="geo-error-detail">{error}</div>
      <div className="geo-error-hint">Try refreshing or check your network connection</div>
    </div>
  );

  if (loading) return (
    <div className="geo-loading">
      <div className="geo-spinner" />
      <div className="geo-loading-text">Loading atlas&hellip;</div>
    </div>
  );

  const flagUrl = question ? `https://flagcdn.com/w160/${question.info.cc}.png` : '';

  return (
    <div className="geo-root">
      {/* Header */}
      <header className="geo-header">
        <div className="geo-logo">
          Geo<span className="geo-logo-accent">Quiz</span>
        </div>
        <div className="geo-stats">
          <div className="geo-stat">
            <div className="geo-stat-value">{score}</div>
            <div className="geo-stat-label">Score</div>
          </div>
          <div className="geo-stat">
            <div className="geo-stat-value geo-stat-streak">{streak}</div>
            <div className="geo-stat-label">Streak</div>
          </div>
          <div className="geo-stat">
            <div className="geo-stat-value geo-stat-best">{bestStreak}</div>
            <div className="geo-stat-label">Best</div>
          </div>
          <div className="geo-stat">
            <div className="geo-stat-value">{pct}%</div>
            <div className="geo-stat-label">Accuracy</div>
          </div>
        </div>
      </header>

      {/* Prompt */}
      <div className="geo-prompt">
        <span className={`geo-mode-badge ${question?.mode === 'flag' ? 'geo-mode-flag' : 'geo-mode-capital'}`}>
          {question?.mode === 'flag' ? '🏳️ Flag' : '🏛️ Capital'}
        </span>
        {question && question.mode === 'flag' ? (
          <div className="geo-prompt-content">
            <img
              src={flagUrl}
              alt="flag"
              className="geo-flag-img"
              onError={e => { (e.target as HTMLImageElement).style.display='none'; }}
            />
            <span className="geo-prompt-text">Which country does this flag belong to?</span>
          </div>
        ) : question ? (
          <span className="geo-prompt-text">
            Where is <strong className="geo-capital-name">{question.info.c}</strong>?
          </span>
        ) : null}
        <span className="geo-prompt-hint">Click the country on the map</span>
      </div>

      {/* Map */}
      <div className="geo-map-container">
        <svg ref={svgRef} className="geo-map-svg">
          {pathFn && (
            <g ref={gRef}>
              <path
                d={pathFn(d3.geoGraticule()()) || undefined}
                fill="none"
                stroke="#1e2230"
                strokeWidth={0.4}
              />
              {features.map(f => {
                const fId = f.id as string;
                const hl = highlights[fId];
                let fill = '#232836';
                let stroke = '#3d425490';
                let sw = 0.5;
                if (hl === 'correct') { fill = '#34d399'; stroke = '#22c55e'; sw = 1.5; }
                else if (hl === 'wrong') { fill = '#f87171'; stroke = '#ef4444'; sw = 1; }
                else if (hl === 'reveal') { fill = '#60a5fa'; stroke = '#3b82f6'; sw = 2; }
                return (
                  <path
                    key={fId}
                    d={pathFn(f) || undefined}
                    fill={fill}
                    stroke={stroke}
                    strokeWidth={sw}
                    className="geo-country-path"
                    onClick={() => handleClick(fId)}
                    onMouseEnter={(e) => {
                      const info = COUNTRY_MAP[fId];
                      if (info && !highlights[fId]) {
                        (e.target as SVGPathElement).style.fill = '#3a4058';
                      }
                      setTooltip(info ? { name: info.n, x: e.clientX, y: e.clientY } : null);
                    }}
                    onMouseMove={(e) => setTooltip(t => t ? {...t, x: e.clientX, y: e.clientY} : null)}
                    onMouseLeave={(e) => {
                      if (!highlights[fId]) (e.target as SVGPathElement).style.fill = '';
                      setTooltip(null);
                    }}
                  />
                );
              })}
            </g>
          )}
        </svg>

        {/* Zoom controls */}
        <div className="geo-zoom-controls">
          <button onClick={zoomIn} className="geo-zoom-btn" title="Zoom in">+</button>
          <button onClick={zoomOut} className="geo-zoom-btn" title="Zoom out">&minus;</button>
          <button onClick={zoomReset} className="geo-zoom-btn geo-zoom-reset" title="Reset zoom">&#x27F2;</button>
        </div>

        {/* Tooltip */}
        {tooltip && (
          <div
            className="geo-tooltip"
            style={{ left: tooltip.x + 14, top: tooltip.y - 10 }}
          >
            {tooltip.name}
          </div>
        )}
      </div>

      {/* Feedback toast */}
      {feedback && (
        <div className={`geo-feedback ${feedback.type === 'correct' ? 'geo-feedback-correct' : 'geo-feedback-wrong'}`}>
          {feedback.type === 'correct' ? '✓ ' : '✗ '}{feedback.msg}
        </div>
      )}

      {/* Controls */}
      <div className="geo-controls">
        <div className="geo-mode-buttons">
          {(['mixed', 'flag', 'capital'] as QuizMode[]).map(m => (
            <button
              key={m}
              onClick={() => changeMode(m)}
              className={`geo-mode-btn ${mode === m ? 'geo-mode-btn-active' : ''}`}
            >
              {m === 'mixed' ? '🔀 Mixed' : m === 'flag' ? '🏳️ Flag' : '🏛️ Capital'}
            </button>
          ))}
        </div>
        <button onClick={skip} className="geo-skip-btn">
          Skip &rarr;
        </button>
      </div>
    </div>
  );
}
