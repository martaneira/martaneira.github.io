/* Referee Explorer (demo). Every referee assignment of both competitions since 2000-01, with filters,
   a games-per-season timeline, four views and referee/team profiles. Invented data from ../shared/atlas.js. */
(function () {
  "use strict";
  const A = window.ATLAS, { esc, fmt, crest, CLUB, REF } = A;
  const $ = (id) => document.getElementById(id);
  const store = A.store("referee-explorer");

  // ---------- data: history + this season ----------
  const ALL = A.HISTORY.concat(A.GAMES.map((g) => ({ comp: g.comp, season: A.SEASON.label, year: A.SEASON.year, code: g.code, phase: "Regular Season", round: g.round, home: g.home, away: g.away, date: g.date, hs: g.hs, as: g.as, venue: g.venue, refs: g.refs })));
  ALL.forEach((g, i) => (g.i = i));
  const YEARS = [...new Set(ALL.map((g) => g.year))].sort((a, b) => a - b);
  const PHASES = ["Regular Season", "Play-In", "Playoffs", "Final Four"];

  const blank = () => ({ comp: "all", yFrom: YEARS[0], yTo: YEARS[YEARS.length - 1], phases: [], rFrom: "", rTo: "", pos: "any", ref: "", teams: [], h2h: false, side: "any", dFrom: "", dTo: "", played: true, tab: "games", sort: "desc", page: 0 });
  let st = Object.assign(blank(), store.get("state", {}));
  const save = () => store.set("state", st);

  // ---------- filtering ----------
  function filtered() {
    const teams = new Set(st.teams), ph = new Set(st.phases);
    return ALL.filter((g) => {
      if (st.comp !== "all" && g.comp !== st.comp) return false;
      if (g.year < st.yFrom || g.year > st.yTo) return false;
      if (ph.size && !ph.has(g.phase)) return false;
      if (st.rFrom && g.round < +st.rFrom) return false;
      if (st.rTo && g.round > +st.rTo) return false;
      if (st.dFrom && g.date < st.dFrom) return false;
      if (st.dTo && g.date > st.dTo) return false;
      if (st.played && !g.refs) return false;
      if (st.ref) {
        if (!g.refs) return false;
        const at = g.refs.indexOf(st.ref);
        if (at < 0 || (st.pos !== "any" && at !== +st.pos)) return false;
      }
      if (teams.size) {
        if (st.h2h && teams.size >= 2) { if (!(teams.has(g.home) && teams.has(g.away))) return false; }
        else if (!((st.side !== "away" && teams.has(g.home)) || (st.side !== "home" && teams.has(g.away)))) return false;
      }
      return true;
    });
  }

  // ---------- rendering ----------
  function renderComp() {
    $("compSwitch").innerHTML = [["all", "Both"], ["L", "Atlas League"], ["C", "Atlas Cup"]].map(([c, l]) => `<button type="button" data-c="${c}" aria-pressed="${st.comp === c}">${l}</button>`).join("");
  }
  function renderRail() {
    const refs = A.REFEREES.slice().sort((a, b) => a.name.localeCompare(b.name));
    const clubs = A.CLUBS.filter((c) => st.comp === "all" || c.comp === st.comp);
    const yOpt = (sel) => YEARS.map((y) => `<option value="${y}"${y === sel ? " selected" : ""}>${A.seasonLabel(y)}</option>`).join("");
    const canH2H = st.teams.length >= 2;
    $("rail").innerHTML = `
      <h3>Seasons</h3>
      <div class="row2"><div><label for="yFrom">From</label><select id="yFrom">${yOpt(st.yFrom)}</select></div><div><label for="yTo">To</label><select id="yTo">${yOpt(st.yTo)}</select></div></div>
      <div class="seg"><button type="button" data-last="5">Last 5</button><button type="button" data-last="10">Last 10</button><button type="button" data-last="all">All</button></div>
      <h3>Phase</h3>
      <div class="seg">${PHASES.map((p) => `<button type="button" data-phase="${p}" aria-pressed="${st.phases.includes(p)}">${p}</button>`).join("")}</div>
      <div class="row2"><div><label for="rFrom">From round</label><input id="rFrom" type="number" min="1" max="34" value="${st.rFrom}"></div><div><label for="rTo">To round</label><input id="rTo" type="number" min="1" max="34" value="${st.rTo}"></div></div>
      <h3>Referee</h3>
      <label for="ref">Referee</label><select id="ref"><option value="">Any referee</option>${refs.map((r) => `<option value="${r.id}"${r.id === st.ref ? " selected" : ""}>${esc(r.name)} · ${r.country}</option>`).join("")}</select>
      <label for="pos">Referee position</label><select id="pos"${st.ref ? "" : " disabled"}><option value="any">Any position</option>${A.POSITIONS.map((p, i) => `<option value="${i}"${String(i) === st.pos ? " selected" : ""}>${p}</option>`).join("")}</select>
      <h3>Teams</h3>
      <div class="teamlist">${clubs.map((c) => `<button type="button" data-team="${c.code}" aria-pressed="${st.teams.includes(c.code)}" title="${esc(c.name)}">${crest(c.code, 18)}${c.code}</button>`).join("")}</div>
      <label class="check${canH2H ? "" : " off"}"><input type="checkbox" id="h2h"${st.h2h && canH2H ? " checked" : ""}${canH2H ? "" : " disabled"}> Head to head</label>
      <label for="side">Team plays</label><select id="side"${st.h2h && canH2H ? " disabled" : ""}>${[["any", "Home or away"], ["home", "Home"], ["away", "Away"]].map(([v, l]) => `<option value="${v}"${v === st.side ? " selected" : ""}>${l}</option>`).join("")}</select>
      <h3>Dates and more</h3>
      <div class="row2"><div><label for="dFrom">From date</label><input id="dFrom" type="date" value="${st.dFrom}"></div><div><label for="dTo">To date</label><input id="dTo" type="date" value="${st.dTo}"></div></div>
      <label class="check"><input type="checkbox" id="played"${st.played ? " checked" : ""}> Played only</label>
      <button class="btn clear-all" type="button" id="clearAll">Clear all</button>`;
  }
  function chips() {
    const c = [];
    if (st.comp !== "all") c.push(["comp", A.COMPS[st.comp].name]);
    if (st.yFrom !== YEARS[0] || st.yTo !== YEARS[YEARS.length - 1]) c.push(["years", st.yFrom === st.yTo ? A.seasonLabel(st.yFrom) : `${A.seasonLabel(st.yFrom)} to ${A.seasonLabel(st.yTo)}`]);
    st.phases.forEach((p) => c.push(["phase:" + p, p]));
    if (st.rFrom || st.rTo) c.push(["rounds", `Rounds ${st.rFrom || 1}–${st.rTo || 34}`]);
    if (st.ref) c.push(["ref", REF[st.ref].name + (st.pos !== "any" ? " as " + A.POSITIONS[+st.pos].toLowerCase() : "")]);
    st.teams.forEach((t) => c.push(["team:" + t, CLUB[t].name]));
    if (st.h2h && st.teams.length >= 2) c.push(["h2h", "Head to head"]);
    if (st.side !== "any" && !(st.h2h && st.teams.length >= 2)) c.push(["side", st.side === "home" ? "At home" : "Away"]);
    if (st.dFrom || st.dTo) c.push(["dates", `${st.dFrom || "…"} → ${st.dTo || "…"}`]);
    $("chips").innerHTML = c.map(([k, l]) => `<span class="chip">${esc(l)}<button type="button" data-chip="${esc(k)}" aria-label="Remove ${esc(l)}">×</button></span>`).join("");
  }
  function kpis(list) {
    const played = list.filter((g) => g.hs != null);
    const hw = played.filter((g) => g.hs > g.as).length;
    const ppg = played.length ? played.reduce((s, g) => s + g.hs + g.as, 0) / played.length : 0;
    $("kpis").innerHTML = `<div><b>${fmt(list.length)}</b><span>Games</span></div><div><b>${new Set(list.map((g) => g.year)).size}</b><span>Seasons</span></div><div><b>${played.length ? Math.round((100 * hw) / played.length) : 0}%</b><span>Home team wins</span></div><div><b>${ppg.toFixed(1)}</b><span>Points per game</span></div>`;
  }
  function timeline(list) {
    const by = {}; YEARS.forEach((y) => (by[y] = { L: 0, C: 0 }));
    list.forEach((g) => by[g.year][g.comp]++);
    const max = Math.max(1, ...YEARS.map((y) => by[y].L + by[y].C));
    const one = st.yFrom === st.yTo;
    $("timeline").innerHTML = `<div class="bars">${YEARS.map((y) => `<button type="button" data-year="${y}" class="${one && y !== st.yFrom ? "dim" : ""}" title="${A.seasonLabel(y)}: ${by[y].L + by[y].C} games"><i class="l" style="height:${(100 * by[y].L) / max}%"></i><i class="c" style="height:${(100 * by[y].C) / max}%"></i></button>`).join("")}</div>
      <div class="axis">${YEARS.map((y, i) => `<span>${i % 3 === 0 || i === YEARS.length - 1 ? "'" + String(y).slice(2) : ""}</span>`).join("")}</div>`;
  }
  const teamCell = (c) => `<span class="team">${crest(c, 22)}${esc(CLUB[c].short)}</span>`;
  const refBtn = (id) => `<button type="button" class="ref${id === st.ref ? " hl" : ""}" data-ref="${id}">${esc(REF[id].name)}</button>`;
  function gamesView(list) {
    const rows = list.slice().sort((a, b) => (st.sort === "asc" ? a.date.localeCompare(b.date) : b.date.localeCompare(a.date)) || a.code - b.code);
    const PER = 40, pages = Math.max(1, Math.ceil(rows.length / PER));
    st.page = Math.min(st.page, pages - 1);
    const slice = rows.slice(st.page * PER, st.page * PER + PER);
    return `<div class="tw"><table><thead><tr><th>Date</th><th>Comp.</th><th>Season</th><th>Phase</th><th>Rd</th><th>Home</th><th>Score</th><th>Away</th><th>Crew chief</th><th>Umpire 1</th><th>Umpire 2</th></tr></thead><tbody>${
      slice.map((g) => `<tr><td>${A.dateShort(g.date)} ${g.date.slice(0, 4)}</td><td><span class="tag ${g.comp}">${g.comp === "L" ? "League" : "Cup"}</span></td><td>${g.season}</td><td>${g.phase === "Final Four" ? '<span class="tag ff">Final Four</span>' : g.phase}</td><td>${g.round}</td><td>${teamCell(g.home)}</td><td class="score">${g.hs == null ? '<span class="tag">Upcoming</span>' : `<b class="${g.hs > g.as ? "w" : "lo"}">${g.hs}</b>–<b class="${g.as > g.hs ? "w" : "lo"}">${g.as}</b>`}</td><td>${teamCell(g.away)}</td>${g.refs ? g.refs.map((r) => `<td>${refBtn(r)}</td>`).join("") : '<td colspan="3" style="color:var(--dim)">Not assigned yet</td>'}</tr>`).join("") || `<tr><td colspan="11" class="empty">No games match these filters. Remove a filter above.</td></tr>`
    }</tbody></table></div>
    <div class="pager"><span>${rows.length ? `${fmt(st.page * PER + 1)}–${fmt(st.page * PER + slice.length)} of ${fmt(rows.length)} games` : "0 games"}</span><span><button class="btn" type="button" data-page="0"${st.page === 0 ? " disabled" : ""}>First</button> <button class="btn" type="button" data-page="${st.page - 1}"${st.page === 0 ? " disabled" : ""}>Previous</button> <button class="btn" type="button" data-page="${st.page + 1}"${st.page >= pages - 1 ? " disabled" : ""}>Next</button></span></div>`;
  }
  function refTable(list) {
    const m = {};
    list.forEach((g) => (g.refs || []).forEach((r, i) => {
      if (st.pos !== "any" && i !== +st.pos && !st.ref) return;
      const x = (m[r] = m[r] || { id: r, n: 0, pos: [0, 0, 0], hw: 0, played: 0, first: g.date, last: g.date });
      x.n++; x.pos[i]++; if (g.hs != null) { x.played++; if (g.hs > g.as) x.hw++; }
      if (g.date < x.first) x.first = g.date; if (g.date > x.last) x.last = g.date;
    }));
    const rows = Object.values(m).sort((a, b) => b.n - a.n);
    const max = rows[0] ? rows[0].n : 1;
    return `<div class="tw"><table><thead><tr><th>Referee</th><th>Country</th><th>Games</th><th></th><th>Crew chief</th><th>Umpire 1</th><th>Umpire 2</th><th>Home wins</th><th>First game</th><th>Last game</th></tr></thead><tbody>${
      rows.map((x) => `<tr><td>${refBtn(x.id)}</td><td>${REF[x.id].country}</td><td>${fmt(x.n)}</td><td><div class="mini"><i style="width:${(100 * x.n) / max}%"></i></div></td><td>${x.pos[0]}</td><td>${x.pos[1]}</td><td>${x.pos[2]}</td><td>${x.played ? Math.round((100 * x.hw) / x.played) : 0}%</td><td>${x.first}</td><td>${x.last}</td></tr>`).join("") || `<tr><td colspan="10" class="empty">No referees for these filters.</td></tr>`}</tbody></table></div>`;
  }
  function teamTable(list) {
    const m = {};
    list.forEach((g) => [g.home, g.away].forEach((t) => {
      const x = (m[t] = m[t] || { t, n: 0, w: 0, hn: 0, hw: 0, refs: {} });
      x.n++; if (g.hs != null) { const won = (t === g.home) === g.hs > g.as; if (won) x.w++; if (t === g.home) { x.hn++; if (won) x.hw++; } }
      (g.refs || []).forEach((r) => (x.refs[r] = (x.refs[r] || 0) + 1));
    }));
    const rows = Object.values(m).sort((a, b) => b.n - a.n);
    return `<div class="tw"><table><thead><tr><th>Team</th><th>Comp.</th><th>Games</th><th>Record</th><th>Win rate</th><th>Home win rate</th><th>Most reffed by</th></tr></thead><tbody>${
      rows.map((x) => { const top = Object.entries(x.refs).sort((a, b) => b[1] - a[1])[0]; return `<tr><td><button type="button" class="ref" data-team-open="${x.t}">${teamCell(x.t)}</button></td><td><span class="tag ${CLUB[x.t].comp}">${CLUB[x.t].comp === "L" ? "League" : "Cup"}</span></td><td>${x.n}</td><td>${x.w}–${x.n - x.w}</td><td>${x.n ? Math.round((100 * x.w) / x.n) : 0}%</td><td>${x.hn ? Math.round((100 * x.hw) / x.hn) : 0}%</td><td>${top ? `${refBtn(top[0])} <span style="color:var(--dim)">${top[1]}</span>` : "–"}</td></tr>`; }).join("") || `<tr><td colspan="7" class="empty">No teams for these filters.</td></tr>`}</tbody></table></div>`;
  }
  function matrix(list) {
    const teamCount = {}, refCount = {}, cell = {};
    list.forEach((g) => (g.refs || []).forEach((r) => [g.home, g.away].forEach((t) => { teamCount[t] = (teamCount[t] || 0) + 1; refCount[r] = (refCount[r] || 0) + 1; cell[r + t] = (cell[r + t] || 0) + 1; })));
    const teams = (st.teams.length ? st.teams : Object.entries(teamCount).sort((a, b) => b[1] - a[1]).map((x) => x[0])).slice(0, 12);
    const refs = Object.entries(refCount).sort((a, b) => b[1] - a[1]).slice(0, 15).map((x) => x[0]);
    const max = Math.max(1, ...refs.flatMap((r) => teams.map((t) => cell[r + t] || 0)));
    if (!refs.length) return `<div class="empty">No referee data for these filters.</div>`;
    return `<p style="margin:0 0 10px;color:var(--muted);font-size:13px">Games each referee worked with each team. Pick teams in the filters to choose the columns.</p><div class="tw" style="margin:0"><table class="matrix"><thead><tr><th>Referee</th>${teams.map((t) => `<th style="text-align:center">${crest(t, 20)}</th>`).join("")}</tr></thead><tbody>${refs.map((r) => `<tr><td>${refBtn(r)}</td>${teams.map((t) => { const v = cell[r + t] || 0; const a = v / max; return `<td class="h" style="background:rgba(240,90,40,${(0.08 + a * 0.85).toFixed(2)});color:${a > 0.45 ? "#fff" : "var(--muted)"}">${v || ""}</td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  function render() {
    save();
    renderComp(); renderRail(); chips();
    const list = filtered();
    kpis(list); timeline(list);
    const refsN = new Set(list.flatMap((g) => g.refs || [])).size, teamsN = new Set(list.flatMap((g) => [g.home, g.away])).size;
    $("tabs").innerHTML = [["games", "Games", list.length], ["refs", "Referees", refsN], ["teams", "Teams", teamsN], ["matrix", "Referee × Team", null]].map(([k, l, n]) => `<button class="tab" role="tab" type="button" data-tab="${k}" aria-selected="${st.tab === k}">${l}${n != null ? `<span class="n">${fmt(n)}</span>` : ""}</button>`).join("");
    $("sort").style.display = st.tab === "games" ? "" : "none"; $("sort").value = st.sort;
    $("view").innerHTML = st.tab === "games" ? gamesView(list) : st.tab === "refs" ? refTable(list) : st.tab === "teams" ? teamTable(list) : matrix(list);
    $("statusLine").textContent = `${fmt(ALL.length)} games · ${A.REFEREES.length} referees · since 2000-01`;
  }

  // ---------- profiles ----------
  function hbars(rows, labelFn) {
    const max = Math.max(1, ...rows.map((r) => r[1]));
    return rows.map(([k, v]) => `<div class="hbar"><span class="lbl">${labelFn(k)}</span><span class="t"><i style="width:${(100 * v) / max}%"></i></span><span class="v">${v}</span></div>`).join("") || `<p style="color:var(--muted)">None</p>`;
  }
  const count = (arr) => Object.entries(arr.reduce((m, k) => ((m[k] = (m[k] || 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);
  function openRef(id) {
    const r = REF[id], games = ALL.filter((g) => g.refs && g.refs.includes(id)).sort((a, b) => b.date.localeCompare(a.date));
    const played = games.filter((g) => g.hs != null), hw = played.filter((g) => g.hs > g.as).length;
    const pos = [0, 1, 2].map((i) => games.filter((g) => g.refs[i] === id).length);
    const bySeason = YEARS.map((y) => games.filter((g) => g.year === y).length), maxS = Math.max(1, ...bySeason);
    drawer(`<div class="ph"><div class="avatar">${A.initials(r.name)}</div><div><h2>${esc(r.name)}</h2><p>${r.country} · ${r.level} · ${games.length ? `${games[games.length - 1].season.slice(0, 4)}–${games[0].season.slice(0, 4)}` : "no games"}</p></div></div>
      <div class="stats"><div><b>${fmt(games.length)}</b><span>Games</span></div><div><b>${new Set(games.map((g) => g.year)).size}</b><span>Seasons</span></div><div><b>${played.length ? Math.round((100 * hw) / played.length) : 0}%</b><span>Home team wins</span></div>
        <div><b>${pos[0]}</b><span>As crew chief</span></div><div><b>${pos[1]}</b><span>As umpire 1</span></div><div><b>${pos[2]}</b><span>As umpire 2</span></div>
        <div><b>${games.filter((g) => g.phase === "Playoffs").length}</b><span>Playoff games</span></div><div><b>${games.filter((g) => g.phase === "Final Four").length}</b><span>Final Four games</span></div><div><b>${games.filter((g) => g.comp === "C").length}</b><span>Atlas Cup games</span></div></div>
      <button class="btn primary" type="button" data-show-ref="${id}">Show their games</button>
      <h3>Career by season</h3><div class="career">${bySeason.map((n, i) => `<i title="${A.seasonLabel(YEARS[i])}: ${n}" style="height:${(100 * n) / maxS}%;opacity:${n ? 1 : 0.15}"></i>`).join("")}</div>
      <h3>Phases</h3>${hbars(count(games.map((g) => g.phase)), esc)}
      <h3>Teams reffed</h3>${hbars(count(games.flatMap((g) => [g.home, g.away])).slice(0, 10), (t) => `<span class="team">${crest(t, 18)}${esc(CLUB[t].name)}</span>`)}
      <h3>Most frequent crew partners</h3>${hbars(count(games.flatMap((g) => g.refs.filter((x) => x !== id))).slice(0, 6), (x) => esc(REF[x].name))}
      <h3>Latest games</h3>${games.slice(0, 6).map((g) => `<div class="hbar" style="grid-template-columns:1fr auto"><span>${teamCell(g.home)} ${g.hs ?? ""}–${g.as ?? ""} ${teamCell(g.away)}</span><span class="v">${g.date}</span></div>`).join("")}`);
  }
  function openTeam(t) {
    const c = CLUB[t], games = ALL.filter((g) => g.refs && (g.home === t || g.away === t));
    const played = games.filter((g) => g.hs != null), w = played.filter((g) => (g.home === t) === g.hs > g.as).length;
    drawer(`<div class="ph">${crest(t, 64)}<div><h2>${esc(c.name)}</h2><p>${A.COMPS[c.comp].name} · ${esc(c.arena)} · ${c.country}</p></div></div>
      <div class="stats"><div><b>${fmt(games.length)}</b><span>Games</span></div><div><b>${w}–${played.length - w}</b><span>Record</span></div><div><b>${played.length ? Math.round((100 * w) / played.length) : 0}%</b><span>Win rate</span></div></div>
      <button class="btn primary" type="button" data-show-team="${t}">Show their games</button>
      <h3>Most frequent referees</h3>${hbars(count(games.flatMap((g) => g.refs)).slice(0, 10), (x) => esc(REF[x].name))}
      <h3>At home: crew chiefs</h3>${hbars(count(games.filter((g) => g.home === t).map((g) => g.refs[0])).slice(0, 6), (x) => esc(REF[x].name))}`);
  }
  function drawer(html) {
    $("drawer").innerHTML = `<button class="btn x" type="button" data-close>Close</button>${html}`;
    $("drawer").classList.add("open"); $("drawer").setAttribute("aria-hidden", "false"); $("scrim").classList.add("open");
    $("drawer").querySelector("[data-close]").focus();
  }
  function closeDrawer() { $("drawer").classList.remove("open"); $("drawer").setAttribute("aria-hidden", "true"); $("scrim").classList.remove("open"); }

  // ---------- events ----------
  document.addEventListener("click", (e) => {
    const t = e.target;
    const c = t.closest("[data-c]"); if (c && c.closest("#compSwitch")) { st.comp = c.dataset.c; st.teams = st.teams.filter((x) => st.comp === "all" || CLUB[x].comp === st.comp); st.page = 0; return render(); }
    const yr = t.closest("[data-year]"); if (yr) { const y = +yr.dataset.year; if (st.yFrom === y && st.yTo === y) { st.yFrom = YEARS[0]; st.yTo = YEARS[YEARS.length - 1]; } else { st.yFrom = st.yTo = y; } st.page = 0; return render(); }
    const last = t.closest("[data-last]"); if (last) { const n = last.dataset.last; st.yTo = YEARS[YEARS.length - 1]; st.yFrom = n === "all" ? YEARS[0] : YEARS[YEARS.length - +n]; st.page = 0; return render(); }
    const ph = t.closest("[data-phase]"); if (ph) { const p = ph.dataset.phase; st.phases = st.phases.includes(p) ? st.phases.filter((x) => x !== p) : st.phases.concat(p); st.page = 0; return render(); }
    const tm = t.closest("[data-team]"); if (tm) { const k = tm.dataset.team; st.teams = st.teams.includes(k) ? st.teams.filter((x) => x !== k) : st.teams.concat(k); st.page = 0; return render(); }
    const tab = t.closest("[data-tab]"); if (tab) { st.tab = tab.dataset.tab; return render(); }
    const pg = t.closest("[data-page]"); if (pg && !pg.disabled) { st.page = +pg.dataset.page; render(); return $("view").scrollIntoView({ block: "start" }); }
    const chip = t.closest("[data-chip]"); if (chip) {
      const k = chip.dataset.chip, b = blank();
      if (k === "comp") st.comp = "all"; else if (k === "years") { st.yFrom = b.yFrom; st.yTo = b.yTo; } else if (k.startsWith("phase:")) st.phases = st.phases.filter((x) => x !== k.slice(6));
      else if (k === "rounds") { st.rFrom = ""; st.rTo = ""; } else if (k === "ref") { st.ref = ""; st.pos = "any"; } else if (k.startsWith("team:")) st.teams = st.teams.filter((x) => x !== k.slice(5));
      else if (k === "h2h") st.h2h = false; else if (k === "side") st.side = "any"; else if (k === "dates") { st.dFrom = ""; st.dTo = ""; }
      st.page = 0; return render();
    }
    if (t.id === "clearAll") { st = Object.assign(blank(), { tab: st.tab }); return render(); }
    const rb = t.closest("[data-ref]"); if (rb) return openRef(rb.dataset.ref);
    const to = t.closest("[data-team-open]"); if (to) return openTeam(to.dataset.teamOpen);
    const sr = t.closest("[data-show-ref]"); if (sr) { st.ref = sr.dataset.showRef; st.tab = "games"; st.page = 0; closeDrawer(); return render(); }
    const stm = t.closest("[data-show-team]"); if (stm) { st.teams = [stm.dataset.showTeam]; st.h2h = false; st.tab = "games"; st.page = 0; closeDrawer(); return render(); }
    if (t.closest("[data-close]") || t.id === "scrim") return closeDrawer();
  });
  document.addEventListener("change", (e) => {
    const t = e.target, v = t.value;
    const map = { yFrom: () => (st.yFrom = Math.min(+v, st.yTo)), yTo: () => (st.yTo = Math.max(+v, st.yFrom)), rFrom: () => (st.rFrom = v), rTo: () => (st.rTo = v), ref: () => { st.ref = v; if (!v) st.pos = "any"; }, pos: () => (st.pos = v), h2h: () => (st.h2h = t.checked), side: () => (st.side = v), dFrom: () => (st.dFrom = v), dTo: () => (st.dTo = v), played: () => (st.played = t.checked), sort: () => (st.sort = v) };
    if (map[t.id]) { map[t.id](); st.page = 0; render(); }
  });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") { closeDrawer(); $("gres").classList.remove("open"); } });

  // global search
  const q = $("gq"), res = $("gres"); let hits = [], active = 0;
  function search() {
    const s = q.value.trim().toLowerCase(); if (!s) { res.classList.remove("open"); return; }
    hits = A.REFEREES.filter((r) => r.name.toLowerCase().includes(s)).map((r) => ({ kind: "ref", id: r.id, label: r.name, sub: "Referee · " + r.country }))
      .concat(A.CLUBS.filter((c) => (c.name + " " + c.code).toLowerCase().includes(s)).map((c) => ({ kind: "team", id: c.code, label: c.name, sub: A.COMPS[c.comp].name }))).slice(0, 10);
    active = 0;
    res.innerHTML = hits.length ? hits.map((h, i) => `<button type="button" class="${i === active ? "active" : ""}" data-hit="${i}">${h.kind === "team" ? crest(h.id, 20) : '<span class="crest" style="--c:#3a3478;--s:20px">' + A.initials(h.label) + "</span>"}${esc(h.label)}<small>${esc(h.sub)}</small></button>`).join("") : `<div class="empty" style="padding:14px">Nothing found for “${esc(q.value)}”</div>`;
    res.classList.add("open");
  }
  function pick(h) { res.classList.remove("open"); q.value = ""; h.kind === "ref" ? openRef(h.id) : openTeam(h.id); }
  q.addEventListener("input", search);
  q.addEventListener("keydown", (e) => {
    if (!res.classList.contains("open") || !hits.length) return;
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); active = (active + (e.key === "ArrowDown" ? 1 : hits.length - 1)) % hits.length; res.querySelectorAll("button").forEach((b, i) => b.classList.toggle("active", i === active)); }
    if (e.key === "Enter") { e.preventDefault(); pick(hits[active]); }
  });
  res.addEventListener("click", (e) => { const b = e.target.closest("[data-hit]"); if (b) pick(hits[+b.dataset.hit]); });
  document.addEventListener("click", (e) => { if (!e.target.closest(".gsearch")) res.classList.remove("open"); });

  // exports
  function exportRows() {
    return [["competition", "season", "phase", "round", "date", "home", "away", "home_score", "away_score", "venue", "crew_chief", "umpire_1", "umpire_2"]]
      .concat(filtered().map((g) => [A.COMPS[g.comp].name, g.season, g.phase, g.round, g.date, CLUB[g.home].name, CLUB[g.away].name, g.hs ?? "", g.as ?? "", g.venue, ...(g.refs ? g.refs.map((r) => REF[r].name) : ["", "", ""])]));
  }
  $("export").onclick = () => A.download("referee_assignments.csv", A.toCSV(exportRows()));
  $("exportXlsx").onclick = () => A.download("referee_assignments_excel.csv", exportRows().map((r) => r.map((v) => String(v).replace(/;/g, ",")).join(";")).join("\r\n"));

  // loader: quick the second time
  const fast = store.get("loaded", false);
  const steps = YEARS.length; let i = 0;
  const tick = setInterval(() => {
    i++; $("prog").style.width = (100 * i) / steps + "%";
    $("progCount").textContent = i < steps ? `Season ${A.seasonLabel(YEARS[i - 1])} · ${fmt(ALL.filter((g) => g.year <= YEARS[i - 1]).length)} games` : `${fmt(ALL.length)} games ready`;
    if (i >= steps) { clearInterval(tick); store.set("loaded", true); setTimeout(() => $("loader").classList.add("done"), 150); }
  }, fast ? 8 : 45);
  render();
  A.ribbon("Referee Explorer", "referee-explorer");
})();
