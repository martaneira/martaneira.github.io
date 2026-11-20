/* Game Kit (demo). Before each round, the app writes the facts and stories behind every game from the
   results history and the box scores; the media team edits them and puts the best ones in a showcase. Invented data. */
(function () {
  "use strict";
  const A = window.ATLAS, { esc, fmt, crest, CLUB } = A;
  const app = document.getElementById("app");
  const store = A.store("game-kit");
  const CUR = "2026-27";

  // ---------- facts ----------
  const firstDate = (comp, round) => A.gamesOf(comp, round).reduce((m, g) => (g.date < m ? g.date : m), "9999");
  const played = (comp, before) => A.GAMES.filter((g) => g.comp === comp && g.played && g.date < before);
  function record(club, comp, before) {
    const gs = played(comp, before).filter((g) => g.home === club || g.away === club).sort((a, b) => a.date.localeCompare(b.date));
    const w = gs.filter((g) => A.winner(g) === club).length, home = gs.filter((g) => g.home === club), hw = home.filter((g) => A.winner(g) === club).length;
    let streak = 0, kind = null; for (let i = gs.length - 1; i >= 0; i--) { const won = A.winner(gs[i]) === club; if (kind == null) kind = won; if (won !== kind) break; streak++; }
    return { w, l: gs.length - w, hw, hl: home.length - hw, streak, won: kind, last: gs.at(-1) };
  }
  const seasonLogs = (p, before) => A.gameLogs(p).filter((l) => l.season === CUR && l.date && l.date < before && !l.dnp);
  const avg = (ls, k) => (ls.length ? ls.reduce((s, l) => s + l[k], 0) / ls.length : 0);
  function factsFor(g, before) {
    const out = [], H = CLUB[g.home], W = CLUB[g.away], add = (kind, text) => out.push({ id: `${g.id}:${out.length}`, kind, text });
    const hist = A.HISTORY.filter((h) => h.comp === g.comp && ((h.home === g.home && h.away === g.away) || (h.home === g.away && h.away === g.home)));
    const cur = played(g.comp, before).filter((x) => (x.home === g.home && x.away === g.away) || (x.home === g.away && x.away === g.home));
    const all = hist.concat(cur.map((x) => ({ ...x, season: CUR }))).sort((a, b) => a.date.localeCompare(b.date));
    if (all.length) {
      const hw = all.filter((x) => (x.hs > x.as ? x.home : x.away) === g.home).length, aw = all.length - hw, lead = hw >= aw ? H : W;
      add("Head to head", hw === aw ? `${H.name} and ${W.name} are level at ${hw}–${aw} in ${all.length} ${A.COMPS[g.comp].name} meetings.` : `${lead.name} lead the all-time series ${Math.max(hw, aw)}–${Math.min(hw, aw)} in ${all.length} ${A.COMPS[g.comp].name} meetings.`);
      const atHome = all.filter((x) => x.home === g.home), ahw = atHome.filter((x) => x.hs > x.as).length;
      if (atHome.length >= 4) add("Head to head", `${H.short} ${ahw / atHome.length >= 0.6 ? "have been strong" : ahw / atHome.length <= 0.4 ? "have struggled" : "are " + ahw + "–" + (atHome.length - ahw)} at home against ${W.short}${ahw / atHome.length >= 0.6 || ahw / atHome.length <= 0.4 ? `, ${ahw}–${atHome.length - ahw} all-time` : " all-time"}.`);
      const last = all.at(-1), lw = last.hs > last.as ? last.home : last.away;
      add("Last meeting", `Their last meeting, on ${A.dateLong(last.date)}${last.season !== CUR ? " " + last.date.slice(0, 4) : ""}, ended ${Math.max(last.hs, last.as)}–${Math.min(last.hs, last.as)} for ${CLUB[lw].name}.`);
      const big = all.reduce((m, x) => (Math.abs(x.hs - x.as) > Math.abs(m.hs - m.as) ? x : m), all[0]);
      if (Math.abs(big.hs - big.as) >= 20) add("Curiosity", `The widest margin between them: ${Math.abs(big.hs - big.as)} points, ${big.hs}–${big.as} in ${big.season}.`);
    } else add("Head to head", `First ever ${A.COMPS[g.comp].name} meeting between ${H.name} and ${W.name}.`);
    [g.home, g.away].forEach((c) => {
      const r = record(c, g.comp, before), C = CLUB[c];
      if (r.w + r.l) add("Form", `${C.name} are ${r.w}–${r.l} this season${c === g.home ? `, ${r.hw}–${r.hl} at home` : ""}.`);
      if (r.streak >= 3) add("Streak", `${C.short} have ${r.won ? "won" : "lost"} ${r.streak} in a row.`);
      const ros = A.PLAYERS.filter((p) => p.club === c).map((p) => ({ p, ls: seasonLogs(p, before) })).filter((x) => x.ls.length >= 3);
      if (ros.length) {
        const top = ros.slice().sort((a, b) => avg(b.ls, "pts") - avg(a.ls, "pts"))[0];
        add("Leader", `${top.p.name} leads ${C.short} with ${avg(top.ls, "pts").toFixed(1)} points per game this season.`);
        const reb = ros.slice().sort((a, b) => avg(b.ls, "reb") - avg(a.ls, "reb"))[0]; if (avg(reb.ls, "reb") >= 6) add("Leader", `${reb.p.name} averages ${avg(reb.ls, "reb").toFixed(1)} rebounds for ${C.short}.`);
        const hot = ros.map((x) => ({ ...x, l: x.ls.at(-1) })).filter((x) => x.l && x.l.pts >= 22).sort((a, b) => b.l.pts - a.l.pts)[0];
        if (hot) add("Last round", `${hot.p.name} scored ${hot.l.pts} points last time out${hot.l.pts === Math.max(...hot.ls.map((l) => l.pts)) ? ", his season high" : ""}.`);
        const thr = ros.map((x) => ({ ...x, tpm: x.ls.reduce((s, l) => s + l.tpm, 0), tpa: x.ls.reduce((s, l) => s + l.tpa, 0) })).filter((x) => x.tpa >= 20).sort((a, b) => b.tpm / b.tpa - a.tpm / a.tpa)[0];
        if (thr && thr.tpm / thr.tpa >= 0.42) add("Leader", `${thr.p.name} is shooting ${((100 * thr.tpm) / thr.tpa).toFixed(1)}% from three (${thr.tpm}/${thr.tpa}).`);
        ros.forEach(({ p, ls }) => { const tot = A.careerPoints(p) + ls.reduce((s, l) => s + l.pts, 0), next = Math.ceil(tot / 500) * 500, need = next - tot; if (need > 0 && need <= 22 && next >= 1500) add("Milestone", `${p.name} needs ${need} points to reach ${fmt(next)} career points.`); });
      }
    });
    return out;
  }
  function roundNotes(comp, round, before) {
    const games = A.gamesOf(comp, round), out = [], add = (kind, text) => out.push({ id: `${comp}${round}:r${out.length}`, kind, text });
    const recs = A.clubsOf(comp).map((c) => ({ c, ...record(c.code, comp, before) })).filter((x) => x.w + x.l);
    if (recs.length) {
      const best = recs.slice().sort((a, b) => b.w - a.w || a.l - b.l)[0], unb = recs.filter((x) => x.l === 0);
      add("Standings", unb.length ? `${unb.map((x) => x.c.name).join(" and ")} ${unb.length > 1 ? "are" : "is"} still unbeaten.` : `${best.c.name} lead the standings at ${best.w}–${best.l}.`);
      const hs = recs.filter((x) => x.streak >= 4).sort((a, b) => b.streak - a.streak)[0]; if (hs) add("Streak", `Longest active streak: ${hs.c.name}, ${hs.streak} ${hs.won ? "wins" : "losses"} in a row.`);
    }
    const tops = games.flatMap((g) => [g.home, g.away]).map((c) => CLUB[c]);
    const dist = games.map((g) => ({ g, km: A.distanceKm(CLUB[g.home], CLUB[g.away]) })).sort((a, b) => b.km - a.km)[0];
    add("Curiosity", `Longest trip of the round: ${CLUB[dist.g.away].name} travel ${fmt(dist.km)} km to ${CLUB[dist.g.home].city}.`);
    const cap = games.reduce((s, g) => s + CLUB[g.home].capacity, 0); add("Curiosity", `The ${games.length} arenas of round ${round} hold ${fmt(cap)} fans combined.`);
    return out.filter(() => tops.length);
  }
  function kit(comp, round) {
    const before = firstDate(comp, round);
    return [{ key: "round", title: `Round ${round} notes`, meta: `${A.COMPS[comp].name} · ${A.dateLong(before)}`, facts: roundNotes(comp, round, before) }]
      .concat(A.gamesOf(comp, round).map((g) => ({ key: g.id, g, title: `${CLUB[g.home].name} vs ${CLUB[g.away].name}`, meta: `${A.dateLong(g.date)} · ${g.tip} · ${g.venue}${g.played ? ` · final ${g.hs}–${g.as}` : ""}`, facts: factsFor(g, before) })));
  }
  const cache = {}; const getKit = (c, r) => (cache[c + r] = cache[c + r] || kit(c, r));

  // ---------- edits ----------
  const edits = store.get("edits", {}); const added = store.get("added", {}); const saveE = () => { store.set("edits", edits); store.set("added", added); };
  const runs = store.get("runs", [{ at: "2027-01-02 09:00", comp: "Both", rounds: "L15, C15", email: true, by: "Scheduled" }, { at: "2026-12-27 09:00", comp: "Both", rounds: "L14, C14", email: true, by: "Scheduled" }, { at: "2026-12-21 17:42", comp: "Atlas League", rounds: "L13", email: false, by: "Manual" }]);

  let view = { page: "round", comp: "L", round: A.SEASON.next.L, q: "", sec: "", hideDel: false, editing: null, show: null, lb: "season", per: "total", stat: "pts", player: null, runC: "Both", runMail: true, running: false };
  const go = (p) => { Object.assign(view, p); render(); };
  const textOf = (f) => (edits[f.id] && edits[f.id].text != null ? edits[f.id].text : f.text);
  const highlight = (t) => { const q = view.q.trim(); return q ? esc(t).replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), (m) => `<mark>${m}</mark>`) : esc(t); };

  function nav() {
    return `<header class="nav"><div class="in"><span class="brand"><i></i>Game Kit</span><nav>${[["round", "Game Kit"], ["explore", "Explore"], ["archive", "Archive"], ["run", "Run"]].map(([k, l]) => `<button type="button" data-page="${k}" aria-current="${view.page === k}">${l}</button>`).join("")}</nav><span class="r"><a href="../hub/">Back to hub</a></span></div></header>`;
  }
  const compSeg = () => `<div class="seg" role="group" aria-label="Competition">${["L", "C"].map((c) => `<button type="button" data-comp="${c}" aria-pressed="${view.comp === c}">${A.COMPS[c].name}</button>`).join("")}</div>`;
  function roundPage() {
    const secs = getKit(view.comp, view.round), q = view.q.trim().toLowerCase();
    let total = 0, shown = 0, feat = 0;
    const html = secs.filter((s) => !view.sec || s.key === view.sec).map((s) => {
      const facts = s.facts.concat((added[s.key] || []).map((t, i) => ({ id: `${s.key}:add${i}`, kind: "Added", text: t })));
      const rows = facts.map((f) => { const e = edits[f.id] || {}; total++; if (e.feat) feat++; if (view.hideDel && e.del) return ""; const t = textOf(f); if (q && !t.toLowerCase().includes(q)) return ""; shown++;
        if (view.editing === f.id) return `<div class="ph"><span class="dot"></span><div><textarea id="ed" rows="2">${esc(t)}</textarea><div style="display:flex;gap:6px;margin-top:6px"><button class="btn sm" type="button" data-save="${f.id}">Save</button><button class="btn sm ghost" type="button" data-cancel>Cancel</button></div></div><span></span></div>`;
        return `<div class="ph ${e.feat ? "feat" : ""} ${e.del ? "del" : ""}"><span class="dot"></span><div class="txt"><span class="kind">${f.kind}</span>${highlight(t)}${e.text != null ? '<span class="edited">edited</span>' : ""}</div><div class="acts">${e.del ? `<button type="button" data-restore="${f.id}">Restore</button>` : `<button type="button" data-edit="${f.id}">Edit</button><button type="button" data-copy="${f.id}">Copy</button><button type="button" data-feat="${f.id}" class="${e.feat ? "on" : ""}">${e.feat ? "★ In showcase" : "☆ Feature"}</button>${e.text != null ? `<button type="button" data-undo="${f.id}">Undo edit</button>` : ""}<button type="button" data-del="${f.id}">Delete</button>`}</div></div>`; }).join("");
      if (!rows && q) return "";
      return `<section class="sec"><h2>${s.g ? `${crest(s.g.home, 26)}${crest(s.g.away, 26)}` : ""}${esc(s.title)}</h2><div class="meta">${esc(s.meta)}</div>${rows || `<p class="empty">No lines.</p>`}<form class="addline" data-addto="${s.key}"><input type="text" placeholder="Add a line to this section" aria-label="Add a line to ${esc(s.title)}"><button class="btn sm ghost" type="submit">Add a line</button></form></section>`;
    }).join("");
    return `<div class="hero"><h1>Round ${view.round} <span>game kit</span></h1><div class="ctl">${compSeg()}<select data-round aria-label="Round">${Array.from({ length: A.SEASON.next[view.comp] }, (_, i) => `<option value="${i + 1}"${view.round === i + 1 ? " selected" : ""}>Round ${i + 1}${i + 1 === A.SEASON.next[view.comp] ? " · next" : ""}</option>`).join("")}</select><button class="btn dark" type="button" data-show>Showcase</button><button class="btn ghost" type="button" data-dl="txt">Download TXT</button><button class="btn ghost" type="button" data-dl="doc">Word</button></div>
      <p>Facts written from the results since 2000 and this season's box scores. Edit anything, feature the best lines, and download the kit for the broadcasters.</p></div>
      <div class="toolbar"><input type="search" id="q" placeholder="Search phrases, players, teams…" value="${esc(view.q)}" aria-label="Search phrases"><select data-sec aria-label="Section"><option value="">All sections</option>${secs.map((s) => `<option value="${s.key}"${view.sec === s.key ? " selected" : ""}>${esc(s.g ? CLUB[s.g.home].short + " vs " + CLUB[s.g.away].short : s.title)}</option>`).join("")}</select><label class="chk"><input type="checkbox" data-hidedel${view.hideDel ? " checked" : ""}> Hide deleted</label></div>
      <div class="stats"><span><b>${secs.length - 1}</b> games</span><span><b>${total}</b> lines</span><span><b>${feat}</b> in showcase</span>${q ? `<span><b>${shown}</b> match “${esc(view.q)}”</span>` : ""}</div>${html || `<p class="empty">Nothing matches.</p>`}`;
  }
  function showcase() {
    const secs = getKit(view.comp, view.round); let slides = [];
    secs.forEach((s) => s.facts.concat((added[s.key] || []).map((t, i) => ({ id: `${s.key}:add${i}`, text: t }))).forEach((f) => { const e = edits[f.id] || {}; if (e.feat && !e.del) slides.push({ s, t: textOf(f) }); }));
    const all = !slides.length; if (all) secs.forEach((s) => s.facts.slice(0, 2).forEach((f) => { if (!(edits[f.id] || {}).del) slides.push({ s, t: textOf(f) }); }));
    const i = Math.max(0, Math.min(view.show, slides.length - 1)), sl = slides[i]; view.show = i;
    return `<div class="show" role="dialog" aria-modal="true" aria-label="Showcase"><div class="top"><span>${A.COMPS[view.comp].name} · Round ${view.round} · ${all ? "all facts (nothing featured yet)" : "featured facts"}</span><button class="btn ghost sm" type="button" data-close>Close · Esc</button></div>
      <div class="slide">${sl.s.g ? `<div class="game">${crest(sl.s.g.home, 40)}${esc(CLUB[sl.s.g.home].short)} vs ${esc(CLUB[sl.s.g.away].short)}${crest(sl.s.g.away, 40)}</div>` : `<div class="game">${esc(sl.s.title)}</div>`}<p>${esc(sl.t)}</p></div>
      <div class="ctrl"><button type="button" data-slide="-1">← Previous</button><div class="dots">${slides.map((_, k) => `<i class="${k === i ? "on" : ""}"></i>`).join("")}</div><button type="button" data-slide="1">Next →</button></div></div>`;
  }
  function explore() {
    const before = view.lb === "season" ? A.addDays(A.TODAY, 1) : null;
    const rows = A.PLAYERS.filter((p) => p.comp === view.comp).map((p) => {
      const ls = view.lb === "season" ? seasonLogs(p, before) : A.gameLogs(p).filter((l) => !l.dnp);
      const tot = ls.reduce((s, l) => s + l[view.stat], 0), games = ls.length;
      const v = view.lb === "all" && view.stat === "pts" ? Math.max(tot, A.careerPoints(p)) : tot;
      return { p, games, v: view.per === "total" ? v : games ? v / games : 0 };
    }).filter((x) => x.games >= (view.lb === "season" ? 5 : 40)).sort((a, b) => b.v - a.v).slice(0, 10);
    const lbl = { pts: "Points", reb: "Rebounds", ast: "Assists", tpm: "Threes made" }[view.stat];
    const before2 = firstDate(view.comp, A.SEASON.next[view.comp]);
    const highs = A.PLAYERS.filter((p) => p.comp === view.comp).flatMap((p) => seasonLogs(p, before2).map((l) => ({ p, l }))).sort((a, b) => b.l.pts - a.l.pts).slice(0, 5);
    const recs = A.clubsOf(view.comp).map((c) => ({ c, ...record(c.code, view.comp, before2) }));
    const homeBest = recs.slice().sort((a, b) => b.hw - a.hw || a.hl - b.hl)[0];
    const games = A.GAMES.filter((g) => g.comp === view.comp && g.played), close = games.filter((g) => Math.abs(g.hs - g.as) <= 3).length, top = games.reduce((m, g) => (g.hs + g.as > m.hs + m.as ? g : m), games[0]);
    return `<div class="hero"><h1>Every story <span>behind the round</span></h1><div class="ctl">${compSeg()}</div><p>Leaders, records and curiosities, updated after every round.</p></div>
      <div class="grid2"><section class="sec"><h2 style="justify-content:space-between">Leaders <span class="seg">${[["season", "This season"], ["all", "All-time"]].map(([k, l]) => `<button type="button" data-lb="${k}" aria-pressed="${view.lb === k}">${l}</button>`).join("")}</span></h2>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin:8px 0 6px"><span class="seg">${[["pts", "Points"], ["reb", "Rebounds"], ["ast", "Assists"], ["tpm", "Threes"]].map(([k, l]) => `<button type="button" data-stat="${k}" aria-pressed="${view.stat === k}">${l}</button>`).join("")}</span><span class="seg">${[["total", "Total"], ["pg", "Per game"]].map(([k, l]) => `<button type="button" data-per="${k}" aria-pressed="${view.per === k}">${l}</button>`).join("")}</span></div>
        ${rows.map((x, i) => `<div class="lead"><span class="n">${i + 1}</span><div class="nm"><button class="linkish" type="button" data-player="${x.p.id}"><b>${esc(x.p.name)}</b></button><small>${crest(x.p.club, 16)}${esc(CLUB[x.p.club].short)} · ${x.games} games</small></div><span class="v">${view.per === "total" ? fmt(x.v) : x.v.toFixed(1)}</span></div>`).join("")}<p style="color:var(--muted);font-size:13px;margin:8px 0 0">${lbl}, ${view.per === "total" ? "total" : "per game"}, ${view.lb === "season" ? A.SEASON.label : "since " + A.LOG_SEASONS[0] + (view.stat === "pts" ? " (career points)" : "")}.</p></section>
        <section class="sec"><h2>Curiosities</h2><div style="display:grid;gap:10px;margin-top:8px">
          <div class="cur"><b>Best scoring nights this season</b>${highs.map((h) => `${esc(h.p.name)} (${esc(CLUB[h.p.club].short)}) · <b style="display:inline;font-size:14px">${h.l.pts}</b> vs ${esc(CLUB[h.l.opp].short)}`).join("<br>")}</div>
          <div class="cur"><b>Fortress</b>${esc(homeBest.c.name)} are ${homeBest.hw}–${homeBest.hl} at home this season.</div>
          <div class="cur"><b>Photo finishes</b>${close} of ${games.length} games this season were decided by 3 points or fewer.</div>
          <div class="cur"><b>Highest-scoring game</b>${esc(CLUB[top.home].short)} ${top.hs}–${top.as} ${esc(CLUB[top.away].short)}, ${top.hs + top.as} points, round ${top.round}.</div></div></section></div>`;
  }
  function playerPage() {
    const p = A.PLAYER[view.player], ls = A.gameLogs(p).filter((l) => !l.dnp);
    const hi = (k) => ls.reduce((m, l) => (l[k] > m[k] ? l : m), ls[0]);
    const bySeason = A.LOG_SEASONS.map((s) => { const x = ls.filter((l) => l.season === s); return { s, n: x.length, pts: avg(x, "pts"), reb: avg(x, "reb"), ast: avg(x, "ast") }; });
    return `<button class="btn ghost sm" type="button" data-page="explore">← Explore</button><div class="pcard" style="margin-top:14px"><span class="av">${A.initials(p.name)}</span><div><h1 style="font-size:34px">${esc(p.name)}</h1><span class="team">${crest(p.club, 20)}${esc(CLUB[p.club].name)}</span> · #${p.number} · ${p.pos} · ${p.height} cm · ${fmt(A.careerPoints(p))} career points</div></div>
      <div class="grid3">${[["pts", "Points"], ["reb", "Rebounds"], ["ast", "Assists"]].map(([k, l]) => { const h = hi(k); return `<div class="sec"><h2>${l} career high</h2><p style="font:700 44px var(--display);margin:6px 0 0">${h[k]}</p><div class="meta">vs ${esc(CLUB[h.opp] ? CLUB[h.opp].name : h.opp)} · ${h.season}${h.date ? " · " + A.dateShort(h.date) : ""}</div></div>`; }).join("")}</div>
      <section class="sec"><h2>By season</h2><table><thead><tr><th>Season</th><th>Games</th><th>Points</th><th>Rebounds</th><th>Assists</th></tr></thead><tbody>${bySeason.map((x) => `<tr><td>${x.s}</td><td>${x.n}</td><td>${x.pts.toFixed(1)}</td><td>${x.reb.toFixed(1)}</td><td>${x.ast.toFixed(1)}</td></tr>`).join("")}</tbody></table></section>`;
  }
  function archive() {
    const rounds = Array.from({ length: A.SEASON.next[view.comp] }, (_, i) => A.SEASON.next[view.comp] - i);
    return `<div class="hero"><h1>Archive</h1><div class="ctl">${compSeg()}</div><p>Every game kit of the season. Open one to read, edit or download it again.</p></div>
      <div class="arch">${rounds.map((r) => { const k = getKit(view.comp, r), n = k.reduce((s, x) => s + x.facts.length, 0); return `<button type="button" data-open-round="${r}"><small>${A.dateLong(firstDate(view.comp, r))}</small><b>Round ${r}</b><small>${k.length - 1} games · ${n} lines${r === A.SEASON.next[view.comp] ? " · next round" : ""}</small></button>`; }).join("")}</div>`;
  }
  function run() {
    return `<div class="hero"><h1>Run the <span>kit</span></h1><p>The kit runs automatically every morning before a round. Run it by hand after a late result or a data fix.</p></div>
      <div class="grid2"><div class="run"><div class="card"><div><b>Competition</b><div class="seg" style="margin-top:6px">${["Atlas League", "Atlas Cup", "Both"].map((c) => `<button type="button" data-runc="${c}" aria-pressed="${view.runC === c}">${c}</button>`).join("")}</div></div>
        <label style="display:flex;gap:8px;align-items:center;font-weight:600"><input type="checkbox" data-runmail${view.runMail ? " checked" : ""}> Also send the kit by email to the media list</label>
        <button class="btn" type="button" data-run${view.running ? " disabled" : ""}>${view.running ? "Running…" : "Run now"}</button><div class="prog"><i id="pb"></i></div><div class="log" id="log" aria-live="polite">Ready.</div></div></div>
        <section class="sec"><h2>Recent runs</h2><table><thead><tr><th>When</th><th>Rounds</th><th>Email</th><th>By</th></tr></thead><tbody>${runs.map((r) => `<tr><td>${r.at}</td><td>${r.rounds}</td><td>${r.email ? "Sent" : "–"}</td><td>${r.by}</td></tr>`).join("")}</tbody></table></section></div>`;
  }
  function render() {
    const page = view.player ? playerPage() : { round: roundPage, explore, archive, run }[view.page]();
    app.innerHTML = nav() + `<main class="wrap">${page}</main>${view.show != null ? showcase() : ""}`;
    const q = app.querySelector("#q"); if (q && view.focusQ) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); view.focusQ = false; }
    const ed = app.querySelector("#ed"); if (ed) ed.focus();
  }
  const toast = (t) => { const d = document.createElement("div"); d.className = "toast"; d.setAttribute("role", "status"); d.textContent = t; document.body.appendChild(d); setTimeout(() => d.remove(), 1800); };
  function factById(id) { for (const s of getKit(view.comp, view.round)) { const f = s.facts.find((x) => x.id === id); if (f) return f; const m = id.match(/^(.*):add(\d+)$/); if (m && m[1] === s.key) return { id, text: added[s.key][+m[2]] }; } return null; }
  function exportKit(kind) {
    const secs = getKit(view.comp, view.round), lines = [];
    secs.forEach((s) => { const fs = s.facts.concat((added[s.key] || []).map((t, i) => ({ id: `${s.key}:add${i}`, text: t }))).filter((f) => !(edits[f.id] || {}).del); lines.push({ h: s.title, m: s.meta, fs: fs.map(textOf) }); });
    const name = `game_kit_${view.comp}_round_${view.round}`;
    if (kind === "txt") return A.download(name + ".txt", `${A.COMPS[view.comp].name} · Round ${view.round} game kit\n\n` + lines.map((l) => `${l.h.toUpperCase()}\n${l.m}\n${l.fs.map((t) => "- " + t).join("\n")}`).join("\n\n"), "text/plain;charset=utf-8");
    A.download(name + ".doc", `<html><head><meta charset="utf-8"></head><body style="font-family:Calibri,Arial"><h1>${A.COMPS[view.comp].name} · Round ${view.round} game kit</h1>${lines.map((l) => `<h2>${esc(l.h)}</h2><p><i>${esc(l.m)}</i></p><ul>${l.fs.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>`).join("")}</body></html>`, "application/msword");
  }
  app.addEventListener("click", (e) => {
    const d = (s) => e.target.closest(s), set = (id, patch) => { edits[id] = { ...(edits[id] || {}), ...patch }; saveE(); render(); };
    if (d("[data-page]")) { window.scrollTo(0, 0); return go({ page: d("[data-page]").dataset.page, player: null }); }
    if (d("[data-comp]")) { const c = d("[data-comp]").dataset.comp; return go({ comp: c, round: A.SEASON.next[c], sec: "" }); }
    if (d("[data-edit]")) return go({ editing: d("[data-edit]").dataset.edit });
    if (d("[data-cancel]")) return go({ editing: null });
    if (d("[data-save]")) { const id = d("[data-save]").dataset.save, v = app.querySelector("#ed").value.trim(), f = factById(id); view.editing = null; return set(id, { text: v && f && v !== f.text ? v : null }); }
    if (d("[data-undo]")) return set(d("[data-undo]").dataset.undo, { text: null });
    if (d("[data-del]")) return set(d("[data-del]").dataset.del, { del: true, feat: false });
    if (d("[data-restore]")) return set(d("[data-restore]").dataset.restore, { del: false });
    if (d("[data-feat]")) { const id = d("[data-feat]").dataset.feat; return set(id, { feat: !(edits[id] || {}).feat }); }
    if (d("[data-copy]")) { const f = factById(d("[data-copy]").dataset.copy); try { navigator.clipboard.writeText(textOf(f)); } catch (err) { /* ignore */ } return toast("Copied"); }
    if (d("[data-show]")) return go({ show: 0 });
    if (d("[data-close]")) return go({ show: null });
    if (d("[data-slide]")) return go({ show: Math.max(0, view.show + +d("[data-slide]").dataset.slide) });
    if (d("[data-dl]")) return exportKit(d("[data-dl]").dataset.dl);
    if (d("[data-lb]")) return go({ lb: d("[data-lb]").dataset.lb });
    if (d("[data-stat]")) return go({ stat: d("[data-stat]").dataset.stat });
    if (d("[data-per]")) return go({ per: d("[data-per]").dataset.per });
    if (d("[data-player]")) { window.scrollTo(0, 0); return go({ player: d("[data-player]").dataset.player }); }
    if (d("[data-open-round]")) return go({ page: "round", round: +d("[data-open-round]").dataset.openRound });
    if (d("[data-runc]")) return go({ runC: d("[data-runc]").dataset.runc });
    if (d("[data-run]") && !view.running) {
      view.running = true; render();
      const comps = view.runC === "Both" ? ["L", "C"] : [view.runC === "Atlas League" ? "L" : "C"];
      const steps = ["Loading results since 2000…", ...comps.map((c) => `Reading this season's box scores (${A.COMPS[c].name})…`), "Writing head-to-head and streak lines…", "Checking career milestones…", ...comps.map((c) => `Round ${A.SEASON.next[c]} ${A.COMPS[c].short}: ${getKit(c, A.SEASON.next[c]).reduce((s, x) => s + x.facts.length, 0)} lines ready`), view.runMail ? "Email sent to the media list." : "Done. No email sent."];
      let k = 0; const log = [];
      const tick = () => { const pb = app.querySelector("#pb"), lg = app.querySelector("#log"); log.push("› " + steps[k]); if (lg) lg.textContent = log.join("\n"); if (pb) pb.style.width = ((k + 1) / steps.length) * 100 + "%"; k++;
        if (k < steps.length) setTimeout(tick, 380); else { runs.unshift({ at: A.TODAY + " " + new Date().toTimeString().slice(0, 5), comp: view.runC, rounds: comps.map((c) => c + A.SEASON.next[c]).join(", "), email: view.runMail, by: "Manual" }); store.set("runs", runs.slice(0, 8)); view.running = false; setTimeout(render, 900); } };
      setTimeout(tick, 200);
    }
  });
  app.addEventListener("submit", (e) => { const f = e.target.closest("[data-addto]"); if (!f) return; e.preventDefault(); const v = f.querySelector("input").value.trim(); if (!v) return; (added[f.dataset.addto] = added[f.dataset.addto] || []).push(v); saveE(); render(); });
  app.addEventListener("change", (e) => {
    const t = e.target;
    if (t.matches("[data-round]")) return go({ round: +t.value, sec: "" });
    if (t.matches("[data-sec]")) return go({ sec: t.value });
    if (t.matches("[data-hidedel]")) return go({ hideDel: t.checked });
    if (t.matches("[data-runmail]")) view.runMail = t.checked;
  });
  app.addEventListener("input", (e) => { if (e.target.id === "q") { view.q = e.target.value; view.focusQ = true; render(); } });
  document.addEventListener("keydown", (e) => { if (view.show == null) return; if (e.key === "Escape") go({ show: null }); if (e.key === "ArrowRight") go({ show: view.show + 1 }); if (e.key === "ArrowLeft") go({ show: Math.max(0, view.show - 1) }); });
  render();
  A.ribbon("Game Kit", "game-kit");
})();
