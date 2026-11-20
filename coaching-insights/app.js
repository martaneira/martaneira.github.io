/* Coaching Insights (demo). Player and team numbers for coaches: season tables with filters, head-to-head
   matchups, rotations, lineups with on/off ratings, and a live view of today's games. Invented data. */
(function () {
  "use strict";
  const A = window.ATLAS, { esc, fmt, crest, CLUB } = A;
  const app = document.getElementById("app");
  const store = A.store("coaching-insights");
  const COLORS = ["#f05a28", "#2a1b78", "#2ea3f2"];

  let view = { page: "playbook", mode: store.get("mode", "User"), myTeam: store.get("myTeam", "ALT"), comp: "L", team: "ALT", season: "2026-27", phase: "All", ha: "All", wl: "All", role: "All", per: "pg", sort: "pts", mu: null, liveId: null, liveErr: "" };
  view.mu = [A.PLAYERS.find((p) => p.club === "ALT" && p.starter).id, A.PLAYERS.find((p) => p.club !== "ALT" && p.comp === "L" && p.starter && p.pos === "G").id];
  if (view.mode === "Coach") { view.team = view.myTeam; view.comp = CLUB[view.myTeam].comp; }
  const go = (p) => { Object.assign(view, p); render(); };

  // ---------- stats ----------
  function logsOf(p) {
    return A.gameLogs(p).filter((l) => (view.season === "All" || l.season === view.season) && !l.dnp
      && (view.phase === "All" || l.phase === view.phase) && (view.ha === "All" || (view.ha === "Home") === l.home)
      && (view.wl === "All" || (view.wl === "Wins") === l.won) && (view.role === "All" || (view.role === "Starter") === l.starter));
  }
  const KEYS = ["min", "pts", "fgm", "fga", "tpm", "tpa", "ftm", "fta", "reb", "oreb", "ast", "stl", "blk", "tov", "pf", "pm"];
  function line(ls) {
    const t = Object.fromEntries(KEYS.map((k) => [k, ls.reduce((s, l) => s + l[k], 0)])); t.gp = ls.length;
    t.pir = t.pts + t.reb + t.ast + t.stl + t.blk - (t.fga - t.fgm) - (t.fta - t.ftm) - t.tov - t.pf;
    const f = view.per === "tot" ? 1 : view.per === "pg" ? 1 / Math.max(1, t.gp) : 28 / Math.max(1, t.min);
    const out = { gp: t.gp, raw: t }; ["min", "pts", "reb", "oreb", "ast", "stl", "blk", "tov", "pf", "pm", "pir", "tpm", "tpa", "fgm", "fga", "ftm", "fta"].forEach((k) => (out[k] = t[k] * (k === "min" && view.per === "p28" ? 1 / Math.max(1, t.gp) : f)));
    out.fg = t.fga ? t.fgm / t.fga : null; out.tp = t.tpa ? t.tpm / t.tpa : null; out.ft = t.fta ? t.ftm / t.fta : null; out.two = t.fga - t.tpa ? (t.fgm - t.tpm) / (t.fga - t.tpa) : null;
    return out;
  }
  const n1 = (v) => (v == null ? "–" : view.per === "tot" ? fmt(v) : v.toFixed(1));
  const pc = (v) => (v == null ? "–" : (100 * v).toFixed(1));
  const roster = (club) => A.PLAYERS.filter((p) => p.club === club);

  function header() {
    const pages = [["playbook", "Playbook"], ["matchup", "Matchup"], ["rotation", "Rotation"], ["lineups", "Lineups"], ["live", "Live"]];
    return `<header class="top"><div class="in"><span class="brand"><i></i>Coaching Insights</span><nav>${pages.map(([k, l]) => `<button type="button" data-page="${k}" aria-current="${view.page === k}" class="${k === "live" ? "live" : ""}">${l}</button>`).join("")}</nav>
      <div class="r"><span class="mode" role="group" aria-label="Mode">${["Coach", "User"].map((m) => `<button type="button" data-mode="${m}" aria-pressed="${view.mode === m}">${m}</button>`).join("")}</span><a href="../hub/">Back to hub</a></div></div></header>`;
  }
  function filters(opts = {}) {
    const teamSel = view.mode === "Coach" && !opts.anyTeam ? `<label>Team<select disabled><option>${esc(CLUB[view.myTeam].name)} (your team)</option></select></label>` : `<label>Competition<select data-v="comp">${["L", "C"].map((c) => `<option value="${c}"${view.comp === c ? " selected" : ""}>${A.COMPS[c].name}</option>`).join("")}</select></label><label>Team<select data-v="team">${A.clubsOf(view.comp).map((c) => `<option value="${c.code}"${view.team === c.code ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label>`;
    const sel = (k, label, list) => `<label>${label}<select data-v="${k}">${list.map(([v, l]) => `<option value="${v}"${view[k] === v ? " selected" : ""}>${l}</option>`).join("")}</select></label>`;
    return `<div class="filters">${opts.noTeam ? "" : teamSel}${sel("season", "Season", [["2026-27", "2026-27"], ["2025-26", "2025-26"], ["2024-25", "2024-25"], ["All", "Last 3 seasons"]])}${sel("phase", "Games", [["All", "All games"], ["Regular Season", "Regular season"], ["Play-In", "Play-in"], ["Playoffs", "Playoffs"]])}${sel("ha", "Venue", [["All", "Home and away"], ["Home", "Home"], ["Away", "Away"]])}${sel("wl", "Result", [["All", "Wins and losses"], ["Wins", "Wins"], ["Losses", "Losses"]])}${sel("role", "Role", [["All", "Starters and bench"], ["Starter", "Starter"], ["Bench", "Bench"]])}
      <span class="seg" role="group" aria-label="Numbers" style="margin-left:auto">${[["pg", "Per game"], ["p28", "Per 28 min"], ["tot", "Totals"]].map(([k, l]) => `<button type="button" data-per="${k}" aria-pressed="${view.per === k}">${l}</button>`).join("")}</span></div>`;
  }
  function playbook() {
    const club = CLUB[view.team], rows = roster(view.team).map((p) => ({ p, s: line(logsOf(p)) })).filter((x) => x.s.gp);
    const k = view.sort; rows.sort((a, b) => (k === "name" ? a.p.name.localeCompare(b.p.name) : (b.s[k] ?? -1) - (a.s[k] ?? -1)));
    const cols = [["gp", "GP"], ["min", "MIN"], ["pts", "PTS"], ["two", "2P%"], ["tp", "3P%"], ["ft", "FT%"], ["reb", "REB"], ["oreb", "OREB"], ["ast", "AST"], ["stl", "STL"], ["blk", "BLK"], ["tov", "TOV"], ["pf", "PF"], ["pm", "+/-"], ["pir", "PIR"]];
    const team = line(roster(view.team).flatMap((p) => logsOf(p)));
    const games = A.GAMES.filter((g) => g.played && (g.home === view.team || g.away === view.team)), w = games.filter((g) => A.winner(g) === view.team).length;
    const next = A.GAMES.filter((g) => !g.played && (g.home === view.team || g.away === view.team)).sort((a, b) => a.date.localeCompare(b.date))[0];
    const opp = next && (next.home === view.team ? next.away : next.home);
    const pf = games.reduce((s, g) => s + (g.home === view.team ? g.hs : g.as), 0) / Math.max(1, games.length), pa = games.reduce((s, g) => s + (g.home === view.team ? g.as : g.hs), 0) / Math.max(1, games.length);
    const fmtC = (key, v) => (["two", "tp", "ft"].includes(key) ? pc(v) : key === "gp" ? v : n1(v));
    return `<div class="head"><h1><span class="pn">${crest(club.code, 40)}${esc(club.name)}</span></h1><p>${view.mode === "Coach" ? "Coach mode: your team first. Switch to User mode to look at any team." : "Every player's numbers with the filters a coach asks for."}</p></div>${filters()}
      <div class="kpis"><div class="card kpi"><b>${w}–${games.length - w}</b><span>Record ${A.SEASON.label}</span></div><div class="card kpi"><b>${pf.toFixed(1)}</b><span>Points scored per game</span></div><div class="card kpi"><b>${pa.toFixed(1)}</b><span>Points allowed per game</span></div><div class="card kpi"><b>${pc(team.tp)}%</b><span>Three-point % (filters)</span></div>
        <div class="card kpi">${next ? `<b style="font-size:20px"><button type="button" data-scout="${opp}" class="btn ghost" style="padding:4px 10px">${crest(opp, 20)} ${esc(CLUB[opp].short)}</button></b><span>Next: ${next.home === view.team ? "vs" : "at"} ${esc(CLUB[opp].short)}, ${A.dateShort(next.date)} · scout them</span>` : "<b>–</b><span>No games left</span>"}</div></div>
      <div class="card tw"><table><thead><tr><th data-sort="name" class="${k === "name" ? "on" : ""}">Player</th>${cols.map(([c, l]) => `<th data-sort="${c}" class="${k === c ? "on" : ""}">${l}</th>`).join("")}</tr></thead>
      <tbody>${rows.map(({ p, s }) => `<tr><td><span class="pn">#${p.number} ${esc(p.name)} <small>${p.pos}</small>${p.starter ? '<span class="st">S</span>' : ""}</span></td>${cols.map(([c]) => `<td>${fmtC(c, s[c])}</td>`).join("")}</tr>`).join("")}</tbody>
      <tfoot><tr><td>Team</td>${cols.map(([c]) => `<td>${c === "gp" ? games.length : ["two", "tp", "ft"].includes(c) ? pc(team[c]) : view.per === "p28" ? "–" : n1(team.raw[c] / (view.per === "pg" ? Math.max(1, games.length) : 1))}</td>`).join("")}</tr></tfoot></table></div>`;
  }
  function matchup() {
    const ps = view.mu.map((id) => A.PLAYER[id]), stats = ps.map((p) => line(logsOf(p))), n = ps.length;
    const rows = [["pts", "Points"], ["reb", "Rebounds"], ["ast", "Assists"], ["stl", "Steals"], ["blk", "Blocks"], ["tov", "Turnovers", true], ["tp", "3P%"], ["two", "2P%"], ["ft", "FT%"], ["pir", "PIR"], ["min", "Minutes"]];
    const opts = (sel) => A.CLUBS.map((c) => `<optgroup label="${esc(c.name)}">${roster(c.code).map((p) => `<option value="${p.id}"${p.id === sel ? " selected" : ""}>${esc(p.name)}</option>`).join("")}</optgroup>`).join("");
    return `<div class="head"><h1>Matchup</h1><p>Compare two or three players with the same filters. The best value in each row is highlighted.</p><div style="margin-left:auto;display:flex;gap:8px"><button class="btn ghost" type="button" data-swap>⇄ Swap sides</button>${n < 3 ? `<button class="btn ghost" type="button" data-add3>+ Add third player</button>` : `<button class="btn ghost" type="button" data-rm3>Remove third player</button>`}</div></div>${filters({ noTeam: true })}
      <div class="mu" style="--n:${n}"><div class="mu-head">${ps.map((p, i) => `<div class="mu-p" style="--c:${COLORS[i]}"><b>${esc(p.name)}</b><span class="pn">${crest(p.club, 18)}${esc(CLUB[p.club].name)} · ${p.pos} · ${stats[i].gp} games</span><select data-mu="${i}" aria-label="Player ${i + 1}">${opts(p.id)}</select>${view.mu.filter((x) => x === p.id).length > 1 ? `<span style="color:var(--bad)">Same player on both sides</span>` : ""}</div>`).join("")}</div>
      <div class="card">${rows.map(([k, l, low]) => { const vals = stats.map((s) => s[k]); const mx = Math.max(0.0001, ...vals.map((v) => v || 0)); const best = low ? Math.min(...vals.map((v) => v ?? 99)) : Math.max(...vals.map((v) => v ?? -1));
        return `<div class="mrow" style="--n:${n}"><span class="lab">${l}</span>${vals.map((v, i) => `<div class="mbar" style="--c:${COLORS[i]}"><b class="${v === best && vals.filter((x) => x === best).length === 1 ? "best" : ""}">${["tp", "two", "ft"].includes(k) ? pc(v) : n1(v)}</b><span class="t"><i style="width:${(100 * (v || 0)) / mx}%"></i></span></div>`).join("")}</div>`; }).join("")}</div></div>`;
  }
  function rotation() {
    const games = A.GAMES.filter((g) => g.played && (g.home === view.team || g.away === view.team)).sort((a, b) => a.date.localeCompare(b.date));
    const ros = roster(view.team).map((p) => { const ls = A.gameLogs(p).filter((l) => l.season === "2026-27"); return { p, ls, tot: ls.reduce((s, l) => s + l.min, 0) }; }).sort((a, b) => b.tot - a.tot);
    const col = (m) => (m === 0 ? "#f0f1f6" : `rgba(42,27,120,${0.12 + (0.85 * m) / 38})`);
    return `<div class="head"><h1>Rotation</h1><p>Minutes per player in every game this season. Darker means more minutes; S marks a start, DNP a game on the bench.</p></div>${filters()}
      <div class="card tw"><table class="rot"><thead><tr><th>Player</th><th>Avg</th>${games.map((g) => `<th style="text-align:center" title="${g.home === view.team ? "vs" : "at"} ${esc(CLUB[g.home === view.team ? g.away : g.home].short)} · ${g.date}">${g.round}<br><span style="font-weight:400">${g.home === view.team ? "" : "@"}${(g.home === view.team ? g.away : g.home)}</span></th>`).join("")}</tr></thead>
      <tbody>${ros.map(({ p, ls, tot }) => `<tr><td><span class="pn">#${p.number} ${esc(p.name)}</span></td><td>${(tot / Math.max(1, ls.filter((l) => !l.dnp).length)).toFixed(1)}</td>${games.map((g) => { const l = ls.find((x) => x.date === g.date); if (!l) return `<td class="m"></td>`; return `<td class="m"><span class="cell" style="background:${col(l.min)};color:${l.min > 22 ? "#fff" : "var(--ink)"}" title="${esc(p.name)} · R${g.round}: ${l.dnp ? "did not play" : l.min + " min, " + l.pts + " pts"}">${l.dnp ? "DNP" : l.min + (l.starter ? "<sup>S</sup>" : "")}</span></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  function lineups() {
    const ros = roster(view.team).map((p) => ({ p, ls: logsOf(p) })).map((x) => ({ ...x, min: x.ls.reduce((s, l) => s + l.min, 0) })).sort((a, b) => b.min - a.min).slice(0, 8);
    if (ros.length < 5 || !ros[4].min) return `<div class="head"><h1>Lineups</h1></div>${filters()}<p class="empty">Not enough games for these filters.</p>`;
    const combos = []; const idx = [0, 1, 2, 3, 4, 5, 6, 7].slice(0, ros.length);
    const rec = (start, pick) => { if (pick.length === 5) { combos.push(pick.slice()); return; } for (let i = start; i < idx.length; i++) { pick.push(i); rec(i + 1, pick); pick.pop(); } }; rec(0, []);
    const R = A.rng(view.team.charCodeAt(0) * 97 + view.team.charCodeAt(2) + view.season.length);
    const lus = combos.map((c) => { const share = c.reduce((s, i) => s * (ros[i].min / Math.max(1, ros[0].min)), 1); const min = Math.round(share * ros[0].min * 0.55 * (0.7 + R.next() * 0.6)); const q = c.reduce((s, i) => s + (ros[i].ls.reduce((a, l) => a + l.pm, 0) / Math.max(1, ros[i].min)), 0); const off = 108 + q * 18 + R.normal(0, 5), def = 108 - q * 10 + R.normal(0, 5); return { c, min, off, def, net: off - def, pm: Math.round(((off - def) * min * 1.9) / 100) }; }).filter((x) => x.min >= 8).sort((a, b) => b.min - a.min).slice(0, 10);
    const teamMin = ros[0].ls.length * 200 || 1;
    const onoff = ros.map(({ p, ls, min }) => { const on = ls.reduce((s, l) => s + l.pm, 0) / Math.max(1, min) * 40; const off = -on * (min / teamMin) * 1.6 + R.normal(0, 2); const fga = ls.reduce((s, l) => s + l.fga + 0.44 * l.fta + l.tov, 0); return { p, min, on, off, usage: fga / Math.max(1, min) * 40 / 0.8 }; });
    const sgn = (v) => `<span class="${v >= 0 ? "pos" : "neg"}">${v >= 0 ? "+" : ""}${v.toFixed(1)}</span>`;
    return `<div class="head"><h1>Lineups</h1><p>The most used five-man units and each player's on/off impact. Ratings are points per 100 possessions.</p></div>${filters()}
      <div class="card tw" style="margin-bottom:14px"><h2>Five-man lineups <small>top 10 by minutes</small></h2><table><thead><tr><th>Lineup</th><th>MIN</th><th>OFF RTG</th><th>DEF RTG</th><th>NET</th><th>+/-</th></tr></thead><tbody>${lus.map((x) => `<tr><td>${x.c.map((i) => esc(ros[i].p.name.split(" ")[1])).join(" · ")}</td><td>${x.min}</td><td>${x.off.toFixed(1)}</td><td>${x.def.toFixed(1)}</td><td>${sgn(x.net)}</td><td>${sgn(x.pm).replace(".0", "")}</td></tr>`).join("")}</tbody></table></div>
      <div class="g2"><div class="card"><h2>On / off court <small>net rating per 40 min</small></h2><div class="on-off"><span class="h">Player</span><span class="h">On</span><span class="h">Off</span><span class="h">Diff</span></div>${onoff.map((x) => `<div class="on-off"><span class="pn">${esc(x.p.name)}</span><span>${sgn(x.on)}</span><span>${sgn(x.off)}</span><span>${sgn(x.on - x.off)}</span></div>`).join("")}</div>
        <div class="card"><h2>Usage <small>share of possessions used while on court</small></h2>${onoff.slice().sort((a, b) => b.usage - a.usage).map((x) => `<div class="mbar" style="--c:var(--accent);grid-template-columns:150px 52px minmax(0,1fr);margin:6px 0"><span class="pn" style="overflow:hidden;text-overflow:ellipsis">${esc(x.p.name)}</span><b>${x.usage.toFixed(1)}%</b><span class="t"><i style="width:${Math.min(100, x.usage * 3)}%"></i></span></div>`).join("")}</div></div>`;
  }
  // ---------- live ----------
  const liveGames = () => A.gamesOf("L", A.SEASON.next.L).concat(A.gamesOf("C", A.SEASON.next.C)).slice(0, 8);
  function simulate(g) {
    const r = A.rng(g.code * 7 + (g.comp === "C" ? 3 : 0)), ev = [], hp = roster(g.home).filter((p) => p.tier >= 0.6), ap = roster(g.away).filter((p) => p.tier >= 0.6);
    let hs = 0, as = 0, t = 0, poss = 0;
    while (t < 2400) { const home = poss % 2 === 0, P = r.pick(home ? hp : ap), x = r.next(); t += r.int(10, 22); if (t > 2400) break; poss++;
      const q = Math.min(4, Math.floor(t / 600) + 1), clock = 600 - (t % 600), cl = `${String(Math.floor(clock / 60)).padStart(2, "0")}:${String(clock % 60).padStart(2, "0")}`;
      let pts = 0, d;
      if (x < 0.3) { pts = 2; d = `${P.name} makes a two-pointer`; } else if (x < 0.43) { pts = 3; d = `${P.name} hits a three`; } else if (x < 0.52) { pts = r.int(1, 2); d = `${P.name} makes ${pts} of 2 free throws`; } else if (x < 0.66) d = `${P.name} misses a three`; else if (x < 0.8) d = `${P.name} misses a jumper`; else if (x < 0.92) d = `Turnover by ${P.name}`; else d = `Offensive foul on ${P.name}`;
      if (home) hs += pts; else as += pts; ev.push({ t, q, cl, team: home ? g.home : g.away, d, pts, hs, as }); }
    return ev;
  }
  let liveTimer = null, liveStart = 0;
  function livePage() {
    if (!view.liveId) return `<div class="head"><h1>Live</h1><p>Today's games. In the real app the feed comes from the official play-by-play; here a simulated game runs at 40× speed.</p></div>
      <form class="opener" id="open"><input id="code" placeholder="Open a game by code, e.g. ${liveGames()[0].id}" aria-label="Game code" style="min-width:300px"><button class="btn" type="submit">Open game</button><span class="err">${esc(view.liveErr)}</span></form>
      <div class="live-list">${liveGames().map((g) => `<button class="lg" type="button" data-live="${g.id}"><small>${A.COMPS[g.comp].name} · round ${g.round} · ${g.id}</small><span class="row"><span class="pn">${crest(g.home, 24)}${esc(CLUB[g.home].short)}</span><b>–</b></span><span class="row"><span class="pn">${crest(g.away, 24)}${esc(CLUB[g.away].short)}</span><b>–</b></span><small>${A.dateLong(g.date)} · ${g.tip} · ${esc(g.venue)}</small></button>`).join("")}</div>`;
    const g = A.GAME[view.liveId], all = simulate(g), elapsed = Math.min(2400, ((Date.now() - liveStart) / 1000) * 40 + 420), ev = all.filter((e) => e.t <= elapsed), last = ev.at(-1) || { hs: 0, as: 0 };
    const q = Math.min(4, Math.floor(elapsed / 600) + 1), clock = elapsed >= 2400 ? 0 : 600 - Math.floor(elapsed % 600);
    const W = 800, H = 170, x = (t) => 30 + (t / 2400) * (W - 40), mx = Math.max(10, ...all.map((e) => Math.abs(e.hs - e.as))), y = (m) => H / 2 - (m / mx) * (H / 2 - 14);
    const path = ev.map((e, i) => `${i ? "L" : "M"}${x(e.t).toFixed(1)},${y(e.hs - e.as).toFixed(1)}`).join(" ");
    const box = (team) => { const by = {}; ev.filter((e) => e.team === team && e.pts).forEach((e) => { const n = e.d.split(" makes")[0].split(" hits")[0]; by[n] = (by[n] || 0) + e.pts; }); return Object.entries(by).sort((a, b) => b[1] - a[1]).slice(0, 6); };
    return `<button class="btn ghost" type="button" data-live-close>← Today's games</button><div style="height:12px"></div>
      <div class="scb"><div class="tm">${crest(g.home, 44)}${esc(CLUB[g.home].short)}<b>${last.hs}</b></div><div class="clock">${elapsed >= 2400 ? `<span class="livebadge" style="background:#6b7088">FINAL</span>` : `<span class="livebadge">LIVE</span>`}<b>Q${q} ${String(Math.floor(clock / 60)).padStart(2, "0")}:${String(clock % 60).padStart(2, "0")}</b><span>${esc(g.venue)}</span></div><div class="tm r"><b>${last.as}</b>${esc(CLUB[g.away].short)}${crest(g.away, 44)}</div></div>
      <div class="card" style="margin-bottom:14px"><h2>Timeline <small>score margin, ${esc(CLUB[g.home].short)} above the line</small></h2><svg class="tl" viewBox="0 0 ${W} ${H}" role="img" aria-label="Score margin over time"><line x1="30" x2="${W - 10}" y1="${H / 2}" y2="${H / 2}" stroke="#e3e5ee"/>${[1, 2, 3].map((k) => `<line x1="${x(k * 600)}" x2="${x(k * 600)}" y1="6" y2="${H - 6}" stroke="#eef0f6" stroke-dasharray="4 4"/>`).join("")}${[1, 2, 3, 4].map((k) => `<text x="${x(k * 600 - 300)}" y="${H - 2}" font-size="11" text-anchor="middle" fill="#6b7088">Q${k}</text>`).join("")}<path d="${path}" fill="none" stroke="#f05a28" stroke-width="2.5"/></svg></div>
      <div class="g2"><div class="card"><h2>Play by play <small>${ev.length} events</small></h2><div class="pbp">${ev.slice().reverse().slice(0, 60).map((e) => `<div class="ev ${e.pts ? "sc" : ""}"><span class="t">Q${e.q} ${e.cl}</span>${crest(e.team, 22)}<span class="d">${esc(e.d)}</span><span class="s">${e.hs}–${e.as}</span></div>`).join("")}</div></div>
        <div class="card"><h2>Possessions <small>green scored, grey empty</small></h2>${[g.home, g.away].map((tm) => `<p class="pn" style="margin:6px 0">${crest(tm, 20)}${esc(CLUB[tm].short)} · ${ev.filter((e) => e.team === tm && e.pts).length} of ${ev.filter((e) => e.team === tm).length} scored</p><div class="poss">${ev.filter((e) => e.team === tm).map((e) => `<i style="background:${e.pts === 3 ? "#1f9d63" : e.pts ? "#6fd3a0" : "#e3e5ee"}" title="Q${e.q} ${e.cl}: ${esc(e.d)}"></i>`).join("")}</div>`).join("")}
          <h2 style="margin-top:16px">Top scorers</h2>${[g.home, g.away].map((tm) => `<p style="margin:4px 0"><b>${esc(CLUB[tm].short)}:</b> ${box(tm).map(([n, p]) => `${esc(n)} ${p}`).join(" · ") || "–"}</p>`).join("")}</div></div>`;
  }
  function render() {
    const page = { playbook, matchup, rotation, lineups, live: livePage }[view.page]();
    const keep = app.querySelector(".pbp"); const sTop = keep ? keep.scrollTop : 0;
    app.innerHTML = header() + `<main class="wrap">${page}</main>`;
    if (keep) { const n = app.querySelector(".pbp"); if (n) n.scrollTop = sTop; }
    clearTimeout(liveTimer); if (view.page === "live" && view.liveId) liveTimer = setTimeout(render, 1000);
  }
  app.addEventListener("click", (e) => {
    const d = (s) => e.target.closest(s);
    if (d("[data-page]")) return go({ page: d("[data-page]").dataset.page });
    if (d("[data-mode]")) { const m = d("[data-mode]").dataset.mode; store.set("mode", m); return go(m === "Coach" ? { mode: m, team: view.myTeam, comp: CLUB[view.myTeam].comp } : { mode: m }); }
    if (d("[data-per]")) return go({ per: d("[data-per]").dataset.per });
    if (d("[data-sort]")) return go({ sort: d("[data-sort]").dataset.sort });
    if (d("[data-scout]")) { const t = d("[data-scout]").dataset.scout; return go({ mode: "User", team: t, comp: CLUB[t].comp }); }
    if (d("[data-swap]")) return go({ mu: view.mu.slice().reverse() });
    if (d("[data-add3]")) { const used = new Set(view.mu); return go({ mu: view.mu.concat(A.PLAYERS.find((p) => !used.has(p.id) && p.starter && p.comp === A.PLAYER[view.mu[0]].comp && p.pos === A.PLAYER[view.mu[0]].pos && p.club !== A.PLAYER[view.mu[0]].club).id) }); }
    if (d("[data-rm3]")) return go({ mu: view.mu.slice(0, 2) });
    if (d("[data-live]")) { liveStart = Date.now(); return go({ liveId: d("[data-live]").dataset.live, liveErr: "" }); }
    if (d("[data-live-close]")) return go({ liveId: null });
  });
  app.addEventListener("submit", (e) => { if (e.target.id !== "open") return; e.preventDefault(); const c = app.querySelector("#code").value.trim().toUpperCase(); if (A.GAME[c]) { liveStart = Date.now(); go({ liveId: c, liveErr: "" }); } else go({ liveErr: `No game with code “${c}”. Codes look like ${liveGames()[0].id}.` }); });
  app.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.v) { view[t.dataset.v] = t.value; if (t.dataset.v === "comp") view.team = A.clubsOf(t.value)[0].code; if (t.dataset.v === "team" && view.mode === "Coach") { view.myTeam = t.value; store.set("myTeam", t.value); } return render(); }
    if (t.dataset.mu != null) { const mu = view.mu.slice(); mu[+t.dataset.mu] = t.value; return go({ mu }); }
  });
  render();
  A.ribbon("Coaching Insights", "coaching-insights");
})();
