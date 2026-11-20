/*
 * Atlas Basketball: the fictional organisation behind every demo app.
 *
 * Two competitions (Atlas League and Atlas Cup), 36 clubs, rosters, referees,
 * 26 seasons of games and the current 2026-27 season. Everything is generated
 * from fixed seeds, so every visitor sees exactly the same data.
 * No real club, player, referee, contact or medical record is used.
 */
(function () {
  "use strict";

  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rng(seed) {
    const r = mulberry32(seed);
    return {
      next: r,
      int: (a, b) => a + Math.floor(r() * (b - a + 1)),
      pick: (arr) => arr[Math.floor(r() * arr.length)],
      chance: (p) => r() < p,
      normal: (mu, sd) => { const u = 1 - r(), v = r(); return mu + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); },
      shuffle: (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; },
    };
  }
  const R = rng(20261120);

  // ---------- organisation ----------
  const ORG = { name: "Atlas Basketball", department: "Competition Department", domain: "atlas-basketball.example" };
  const COMPS = {
    L: { code: "L", name: "Atlas League", short: "League", color: "#f05a28", from: 2000 },
    C: { code: "C", name: "Atlas Cup", short: "Cup", color: "#2ea3f2", from: 2002 },
  };

  // ---------- clubs: fictional names and cities, real countries ----------
  // [code, name, short, colour, country, lat, lon, airport, arena, capacity]
  const CLUB_ROWS = {
    L: [
      ["ALT", "Altamira Comets", "Altamira", "#d1495b", "ESP", 43.3, -4.0, "ALM", "Palau Altamira", 11200],
      ["BRV", "Brava Mariners", "Brava", "#00798c", "ESP", 41.7, 2.9, "BRV", "Brava Arena", 7600],
      ["CDR", "Cedarholm Owls", "Cedarholm", "#6a4c93", "LTU", 54.9, 23.9, "CDH", "Cedarholm Hall", 15400],
      ["DUN", "Dunmore Foxes", "Dunmore", "#e07a1f", "FRA", 45.7, 4.8, "DNM", "Salle Dunmore", 8900],
      ["ESK", "Eskerra Bulls", "Eskerra", "#3d405b", "ESP", 43.2, -2.9, "ESK", "Eskerra Pavilion", 9800],
      ["FAL", "Falkvik Ravens", "Falkvik", "#22223b", "LTU", 55.7, 21.1, "FLK", "Falkvik Arena", 6500],
      ["GRN", "Granmar Tide", "Granmar", "#118ab2", "GRC", 37.9, 23.7, "GRM", "Granmar Dome", 14100],
      ["HAL", "Halvard Wolves", "Halvard", "#7f5539", "SRB", 44.8, 20.4, "HLV", "Halvard Hall", 18300],
      ["IRN", "Ironvale Miners", "Ironvale", "#5f6f52", "TUR", 41.0, 29.0, "IRV", "Ironvale Sports Hall", 12700],
      ["JUN", "Juniper Sparks", "Juniper", "#ef476f", "ITA", 45.5, 9.2, "JNP", "Palazzo Juniper", 10500],
      ["KOR", "Korsa Royals", "Korsa", "#4361ee", "ESP", 40.4, -3.7, "KRS", "Korsa Center", 13900],
      ["LUM", "Lumeria Lights", "Lumeria", "#f4a261", "ISR", 32.1, 34.8, "LMR", "Lumeria Arena", 10300],
      ["MAR", "Marisol Waves", "Marisol", "#2a9d8f", "ESP", 39.5, -0.4, "MRS", "Marisol Pavilion", 8500],
      ["NOR", "Nordhaven Pines", "Nordhaven", "#264653", "GER", 52.5, 13.4, "NDH", "Nordhaven Arena", 14500],
      ["OST", "Ostrova Bears", "Ostrova", "#9d0208", "TUR", 39.9, 32.9, "OSV", "Ostrova Dome", 13000],
      ["PAL", "Palmera Suns", "Palmera", "#e9c46a", "ITA", 44.5, 11.3, "PLM", "Palmera Hall", 9400],
      ["QUA", "Quarry City Stones", "Quarry City", "#6c757d", "FRA", 48.9, 2.4, "QRY", "Quarry City Arena", 15600],
      ["RIV", "Riverton Herons", "Riverton", "#0077b6", "GRC", 40.6, 22.9, "RVT", "Riverton Hall", 8000],
    ],
    C: [
      ["ARE", "Arenal Pirates", "Arenal", "#b5179e", "ESP", 28.1, -15.4, "ARN", "Arenal Pavilion", 5400],
      ["BOR", "Borovo Steel", "Borovo", "#495057", "SRB", 45.3, 19.8, "BRO", "Borovo Hall", 7100],
      ["CAS", "Castellmar Gulls", "Castellmar", "#0096c7", "ESP", 39.9, 4.2, "CSM", "Castellmar Arena", 5200],
      ["DEL", "Delmara Lynx", "Delmara", "#7b2cbf", "SLO", 46.1, 14.5, "DLM", "Delmara Hall", 6300],
      ["ELV", "Elvas Hawks", "Elvas", "#bc4749", "POR", 38.7, -9.1, "ELV", "Elvas Pavilion", 4800],
      ["FJO", "Fjordby Vikings", "Fjordby", "#1d3557", "FIN", 60.2, 24.9, "FJB", "Fjordby Arena", 6100],
      ["GOL", "Golfo Dolphins", "Golfo", "#2a9d8f", "ITA", 40.9, 14.3, "GLF", "Palazzo Golfo", 5900],
      ["HER", "Hermosa Saints", "Hermosa", "#d4a373", "MNE", 42.4, 19.3, "HRM", "Hermosa Hall", 5100],
      ["ILM", "Ilmara Owls", "Ilmara", "#606c38", "LAT", 56.9, 24.1, "ILM", "Ilmara Arena", 7200],
      ["JAD", "Jadran Sailors", "Jadran", "#023e8a", "CRO", 43.5, 16.4, "JDR", "Jadran Center", 8200],
      ["KAL", "Kalista Titans", "Kalista", "#9c6644", "GRC", 39.6, 22.4, "KLS", "Kalista Hall", 4600],
      ["LIS", "Lisava Rockets", "Lisava", "#e63946", "POL", 52.2, 21.0, "LSV", "Lisava Arena", 7800],
      ["MON", "Montclar Eagles", "Montclar", "#344e41", "FRA", 43.6, 3.9, "MTC", "Salle Montclar", 5600],
      ["NAV", "Navarra Hills", "Navarra", "#8d99ae", "ESP", 42.8, -1.6, "NVR", "Navarra Pavilion", 6700],
      ["ORI", "Oriente Stars", "Oriente", "#ffb703", "TUR", 38.4, 27.1, "ORT", "Oriente Dome", 9100],
      ["PRI", "Prisma Knights", "Prisma", "#5e548e", "GER", 48.1, 11.6, "PRS", "Prisma Halle", 6800],
      ["RAV", "Ravella Lions", "Ravella", "#f77f00", "ITA", 43.8, 11.2, "RVL", "Palazzo Ravella", 6200],
      ["SOL", "Solano Breeze", "Solano", "#00b4d8", "ISR", 32.8, 35.0, "SLN", "Solano Arena", 5300],
    ],
  };
  const CLUBS = []; const CLUB = {};
  Object.entries(CLUB_ROWS).forEach(([comp, rows]) => rows.forEach(([code, name, short, color, country, lat, lon, airport, arena, capacity]) => {
    const c = { code, name, short, color, country, lat, lon, airport, arena, capacity, comp, city: short,
      email: `security@${short.toLowerCase().replace(/\s+/g, "")}.example`, travelEmail: `team.manager@${short.toLowerCase().replace(/\s+/g, "")}.example` };
    CLUBS.push(c); CLUB[code] = c;
  }));
  const clubsOf = (comp) => CLUBS.filter((c) => c.comp === comp);

  // ---------- people ----------
  const FIRST = ["Adrian","Bruno","Carles","Dario","Elias","Filip","Goran","Hugo","Ivo","Jonas","Kai","Luka","Marco","Nico","Oskar","Pau","Rafael","Sami","Teo","Uros","Viktor","Yannis","Zoran","Aaron","Bastian","Cedric","Dmitri","Emil","Felix","Gael","Henrik","Isaac","Jalen","Kevin","Lars","Mateo","Nolan","Omar","Pedro","Quentin","Ruben","Stefan","Tomas","Andre","Bogdan","Cyril","Dorian","Enzo","Ilias","Joel","Kostas","Leo","Milos","Nikolas","Otto","Rokas","Sergio","Tiago","Vasilis","Xavi"];
  const LAST = ["Abaroa","Belic","Castell","Dimou","Ekström","Ferrand","Galvez","Horak","Ilic","Jansen","Kovac","Lindqvist","Moreau","Novak","Okafor","Petrakis","Quiroga","Rossi","Sander","Tanaka","Udeh","Varga","Weiss","Xanthos","Yilmaz","Zubiri","Arnaud","Brandt","Costa","Dragic","Esposito","Fonseca","Grau","Haddad","Iversen","Jovic","Kral","Lopes","Mendez","Nakamura","Olsen","Palacios","Renard","Sousa","Toivonen","Valdes","Wagner","Zeller","Aksoy","Baltas","Cerny","Duarte","Eriksen","Fabre","Gashi","Holm","Ionescu","Jurić","Kaya","Lucchesi"];
  const NATS = ["ESP","FRA","ITA","GRC","SRB","TUR","LTU","GER","CRO","SLO","POL","ISR","USA","USA","USA","POR","FIN","LAT","MNE","CAN","AUS","BEL"];
  const usedNames = new Set();
  const uniqueName = (r) => { let n; do { n = r.pick(FIRST) + " " + r.pick(LAST); } while (usedNames.has(n)); usedNames.add(n); return n; };

  const POS = ["G","G","G","G","F","F","F","F","F","C","C","C","G"];
  const PLAYERS = []; const PLAYER = {};
  let pid = 1000;
  CLUBS.forEach((club) => {
    const nums = new Set();
    POS.forEach((pos, i) => {
      let num; do { num = R.int(0, 55); } while (nums.has(num)); nums.add(num);
      const tier = i < 5 ? 1 : i < 9 ? 0.72 : 0.45;
      const age = R.int(19, 35);
      const p = {
        id: "P" + pid++, name: uniqueName(R), club: club.code, comp: club.comp, pos, number: num,
        height: pos === "G" ? R.int(183, 198) : pos === "F" ? R.int(198, 207) : R.int(206, 216),
        nat: club.country !== "ESP" && R.chance(0.45) ? club.country : R.pick(NATS),
        age, born: `${2026 - age}-${String(R.int(1, 12)).padStart(2, "0")}-${String(R.int(1, 28)).padStart(2, "0")}`,
        tier, starter: i < 5,
        skill: {
          pts: Math.max(2.5, R.normal(pos === "C" ? 10.5 : 12.5, 3.3) * tier),
          reb: (pos === "C" ? 7.2 : pos === "F" ? 4.8 : 2.8) * tier * R.normal(1, 0.15),
          ast: (pos === "G" ? 4.8 : pos === "F" ? 2.1 : 1.2) * tier * R.normal(1, 0.2),
          three: Math.min(0.45, Math.max(0.22, R.normal(pos === "C" ? 0.3 : 0.36, 0.04))),
          two: Math.min(0.66, Math.max(0.42, R.normal(pos === "C" ? 0.6 : 0.52, 0.04))),
          ft: Math.min(0.92, Math.max(0.55, R.normal(0.77, 0.07))),
        },
      };
      PLAYERS.push(p); PLAYER[p.id] = p;
    });
  });

  // Referees: crew chiefs, umpires, newcomers
  const REF_COUNTRIES = ["ESP","FRA","ITA","GRC","SRB","TUR","LTU","GER","CRO","SLO","POL","ISR","POR","CZE","LAT","FIN","BEL","NED","MNE","HUN"];
  const REFEREES = []; const REF = {};
  for (let i = 0; i < 70; i++) {
    const start = i < 16 ? 2000 : i >= 26 ? R.int(2008, 2023) : R.int(2001, 2020);
    const end = i >= 26 ? 2026 : Math.min(2025, start + R.int(8, 20));
    const ref = { id: "R" + (100 + i), name: uniqueName(R), country: R.pick(REF_COUNTRIES), from: start, to: end, weight: 0.4 + R.next(),
      level: i < 12 || (i >= 26 && i < 38) ? "Crew chief" : i < 50 ? "Umpire 1" : i < 62 ? "Umpire 2" : "Umpire 2 newcomer" };
    REFEREES.push(ref); REF[ref.id] = ref;
  }
  const ACTIVE_REFS = REFEREES.filter((r) => r.to >= 2026);

  // ---------- schedules ----------
  function roundRobin(codes, seed) {
    const r = rng(seed); const t = r.shuffle(codes); const n = t.length, rounds = [];
    for (let k = 0; k < n - 1; k++) {
      const g = []; for (let i = 0; i < n / 2; i++) { const a = t[i], b = t[n - 1 - i]; g.push(k % 2 === 0 ? [a, b] : [b, a]); }
      rounds.push(g); t.splice(1, 0, t.pop());
    }
    return rounds.concat(rounds.map((g) => g.map(([h, a]) => [a, h])));
  }
  const seasonLabel = (y) => y + "-" + String((y + 1) % 100).padStart(2, "0");
  const POSITIONS = ["Crew chief", "Umpire 1", "Umpire 2"];

  // 26 seasons of history (for the Referee Explorer)
  const HISTORY = [];
  Object.values(COMPS).forEach((comp) => {
    const codes = clubsOf(comp.code).map((c) => c.code);
    for (let y = comp.from; y <= 2025; y++) {
      const r = rng((comp.code === "L" ? 7000 : 17000) + y);
      const rounds = roundRobin(codes, (comp.code === "L" ? 300 : 900) + y);
      const start = Date.UTC(y, 9, 2);
      const pool = REFEREES.filter((x) => x.from <= y && x.to >= y);
      let gc = 0;
      const add = (phase, round, home, away, day) => {
        const crew = []; const ccPool = pool.filter((x) => x.level === "Crew chief" || x.from < y - 6);
        const pickW = (list) => { const tot = list.reduce((t, x) => t + x.weight, 0); let w = r.next() * tot; for (const x of list) { w -= x.weight; if (w <= 0) return x; } return list[0]; };
        crew.push(pickW(ccPool.length ? ccPool : pool).id);
        while (crew.length < 3) { const c = pickW(pool).id; if (!crew.includes(c)) crew.push(c); }
        let hs = r.int(64, 99), as = r.int(60, 96); if (hs === as) hs += 3;
        HISTORY.push({ comp: comp.code, season: seasonLabel(y), year: y, code: ++gc, phase, round, home, away,
          date: new Date(start + day * 86400000).toISOString().slice(0, 10), hs, as, venue: CLUB[home].arena, refs: crew });
      };
      rounds.forEach((g, ri) => g.forEach(([h, a]) => add("Regular Season", ri + 1, h, a, ri * 5 + r.int(0, 1))));
      const seeds = r.shuffle(codes).slice(0, 8);
      if (y >= 2022) { add("Play-In", 1, seeds[6], seeds[7], 172); add("Play-In", 1, seeds[4], seeds[5], 172); }
      for (let q = 0; q < 4; q++) for (let k = 0; k < 3; k++) add("Playoffs", k + 1, k === 1 ? seeds[7 - q] : seeds[q], k === 1 ? seeds[q] : seeds[7 - q], 175 + k * 3);
      add("Final Four", 1, seeds[0], seeds[3], 196); add("Final Four", 1, seeds[1], seeds[2], 196); add("Final Four", 2, seeds[0], seeds[1], 198);
    }
  });

  // Current season 2026-27, both competitions. "Today" is fixed so the demos stay consistent.
  const TODAY = "2027-01-03";
  const SEASON = { year: 2026, label: "2026-27", played: { L: 14, C: 14 }, next: { L: 15, C: 15 } };
  const GAMES = []; const GAME = {};
  Object.values(COMPS).forEach((comp) => {
    const rounds = roundRobin(clubsOf(comp.code).map((c) => c.code), comp.code === "L" ? 2026 : 2027);
    const first = comp.code === "L" ? Date.UTC(2026, 8, 29) : Date.UTC(2026, 8, 30);
    rounds.forEach((g, ri) => {
      const r = rng((comp.code === "L" ? 9100 : 19100) + ri);
      const round = ri + 1;
      const played = round <= SEASON.played[comp.code];
      g.forEach(([home, away], gi) => {
        const dayOff = comp.code === "L" ? (gi < 5 ? 1 : 2) : gi < 5 ? 0 : 1;
        const date = new Date(first + ri * 7 * 86400000 + dayOff * 86400000).toISOString().slice(0, 10);
        let hs = r.int(68, 99), as = r.int(64, 96); if (hs === as) hs += 2;
        const id = comp.code + String(round).padStart(2, "0") + String(gi + 1).padStart(2, "0");
        const tip = comp.code === "L" ? r.pick(["19:00", "20:00", "20:30", "20:45"]) : r.pick(["18:30", "19:00", "19:30", "20:00"]);
        const crew = r.shuffle(ACTIVE_REFS).slice(0, 3).map((x) => x.id);
        const game = { id, comp: comp.code, code: ri * 9 + gi + 1, round, home, away, date, tip, played, hs: played ? hs : null, as: played ? as : null, venue: CLUB[home].arena, refs: played ? crew : null };
        GAMES.push(game); GAME[id] = game;
      });
    });
  });
  const gamesOf = (comp, round) => GAMES.filter((g) => g.comp === comp && (round == null || g.round === round));
  const winner = (g) => (g.hs > g.as ? g.home : g.away);

  // ---------- game logs (per player, per game) for three seasons ----------
  const LOG_SEASONS = ["2024-25", "2025-26", "2026-27"];
  const logCache = {};
  function gameLogs(p) {
    if (logCache[p.id]) return logCache[p.id];
    const out = [];
    LOG_SEASONS.forEach((season, si) => {
      const r = rng(parseInt(p.id.slice(1), 10) * 7 + si * 131);
      const cur = season === "2026-27";
      const sched = cur ? GAMES.filter((g) => g.played && (g.home === p.club || g.away === p.club)) : null;
      const n = cur ? sched.length : 34 + (si === 1 ? 4 : 2);
      const form = r.normal(1, 0.1) * (1 + si * 0.04 * (p.age < 26 ? 1 : -0.5));
      const others = clubsOf(p.comp).map((c) => c.code).filter((c) => c !== p.club);
      for (let k = 0; k < n; k++) {
        const g = cur ? sched[k] : null;
        const home = g ? g.home === p.club : k % 2 === 0;
        const opp = g ? (home ? g.away : g.home) : others[k % others.length];
        const phase = cur ? "Regular Season" : k < 34 ? "Regular Season" : k < 35 ? "Play-In" : "Playoffs";
        const dnp = r.chance(p.tier < 0.5 ? 0.25 : 0.04);
        const f = form * (home ? 1.05 : 0.95) * Math.max(0.2, r.normal(1, 0.32));
        const min = dnp ? 0 : Math.round(Math.max(3, Math.min(37, r.normal(30 * p.tier, 4.5))));
        const scale = min / Math.max(1, 30 * p.tier);
        const tpa = dnp ? 0 : Math.max(0, Math.round(r.normal(p.pos === "C" ? 1 : 4.2, 1.4) * p.tier * scale));
        const fga2 = dnp ? 0 : Math.max(0, Math.round(r.normal(p.pos === "C" ? 6.5 : 5, 1.8) * p.tier * scale));
        const fta = dnp ? 0 : Math.max(0, Math.round(r.normal(2.6, 1.6) * p.tier * scale));
        let tpm = 0, fgm2 = 0, ftm = 0;
        for (let i = 0; i < tpa; i++) if (r.chance(p.skill.three * f)) tpm++;
        for (let i = 0; i < fga2; i++) if (r.chance(Math.min(0.85, p.skill.two * (0.9 + 0.1 * f)))) fgm2++;
        for (let i = 0; i < fta; i++) if (r.chance(p.skill.ft)) ftm++;
        const won = g ? winner(g) === p.club : r.chance(0.5);
        out.push({
          season, game: k + 1, date: g ? g.date : null, opp, home, phase, won, starter: p.starter && !dnp, dnp, min,
          pts: tpm * 3 + fgm2 * 2 + ftm, tpm, tpa, fgm: tpm + fgm2, fga: tpa + fga2, ftm, fta,
          reb: dnp ? 0 : Math.max(0, Math.round(p.skill.reb * f * scale * r.normal(1, 0.25))),
          oreb: dnp ? 0 : Math.max(0, Math.round(p.skill.reb * 0.28 * scale * r.normal(1, 0.4))),
          ast: dnp ? 0 : Math.max(0, Math.round(p.skill.ast * f * scale * r.normal(1, 0.3))),
          stl: dnp ? 0 : Math.max(0, Math.round(r.normal(0.9, 0.8) * p.tier * scale)),
          blk: dnp ? 0 : Math.max(0, Math.round(r.normal(p.pos === "C" ? 0.9 : 0.25, 0.6) * scale)),
          tov: dnp ? 0 : Math.max(0, Math.round(r.normal(1.5, 1) * p.tier * scale)),
          pf: dnp ? 0 : Math.max(0, Math.min(5, Math.round(r.normal(2.2, 1.1) * scale))),
          pm: dnp ? 0 : Math.round(r.normal((won ? 5 : -5) * scale, 7)),
        });
      }
    });
    logCache[p.id] = out;
    return out;
  }
  const careerPoints = (p) => Math.round(p.skill.pts * Math.max(1, p.age - 19) * 31);

  // ---------- helpers shared by the apps ----------
  const esc = (s) => String(s == null ? "" : s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmt = (n, d = 0) => Number(n).toLocaleString("en-GB", { minimumFractionDigits: d, maximumFractionDigits: d });
  const crest = (code, size = 26) => { const c = CLUB[code]; return `<span class="crest" style="--c:${c.color};--s:${size}px" aria-hidden="true">${code}</span>`; };
  const dateLong = (iso) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
  const dateShort = (iso) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  const addDays = (iso, n) => new Date(Date.parse(iso + "T12:00:00Z") + n * 86400000).toISOString().slice(0, 10);
  const daysBetween = (a, b) => Math.round((Date.parse(b + "T12:00:00Z") - Date.parse(a + "T12:00:00Z")) / 86400000);
  const ordinal = (n) => n + (["th", "st", "nd", "rd"][(n % 100 - 20) % 10] || ["th", "st", "nd", "rd"][n % 100] || "th");
  const initials = (name) => name.split(" ").map((x) => x[0]).join("").slice(0, 2);
  function distanceKm(a, b) {
    const R0 = 6371, toR = (d) => (d * Math.PI) / 180;
    const dLat = toR(b.lat - a.lat), dLon = toR(b.lon - a.lon);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(toR(a.lat)) * Math.cos(toR(b.lat)) * Math.sin(dLon / 2) ** 2;
    return Math.round(2 * R0 * Math.asin(Math.sqrt(h)));
  }
  function download(name, text, type = "text/csv;charset=utf-8") {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([type.startsWith("text/csv") ? "﻿" + text : text], { type }));
    a.download = name; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }
  const csvCell = (v) => { const s = String(v == null ? "" : v); return /[",\n;]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
  const toCSV = (rows) => rows.map((r) => r.map(csvCell).join(",")).join("\n");
  // Small persistent store per app (falls back to memory when storage is blocked)
  function store(app) {
    const mem = {};
    const key = (k) => `atlas-demo:${app}:${k}`;
    return {
      get(k, d) { try { const v = localStorage.getItem(key(k)); return v == null ? d : JSON.parse(v); } catch (e) { return k in mem ? mem[k] : d; } },
      set(k, v) { mem[k] = v; try { localStorage.setItem(key(k), JSON.stringify(v)); } catch (e) { /* memory only */ } },
      clear() { try { Object.keys(localStorage).filter((k) => k.startsWith(`atlas-demo:${app}:`)).forEach((k) => localStorage.removeItem(k)); } catch (e) { /* ignore */ } },
    };
  }
  // Demo ribbon shown at the bottom of every app
  function ribbon(appName, repoPath) {
    const el = document.createElement("div");
    el.className = "demo-ribbon";
    el.innerHTML = `<span><b>${esc(appName)}</b> · demo with invented data (Atlas Basketball). Built by Marta Neira.</span>
      <span><a href="../hub/">Hub</a><a href="../#projects">Portfolio</a><a href="https://github.com/martaneira/martaneira.github.io/tree/main/${repoPath}">Code</a><button type="button" class="ribbon-x" aria-label="Hide this bar">×</button></span>`;
    el.querySelector(".ribbon-x").onclick = () => el.remove();
    document.body.appendChild(el);
  }

  window.ATLAS = {
    rng, ORG, COMPS, CLUBS, CLUB, clubsOf, PLAYERS, PLAYER, REFEREES, REF, ACTIVE_REFS, POSITIONS, HISTORY,
    TODAY, SEASON, GAMES, GAME, gamesOf, winner, LOG_SEASONS, gameLogs, careerPoints, seasonLabel,
    esc, fmt, crest, dateLong, dateShort, addDays, daysBetween, ordinal, initials, distanceKm, download, toCSV, store, ribbon,
  };
})();
