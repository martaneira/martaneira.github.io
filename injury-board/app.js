/* Injury Board (demo). Clubs log injuries; the board shows only availability (never a diagnosis) for each
   round, team and game, and flags records that need attention. Invented data. */
(function () {
  "use strict";
  const A = window.ATLAS, { esc, fmt, crest, CLUB } = A;
  const app = document.getElementById("app");
  const SPANS = [[8, 25], [10, 30], [4, 12], [3, 10], [8, 24], [6, 12], [18, 40], [7, 21], [12, 35], [2, 6], [6, 20], [10, 30]]; // days out, short to long
  const SEASON_START = A.GAMES.reduce((m, g) => (g.date < m ? g.date : m), "9999");
  const T = A.TODAY;

  // ---------- injuries ----------
  const INJ = [];
  A.PLAYERS.forEach((p) => {
    const r = A.rng(parseInt(p.id.slice(1), 10) * 17 + 3);
    let n = r.chance(0.34) ? (r.chance(0.25) ? 2 : 1) : 0, cursor = SEASON_START;
    for (let i = 0; i < n; i++) {
      const [lo, hi] = r.pick(SPANS), span = A.daysBetween(cursor, T) + 1;
      if (span < 3) break;
      const start = A.addDays(cursor, r.int(0, span - 1)), dur = r.int(lo, hi), ret = A.addDays(start, dur);
      const rec = { id: p.id + "-" + i, player: p.id, club: p.club, start, ret, partial: r.chance(0.45), closed: ret < T, pending: false, playedOut: null };
      if (start <= T && ret > T && r.chance(0.15)) { rec.ret = null; rec.pending = true; }
      if (rec.closed && r.chance(0.07)) rec.closed = false;
      INJ.push(rec); cursor = A.addDays(ret || start, 5);
      if (cursor > A.addDays(T, 5)) break;
    }
  });
  // a few "played while out" records: the club logged an injury but the player appears in a box score inside the window
  const r0 = A.rng(77);
  r0.shuffle(INJ.filter((x) => x.start < T && x.ret && A.daysBetween(x.start, x.ret) > 9)).slice(0, 5).forEach((x) => {
    const g = A.GAMES.find((g) => g.played && (g.home === x.club || g.away === x.club) && g.date > x.start && g.date < x.ret && g.date < T); if (g) x.playedOut = g.id;
  });
  const byPlayer = {}; INJ.forEach((x) => (byPlayer[x.player] = byPlayer[x.player] || []).push(x));
  const injAt = (pid, d) => (byPlayer[pid] || []).find((x) => x.start <= d && (x.ret == null || d < x.ret));
  function statusAt(pid, d) {
    const x = injAt(pid, d); if (!x) return { s: "Available", c: "ok" };
    const left = x.ret ? A.daysBetween(d, x.ret) : 99;
    if (left <= 2) return { s: "In doubt", c: "dtd", x };
    if (x.partial && left <= 7) return { s: "Partial training", c: "part", x };
    return { s: "Out", c: "out", x };
  }
  const unavailable = (st) => st.c === "out" || st.c === "part";
  function cell(p, g) {
    const st = statusAt(p.id, g.date);
    if (g.played) { if (st.x && st.x.playedOut === g.id) return "P"; return unavailable(st) ? "O" : st.c === "dtd" ? "D" : "P"; }
    return unavailable(st) ? "O" : st.c === "dtd" ? "D" : "U";
  }
  const sCell = (st) => `<span class="s ${st.c}">${st.s}</span>`;
  const retTxt = (x) => (x.ret ? A.dateShort(x.ret) : "Pending");

  // ---------- alerts ----------
  function alerts() {
    const out = [];
    INJ.forEach((x) => {
      const p = A.PLAYER[x.player];
      if (x.playedOut) { const g = A.GAME[x.playedOut]; out.push({ k: "Played while out", c: "var(--out)", x, p, txt: `Logged as out but played vs ${CLUB[g.home === p.club ? g.away : g.home].short} on ${A.dateShort(g.date)}.` }); }
      if (x.pending) out.push({ k: "Return date pending", c: "var(--dtd)", x, p, txt: `Out since ${A.dateShort(x.start)}. The club has not given an expected return date.` });
      if (!x.closed && x.ret && x.ret < T) out.push({ k: "Record not closed", c: "var(--navy-2)", x, p, txt: `Expected back ${A.dateShort(x.ret)} but the record is still open.` });
      if (x.partial && x.ret && x.start <= T && x.ret > T && A.daysBetween(T, x.ret) <= 7) out.push({ k: "Partial training only", c: "var(--part)", x, p, txt: `Training with limits until ${A.dateShort(x.ret)}. Check availability before the next game.` });
    });
    return out;
  }
  const ALERTS = alerts();

  let view = { tab: "round", comp: "L", round: A.SEASON.next.L, club: A.clubsOf("L")[0].code, game: null, player: null, q: "", alertK: "" };
  const go = (p) => { Object.assign(view, p); render(); };

  function header() {
    const tabs = [["round", "Round"], ["teams", "Teams"], ["games", "Games"], ["players", "Players"], ["alerts", "Alerts"]];
    return `<header class="top"><div class="in"><span class="brand"><i>+</i>Injury board</span><nav role="tablist">${tabs.map(([k, l]) => `<button type="button" role="tab" data-tab="${k}" aria-selected="${view.tab === k}">${l}${k === "alerts" ? `<span class="n">${ALERTS.length}</span>` : ""}</button>`).join("")}</nav><div class="r"><a href="../hub/">Back to hub</a></div></div></header>`;
  }
  const compSeg = () => `<div class="seg" role="group" aria-label="Competition">${["L", "C"].map((c) => `<button type="button" data-comp="${c}" aria-pressed="${view.comp === c}">${A.COMPS[c].name}</button>`).join("")}</div>`;
  const plRow = (p, right, sub) => `<div class="pl">${crest(p.club, 26)}<div class="nm"><button type="button" data-player="${p.id}">${esc(p.name)}</button><small>${sub}</small></div><div>${right}</div></div>`;

  function round() {
    const games = A.gamesOf(view.comp, view.round), date = games[0].date, week0 = A.addDays(T, -7);
    const clubs = A.clubsOf(view.comp).map((c) => c.code);
    const roster = A.PLAYERS.filter((p) => p.comp === view.comp);
    const forRound = roster.map((p) => ({ p, st: statusAt(p.id, (games.find((g) => g.home === p.club || g.away === p.club) || games[0]).date) }));
    const unav = forRound.filter((x) => unavailable(x.st)), dtd = forRound.filter((x) => x.st.c === "dtd");
    const newly = INJ.filter((x) => CLUB[x.club].comp === view.comp && x.start > week0 && x.start <= T);
    const back = INJ.filter((x) => CLUB[x.club].comp === view.comp && x.ret && x.ret > week0 && x.ret <= T);
    const byTeam = clubs.map((c) => [c, unav.filter((x) => x.p.club === c).length, dtd.filter((x) => x.p.club === c).length]).sort((a, b) => b[1] + b[2] - a[1] - a[2]);
    const mx = Math.max(1, ...byTeam.map((x) => x[1] + x[2]));
    const alertsHere = ALERTS.filter((a) => CLUB[a.p.club].comp === view.comp);
    return `<div class="head"><h1>Round ${view.round}</h1><div class="ctl">${compSeg()}<select data-round aria-label="Round">${Array.from({ length: A.SEASON.next[view.comp] + 3 }, (_, i) => `<option value="${i + 1}"${view.round === i + 1 ? " selected" : ""}>Round ${i + 1}</option>`).join("")}</select><button class="btn ghost no-print" type="button" data-print>Print round sheet</button><button class="btn no-print" type="button" data-csv>Download CSV</button></div>
        <p class="sub">${A.COMPS[view.comp].name} · ${A.dateLong(date)}${games.at(-1).date !== date ? " to " + A.dateLong(games.at(-1).date) : ""} · ${games[0].played ? "played" : "coming up"}</p></div>
      <div class="kpis"><div class="kpi" style="--c:var(--out)"><b>${unav.length}</b><span>Unavailable for this round</span></div><div class="kpi" style="--c:var(--dtd)"><b>${dtd.length}</b><span>In doubt</span></div><div class="kpi" style="--c:var(--accent)"><b>${newly.length}</b><span>Newly unavailable this week</span></div><div class="kpi" style="--c:var(--ok)"><b>${back.length}</b><span>Back available this week</span></div></div>
      <div class="grid3"><div class="card"><h2>This week <small>status changes, last 7 days</small></h2>${[...newly.map((x) => ({ x, d: x.start, a: "ok", b: "out", la: "Available", lb: "Out" })), ...back.map((x) => ({ x, d: x.ret, a: "out", b: "ok", la: "Out", lb: "Available" }))].sort((a, b) => b.d.localeCompare(a.d)).slice(0, 9).map(({ x, d, a, b, la, lb }) => plRow(A.PLAYER[x.player], `<span class="s ${a}">${la}</span><span class="arrow">→</span><span class="s ${b}">${lb}</span>`, `${esc(CLUB[x.club].short)} · ${A.dateShort(d)}`)).join("") || `<p class="empty">No changes this week.</p>`}</div>
        <div class="card"><h2>Newly unavailable</h2>${newly.slice(0, 9).map((x) => plRow(A.PLAYER[x.player], `<span class="s out">Back ${retTxt(x)}</span>`, `${esc(CLUB[x.club].short)} · since ${A.dateShort(x.start)}`)).join("") || `<p class="empty">Nobody new this week.</p>`}</div>
        <div class="card"><h2>Back available</h2>${back.slice(0, 9).map((x) => plRow(A.PLAYER[x.player], `<span class="s ok">Available</span>`, `${esc(CLUB[x.club].short)} · ${A.daysBetween(x.start, x.ret)} days out`)).join("") || `<p class="empty">Nobody back this week.</p>`}</div></div>
      <div class="grid2"><div class="card"><h2>Unavailable by team <small>for this round</small></h2><div class="bars">${byTeam.map(([c, o, d]) => `<div class="row"><span>${crest(c, 18)}${esc(CLUB[c].short)}</span><span class="t"><i style="width:${(100 * o) / mx}%;background:var(--out)"></i><i style="width:${(100 * d) / mx}%;background:var(--dtd)"></i></span><span>${o + d}</span></div>`).join("")}</div><div class="legend"><span><i class="sq O"></i>Out or partial training</span><span><i class="sq D"></i>In doubt</span></div></div>
        <div class="card"><h2>Unavailable list <small>${unav.length + dtd.length} players</small></h2><div class="tw"><table><thead><tr><th>Player</th><th>Team</th><th>Status</th><th>Since</th><th>Back</th></tr></thead><tbody>${[...unav, ...dtd].sort((a, b) => a.p.club.localeCompare(b.p.club)).map(({ p, st }) => `<tr><td><button class="linkish" type="button" data-player="${p.id}" style="border:0;background:none;font:700 14px var(--body);color:var(--navy);cursor:pointer;padding:0">${esc(p.name)}</button></td><td><span class="team">${crest(p.club, 18)}${esc(CLUB[p.club].short)}</span></td><td>${sCell(st)}</td><td>${A.dateShort(st.x.start)}</td><td>${retTxt(st.x)}</td></tr>`).join("")}</tbody></table></div></div></div>
      ${alertsHere.length ? `<div class="card no-print"><h2>Open alerts <small>${alertsHere.length}</small></h2>${alertsHere.slice(0, 4).map(alertRow).join("")}<button class="btn ghost" type="button" data-tab="alerts" style="margin-top:10px">See all alerts</button></div>` : ""}`;
  }
  function teams() {
    const c = CLUB[view.club], roster = A.PLAYERS.filter((p) => p.club === c.code).sort((a, b) => b.tier - a.tier);
    const games = A.GAMES.filter((g) => g.home === c.code || g.away === c.code).sort((a, b) => a.date.localeCompare(b.date)).filter((g) => g.round <= A.SEASON.next[c.comp] + 4);
    return `<div class="head"><h1><span class="team">${crest(c.code, 40)}${esc(c.name)}</span></h1><div class="ctl">${compSeg()}<select data-club aria-label="Team">${A.clubsOf(view.comp).map((x) => `<option value="${x.code}"${x.code === c.code ? " selected" : ""}>${esc(x.name)}</option>`).join("")}</select></div><p class="sub">Today's status for every player, and their availability for each game of the season.</p></div>
      <div class="card"><h2>Season availability <small>${games.filter((g) => g.played).length} played · next ${games.filter((g) => !g.played).length}</small></h2><div class="legend"><span><i class="sq P"></i>Played</span><span><i class="sq O"></i>Out</span><span><i class="sq D"></i>In doubt</span><span><i class="sq U"></i>Upcoming</span></div>
      <div class="tw"><table class="avail"><thead><tr><th>Player</th><th>Status today</th><th>Back</th>${games.map((g) => `<th class="g" title="${g.home === c.code ? "vs" : "at"} ${esc(CLUB[g.home === c.code ? g.away : g.home].short)} · ${g.date}">${g.round}</th>`).join("")}</tr></thead>
      <tbody>${roster.map((p) => { const st = statusAt(p.id, T); return `<tr><td><button type="button" data-player="${p.id}" style="border:0;background:none;font:700 14px var(--body);color:var(--navy);cursor:pointer;padding:0">#${p.number} ${esc(p.name)}</button></td><td>${sCell(st)}</td><td>${st.x ? retTxt(st.x) : "–"}</td>${games.map((g) => { const k = cell(p, g); return `<td class="g"><i class="sq ${k}" title="R${g.round} ${g.date}: ${{ P: "Played", O: "Out", D: "In doubt", U: "Upcoming" }[k]}"></i></td>`; }).join("")}</tr>`; }).join("")}</tbody></table></div></div>`;
  }
  function games() {
    const list = A.gamesOf(view.comp, view.round), g = A.GAME[view.game] && A.GAME[view.game].comp === view.comp && A.GAME[view.game].round === view.round ? A.GAME[view.game] : list[0];
    const side = (code) => { const ros = A.PLAYERS.filter((p) => p.club === code).map((p) => ({ p, st: statusAt(p.id, g.date) })).sort((a, b) => (a.st.c === "ok") - (b.st.c === "ok") || b.p.tier - a.p.tier);
      const n = ros.filter((x) => unavailable(x.st)).length; return `<div class="card"><h2><span class="team">${crest(code, 30)}${esc(CLUB[code].name)}</span><small>${ros.length - n} of ${ros.length} available</small></h2>${ros.map(({ p, st }) => plRow(p, sCell(st), `#${p.number} · ${p.pos}${st.x ? " · back " + retTxt(st.x) : ""}`)).join("")}</div>`; };
    return `<div class="head"><h1>Game sheet</h1><div class="ctl">${compSeg()}<select data-round aria-label="Round">${Array.from({ length: A.SEASON.next[view.comp] + 3 }, (_, i) => `<option value="${i + 1}"${view.round === i + 1 ? " selected" : ""}>Round ${i + 1}</option>`).join("")}</select><select data-game aria-label="Game">${list.map((x) => `<option value="${x.id}"${x.id === g.id ? " selected" : ""}>${esc(CLUB[x.home].short)} vs ${esc(CLUB[x.away].short)}</option>`).join("")}</select></div></div>
      <div class="card" style="margin-bottom:14px"><div class="gameh">${crest(g.home, 44)}<b>${esc(CLUB[g.home].short)} ${g.played ? `${g.hs}–${g.as}` : "vs"} ${esc(CLUB[g.away].short)}</b>${crest(g.away, 44)}<span style="color:var(--muted)">${A.dateLong(g.date)} · ${g.tip} · ${esc(g.venue)}</span></div></div>
      <div class="grid2">${side(g.home)}${side(g.away)}</div>`;
  }
  function players() {
    const q = view.q.toLowerCase(), list = A.PLAYERS.filter((p) => p.comp === view.comp && (!q || p.name.toLowerCase().includes(q) || CLUB[p.club].name.toLowerCase().includes(q))).sort((a, b) => (byPlayer[b.id] ? 1 : 0) - (byPlayer[a.id] ? 1 : 0) || a.name.localeCompare(b.name));
    const p = A.PLAYER[view.player] || list[0];
    let prof = "";
    if (p) {
      const inj = (byPlayer[p.id] || []).slice().sort((a, b) => b.start.localeCompare(a.start)), st = statusAt(p.id, T);
      const clubGames = A.GAMES.filter((g) => g.played && (g.home === p.club || g.away === p.club));
      const missed = clubGames.filter((g) => cell(p, g) === "O").length;
      prof = `<div class="card"><div class="ptop"><span class="avatar">${A.initials(p.name)}</span><div><h2 style="font-size:30px;margin:0">${esc(p.name)}</h2><span class="team">${crest(p.club, 20)}${esc(CLUB[p.club].name)}</span> · #${p.number} · ${p.pos} · ${p.height} cm · ${p.nat}</div><div style="margin-left:auto;text-align:right">${sCell(st)}<div style="color:var(--muted);font-size:14px;margin-top:6px">${missed} of ${clubGames.length} games missed this season</div></div></div>
        <h2 style="font-size:20px">Availability history</h2>${inj.length ? `<div class="tl">${inj.map((x) => `<div class="ev" style="--c:${x.ret && x.ret <= T ? "var(--ok)" : "var(--out)"}"><b>Unavailable</b><span>${A.dateLong(x.start)} → ${x.ret ? A.dateLong(x.ret) : "return date pending"} · ${x.ret ? A.daysBetween(x.start, x.ret) + " days" : "open"}${x.closed ? " · closed" : " · open record"}</span></div>`).join("")}</div>` : `<p class="empty">Available all season.</p>`}</div>`;
    }
    return `<div class="head"><h1>Players</h1><div class="ctl">${compSeg()}</div></div><div class="two-col"><div class="card"><input type="search" id="pq" placeholder="Search player or team" value="${esc(view.q)}" style="width:100%;margin-bottom:8px" aria-label="Search players"><div class="plist">${list.slice(0, 80).map((x) => { const st = statusAt(x.id, T); return `<button type="button" data-player="${x.id}" aria-current="${p && x.id === p.id}">${crest(x.club, 18)}${esc(x.name)}${st.c !== "ok" ? sCell(st) : ""}</button>`; }).join("")}</div></div>${prof}</div>`;
  }
  const alertRow = (a) => `<div class="alert" style="--c:${a.c}"><div><b>${a.k} · ${esc(a.p.name)} <span class="team" style="font-weight:600">(${esc(CLUB[a.p.club].short)})</span></b><span>${a.txt}</span></div><button class="btn ghost" type="button" data-player="${a.p.id}">Open player</button></div>`;
  function alertsPage() {
    const kinds = ["Played while out", "Partial training only", "Return date pending", "Record not closed"];
    const list = ALERTS.filter((a) => CLUB[a.p.club].comp === view.comp && (!view.alertK || a.k === view.alertK));
    return `<div class="head"><h1>Alerts</h1><div class="ctl">${compSeg()}</div><p class="sub">Records the medical desk should check: inconsistencies between the injury log and the box scores, and records left open.</p></div>
      <div class="kpis">${kinds.map((k, i) => `<button class="kpi" type="button" data-alertk="${k}" aria-pressed="${view.alertK === k}" style="--c:${["var(--out)", "var(--part)", "var(--dtd)", "var(--navy-2)"][i]};text-align:left;cursor:pointer;font:inherit;color:inherit${view.alertK === k ? ";box-shadow:0 0 0 2px var(--navy)" : ""}"><b>${ALERTS.filter((a) => a.k === k && CLUB[a.p.club].comp === view.comp).length}</b><span>${k}</span></button>`).join("")}</div>
      <div class="card">${list.map(alertRow).join("") || `<p class="empty">No alerts.</p>`}</div>`;
  }
  function render() {
    const page = { round, teams, games, players, alerts: alertsPage }[view.tab]();
    app.innerHTML = header() + `<main class="wrap">${page}</main>`;
    const pq = app.querySelector("#pq"); if (pq && view.focusQ) { pq.focus(); pq.setSelectionRange(pq.value.length, pq.value.length); view.focusQ = false; }
  }
  app.addEventListener("click", (e) => {
    const d = (s) => e.target.closest(s);
    if (d("[data-tab]")) return go({ tab: d("[data-tab]").dataset.tab });
    if (d("[data-comp]")) { const c = d("[data-comp]").dataset.comp; return go({ comp: c, round: Math.min(view.round, A.SEASON.next[c] + 3), club: A.clubsOf(c)[0].code, player: null, game: null }); }
    if (d("[data-player]")) { const id = d("[data-player]").dataset.player; window.scrollTo(0, 0); return go({ tab: "players", player: id, comp: A.PLAYER[id].comp }); }
    if (d("[data-alertk]")) { const k = d("[data-alertk]").dataset.alertk; return go({ alertK: view.alertK === k ? "" : k }); }
    if (d("[data-print]")) return window.print();
    if (d("[data-csv]")) {
      const games = A.gamesOf(view.comp, view.round);
      const rows = [["round", "team", "player", "number", "status", "since", "expected_return"]];
      A.PLAYERS.filter((p) => p.comp === view.comp).forEach((p) => { const g = games.find((x) => x.home === p.club || x.away === p.club); if (!g) return; const st = statusAt(p.id, g.date); if (st.c !== "ok") rows.push([view.round, CLUB[p.club].name, p.name, p.number, st.s, st.x.start, st.x.ret || "pending"]); });
      return A.download(`injury_board_${view.comp}_round_${view.round}.csv`, A.toCSV(rows));
    }
  });
  app.addEventListener("change", (e) => {
    const t = e.target;
    if (t.matches("[data-round]")) return go({ round: +t.value, game: null });
    if (t.matches("[data-club]")) return go({ club: t.value });
    if (t.matches("[data-game]")) return go({ game: t.value });
  });
  app.addEventListener("input", (e) => { if (e.target.id === "pq") { view.q = e.target.value; view.focusQ = true; render(); } });
  render();
  A.ribbon("Injury Board", "injury-board");
})();
