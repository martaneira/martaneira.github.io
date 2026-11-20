/* Delegates (demo). At every game, three delegates (competition, marketing, media) fill in a checklist
   of the arena. The app shows what failed, where, and composes the night report. Invented data. */
(function () {
  "use strict";
  const A = window.ATLAS, { esc, fmt, crest, CLUB } = A;
  const app = document.getElementById("app");
  const store = A.store("delegates");
  const DEPTS = [
    { k: "competition", name: "Competition", c: "var(--comp)", checks: ["Court and baskets ready 90 min before tip-off", "Shot clocks and game clock working", "Scoreboard showing correct data", "Game balls approved", "Team benches set up correctly", "Locker rooms clean and ready", "Anti-doping room ready", "Instant replay system working", "Scorer's table staffed on time"] },
    { k: "marketing", name: "Marketing", c: "var(--mkt)", checks: ["LED boards running the approved loop", "Court stickers in the right place", "Sponsor banners in place", "Videoboard content shown as planned", "Half-time activation delivered", "Hospitality area ready"] },
    { k: "media", name: "Media", c: "var(--media)", checks: ["Press seats available", "Wi-Fi working in the press area", "Mixed zone set up", "Press conference room ready", "TV camera positions ready", "Photographer positions free"] },
  ];
  const NOTES = { "Shot clocks and game clock working": "Shot clock on the east basket froze twice in Q2; fixed by the arena technician.", "Scoreboard showing correct data": "Team fouls displayed wrong for most of Q3.", "Instant replay system working": "Replay monitor lost signal for about 10 minutes.", "Court and baskets ready 90 min before tip-off": "Second basket was installed 50 minutes before tip-off.", "Locker rooms clean and ready": "Visiting locker room had no hot water.", "LED boards running the approved loop": "LED loop was an old version with last season's partners.", "Court stickers in the right place": "Centre-court sticker misplaced by about one metre.", "Videoboard content shown as planned": "Two partner spots were skipped in the second half.", "Wi-Fi working in the press area": "Press Wi-Fi dropped several times; journalists used mobile data.", "Mixed zone set up": "Mixed zone barriers arrived late.", "Press conference room ready": "No backdrop in the press conference room.", "TV camera positions ready": "One camera platform was blocked by fans.", "Photographer positions free": "Photographers' baseline spots taken by club staff." };
  const FIRST = ["Laura", "Marc", "Sofia", "Jordi", "Elena", "Pau", "Irene", "Nils", "Ana", "Tomas", "Clara", "Iker"], LAST = ["Vidal", "Roca", "Moreau", "Kraus", "Ferrer", "Nowak", "Silva", "Berg", "Costa", "Lind"];
  const people = (r) => r.pick(FIRST) + " " + r.pick(LAST);

  // ---------- forms ----------
  const FORMS = {};
  A.GAMES.forEach((g) => {
    const r = A.rng(g.code * 31 + (g.comp === "C" ? 9 : 0)), arenaRisk = (g.home.charCodeAt(1) % 6) / 50;
    FORMS[g.id] = DEPTS.map((d) => {
      if (!g.played) return { dept: d.k, state: "upcoming", checks: [] };
      const last = g.round === A.SEASON.played[g.comp], roll = r.next();
      const state = last ? (roll < 0.55 ? "complete" : roll < 0.75 ? "partial" : "missing") : roll < 0.92 ? "complete" : roll < 0.97 ? "partial" : "missing";
      if (state === "missing") return { dept: d.k, state, checks: [] };
      const n = state === "partial" ? Math.ceil(d.checks.length / 2) : d.checks.length;
      return { dept: d.k, state, by: people(r), at: g.tip, checks: d.checks.slice(0, n).map((c) => { const fail = r.chance(0.012 + arenaRisk / 2.5); return { c, ok: !fail, note: fail ? NOTES[c] || "Fixed during the game." : "" }; }), comment: r.chance(0.25) ? r.pick(["Good collaboration with the club staff.", "Arena staff very helpful.", "Late start of the warm-up music.", "Everything ready on time."]) : "" };
    });
    FORMS[g.id].attendance = g.played ? Math.round(CLUB[g.home].capacity * (0.6 + r.next() * 0.38)) : null;
  });
  const formsOf = (g) => FORMS[g.id].filter((f) => f.checks);
  const passRate = (gs, dept) => { let ok = 0, n = 0; gs.forEach((g) => FORMS[g.id].forEach((f) => { if (dept && f.dept !== dept) return; f.checks.forEach((c) => { n++; if (c.ok) ok++; }); })); return n ? ok / n : null; };
  const issues = (gs) => gs.flatMap((g) => FORMS[g.id].flatMap((f) => f.checks.filter((c) => !c.ok).map((c) => ({ g, dept: f.dept, ...c, by: f.by }))));
  const pctCls = (v) => (v == null ? "" : v >= 0.97 ? "good" : v >= 0.92 ? "mid" : "bad");
  const pct = (v) => (v == null ? "–" : (100 * v).toFixed(1) + "%");
  const D = Object.fromEntries(DEPTS.map((d) => [d.k, d]));

  let view = { page: "dash", comp: "L", tab: "game", game: null, team: null, night: null, pal: false, palQ: "", palI: 0, toast: "", light: store.get("light", false) };
  document.body.classList.toggle("light", view.light);
  const go = (p) => { Object.assign(view, p); render(); };
  const compGames = () => A.GAMES.filter((g) => g.comp === view.comp && g.played);
  const compSeg = () => `<div class="seg" role="group" aria-label="Competition">${["L", "C"].map((c) => `<button type="button" data-comp="${c}" aria-pressed="${view.comp === c}">${A.COMPS[c].name}</button>`).join("")}</div>`;

  function lineChart() {
    const rounds = Array.from({ length: A.SEASON.played[view.comp] }, (_, i) => i + 1), W = 640, H = 200, x = (i) => 36 + (i * (W - 50)) / (rounds.length - 1), y = (v) => 12 + (1 - (v - 0.85) / 0.15) * (H - 36);
    const lines = DEPTS.map((d) => { const pts = rounds.map((r, i) => [x(i), y(Math.max(0.85, passRate(A.gamesOf(view.comp, r).filter((g) => g.played), d.k) ?? 1))]); return `<polyline points="${pts.map((p) => p.join(",")).join(" ")}" fill="none" stroke="${d.c}" stroke-width="2.5" stroke-linejoin="round"/>${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${d.c}"><title>${d.name} · round ${rounds[i]}</title></circle>`).join("")}`; }).join("");
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Share of checks passed by round, per department">${[0.85, 0.9, 0.95, 1].map((v) => `<line x1="36" x2="${W - 14}" y1="${y(v)}" y2="${y(v)}" stroke="currentColor" opacity=".12"/><text x="0" y="${y(v) + 4}" font-size="11" fill="currentColor" opacity=".6">${Math.round(v * 100)}%</text>`).join("")}${lines}${rounds.map((r, i) => `<text x="${x(i)}" y="${H - 2}" font-size="11" text-anchor="middle" fill="currentColor" opacity=".6">${r}</text>`).join("")}</svg>`;
  }
  function dash() {
    const gs = compGames(), iss = issues(gs), forms = gs.flatMap((g) => FORMS[g.id]), complete = forms.filter((f) => f.state === "complete").length;
    const byCheck = {}; iss.forEach((i) => { const k = i.dept + "|" + i.c; byCheck[k] = (byCheck[k] || 0) + 1; });
    const topChecks = Object.entries(byCheck).sort((a, b) => b[1] - a[1]).slice(0, 7), cmx = topChecks[0] ? topChecks[0][1] : 1;
    const byArena = {}; iss.forEach((i) => (byArena[i.g.home] = (byArena[i.g.home] || 0) + 1));
    const topArenas = Object.entries(byArena).sort((a, b) => b[1] - a[1]).slice(0, 7), amx = topArenas[0] ? topArenas[0][1] : 1;
    let tab = "";
    if (view.tab === "game") tab = `<table><thead><tr><th>Round</th><th>Game</th>${DEPTS.map((d) => `<th><span class="dep" style="--c:${d.c}">${d.name}</span></th>`).join("")}<th>Issues</th></tr></thead><tbody>${gs.slice().sort((a, b) => b.date.localeCompare(a.date)).slice(0, 24).map((g) => `<tr class="click" data-game="${g.id}" tabindex="0"><td>${g.round}</td><td><span class="team">${crest(g.home, 20)}${esc(CLUB[g.home].short)} vs ${esc(CLUB[g.away].short)}</span></td>${DEPTS.map((d) => { const v = passRate([g], d.k), f = FORMS[g.id].find((x) => x.dept === d.k); return `<td>${f.state === "missing" ? '<span class="pct bad">Missing</span>' : `<span class="pct ${pctCls(v)}">${pct(v)}</span>`}</td>`; }).join("")}<td>${issues([g]).length || "–"}</td></tr>`).join("")}</tbody></table>`;
    else if (view.tab === "check") tab = `<table><thead><tr><th>Check</th><th>Department</th><th>Done</th><th>Failed</th><th>Pass rate</th></tr></thead><tbody>${DEPTS.flatMap((d) => d.checks.map((c) => { let n = 0, f = 0; gs.forEach((g) => FORMS[g.id].forEach((x) => x.checks.forEach((y) => { if (y.c === c) { n++; if (!y.ok) f++; } }))); return { d, c, n, f }; })).sort((a, b) => b.f - a.f).map((x) => `<tr><td>${esc(x.c)}</td><td><span class="dep" style="--c:${x.d.c}">${x.d.name}</span></td><td>${x.n}</td><td>${x.f}</td><td><span class="pct ${pctCls(x.n ? 1 - x.f / x.n : null)}">${pct(x.n ? 1 - x.f / x.n : null)}</span></td></tr>`).join("")}</tbody></table>`;
    else tab = `<table><thead><tr><th>Game</th><th>Department</th><th>Note</th><th>By</th></tr></thead><tbody>${gs.slice().sort((a, b) => b.date.localeCompare(a.date)).flatMap((g) => FORMS[g.id].filter((f) => f.comment).map((f) => `<tr class="click" data-game="${g.id}"><td><span class="team">${crest(g.home, 20)}${esc(CLUB[g.home].short)} vs ${esc(CLUB[g.away].short)}</span></td><td><span class="dep" style="--c:${D[f.dept].c}">${D[f.dept].name}</span></td><td>${esc(f.comment)}</td><td>${esc(f.by)}</td></tr>`)).slice(0, 30).join("")}</tbody></table>`;
    return `<div class="head"><h1>Dashboard</h1><div class="ctl">${compSeg()}</div><p>${A.COMPS[view.comp].name} ${A.SEASON.label} · ${gs.length} games with delegates so far.</p></div>
      <div class="kpis"><div class="card kpi"><b>${gs.length}</b><span>Games played</span></div><div class="card kpi"><b>${Math.round((100 * complete) / Math.max(1, forms.length))}%</b><span>Forms complete</span></div><div class="card kpi"><b>${pct(passRate(gs))}</b><span>Checks passed</span></div><div class="card kpi"><b style="color:var(--bad)">${iss.length}</b><span>Issues reported</span></div></div>
      <div class="g3"><div class="card"><h2>Share of checks passed by round <span class="legend">${DEPTS.map((d) => `<span class="dep" style="--c:${d.c}">${d.name}</span>`).join("")}</span></h2>${lineChart()}</div>
        <div class="card"><h2>Fails most often</h2>${topChecks.map(([k, n]) => { const [dp, c] = k.split("|"); return `<div class="hb" style="--c:${D[dp].c}"><span title="${esc(c)}">${esc(c)}</span><span class="t"><i style="width:${(100 * n) / cmx}%"></i></span><span class="v">${n}</span></div>`; }).join("") || `<p class="empty">No fails.</p>`}</div>
        <div class="card"><h2>Arenas with most issues</h2>${topArenas.map(([c, n]) => `<div class="hb"><span>${crest(c, 18)}${esc(CLUB[c].arena)}</span><span class="t"><i style="width:${(100 * n) / amx}%"></i></span><span class="v">${n}</span></div>`).join("")}</div></div>
      <div class="card"><h2><span class="seg">${[["game", "By game"], ["check", "By check"], ["notes", "Notes"]].map(([k, l]) => `<button type="button" data-tab="${k}" aria-pressed="${view.tab === k}">${l}</button>`).join("")}</span></h2><div class="tw">${tab}</div></div>`;
  }
  function gamesPage() {
    const rounds = Array.from({ length: A.SEASON.next[view.comp] }, (_, i) => A.SEASON.next[view.comp] - i);
    return `<div class="head"><h1>Games</h1><div class="ctl">${compSeg()}</div><p>Every game with its three forms. Open one to see the checklist, the issues and who filled it in.</p></div>
      ${rounds.map((r) => `<div class="card" style="margin-bottom:12px"><h2>Round ${r} <small>${A.dateLong(A.gamesOf(view.comp, r)[0].date)}</small></h2><div class="tw"><table><tbody>${A.gamesOf(view.comp, r).map((g) => `<tr class="click" data-game="${g.id}" tabindex="0"><td><span class="team">${crest(g.home, 22)}${esc(CLUB[g.home].short)} ${g.played ? g.hs + "–" + g.as : "vs"} ${esc(CLUB[g.away].short)}</span></td><td style="color:var(--dim)">${esc(g.venue)}</td>${DEPTS.map((d) => { const f = FORMS[g.id].find((x) => x.dept === d.k); return `<td><span class="dep" style="--c:${d.c}">${f.state === "upcoming" ? "Upcoming" : f.state === "missing" ? "Missing" : pct(passRate([g], d.k))}</span></td>`; }).join("")}<td>${g.played && issues([g]).length ? `<span class="pct bad">${issues([g]).length} issue${issues([g]).length > 1 ? "s" : ""}</span>` : ""}</td></tr>`).join("")}</tbody></table></div></div>`).join("")}`;
  }
  function gamePage() {
    const g = A.GAME[view.game], iss = issues([g]), F = FORMS[g.id];
    return `<button class="back" type="button" data-page="games">← Games</button><div class="gh">${crest(g.home, 48)}<span class="sc">${esc(CLUB[g.home].short)} ${g.played ? g.hs + "–" + g.as : "vs"} ${esc(CLUB[g.away].short)}</span>${crest(g.away, 48)}<span style="color:var(--dim)">${A.COMPS[g.comp].name} · round ${g.round} · ${A.dateLong(g.date)}</span></div>
      <div class="g2"><div class="card"><h2>Issues <small>${iss.length}</small></h2>${iss.map((i) => `<div class="issue" style="--c:${D[i.dept].c}"><b>${esc(i.c)}</b><span>${esc(i.note)} · ${esc(i.by)}</span></div>`).join("") || `<p class="empty">${g.played ? "No issues reported." : "Not played yet."}</p>`}
        <h2 style="margin-top:16px">Notes</h2>${F.filter((f) => f.comment).map((f) => `<p style="margin:6px 0"><span class="dep" style="--c:${D[f.dept].c}">${D[f.dept].name}</span> ${esc(f.comment)}</p>`).join("") || `<p class="empty">No notes.</p>`}</div>
        <div class="card"><h2>Game facts</h2><dl class="kv"><dt>Arena</dt><dd>${esc(g.venue)}</dd><dt>Tip-off</dt><dd>${g.tip}</dd><dt>Attendance</dt><dd>${F.attendance ? fmt(F.attendance) : "–"}</dd><dt>Checks passed</dt><dd>${pct(passRate([g]))}</dd>${DEPTS.map((d) => { const f = F.find((x) => x.dept === d.k); return `<dt>${d.name} form</dt><dd>${f.state === "upcoming" ? "Opens on game day" : f.state === "missing" ? '<span style="color:var(--bad)">Not filled in</span>' : `${f.state === "partial" ? "Partial · " : ""}${esc(f.by)} at ${f.at}`}</dd>`; }).join("")}</dl></div></div>
      <div class="g3" style="grid-template-columns:repeat(3,minmax(0,1fr))">${DEPTS.map((d) => { const f = F.find((x) => x.dept === d.k); return `<div class="card"><h2><span class="dep" style="--c:${d.c}">${d.name}</span><small>${f.checks.length ? `${f.checks.filter((c) => c.ok).length} of ${d.checks.length} passed` : f.state}</small></h2>${d.checks.map((c) => { const x = f.checks.find((y) => y.c === c); return `<div class="chk"><span class="ic ${!x ? "na" : x.ok ? "ok" : "no"}">${!x ? "–" : x.ok ? "✓" : "✕"}</span><span>${esc(c)}${x && !x.ok ? `<small>${esc(x.note)}</small>` : ""}</span></div>`; }).join("")}</div>`; }).join("")}</div>`;
  }
  function teams() {
    const rows = A.clubsOf(view.comp).map((c) => { const gs = compGames().filter((g) => g.home === c.code); return { c, gs, all: passRate(gs), d: DEPTS.map((d) => passRate(gs, d.k)), n: issues(gs).length }; }).sort((a, b) => (a.all ?? 1) - (b.all ?? 1));
    return `<div class="head"><h1>Teams</h1><div class="ctl">${compSeg()}</div><p>Home games only: how each arena did on the checklist. Lowest first.</p></div>
      <div class="card tw"><table><thead><tr><th>Team</th><th>Arena</th><th>Home games</th><th>All checks</th>${DEPTS.map((d) => `<th><span class="dep" style="--c:${d.c}">${d.name}</span></th>`).join("")}<th>Issues</th></tr></thead><tbody>${rows.map((x) => `<tr><td><span class="team">${crest(x.c.code, 22)}${esc(x.c.name)}</span></td><td>${esc(x.c.arena)}</td><td>${x.gs.length}</td><td><span class="pct ${pctCls(x.all)}">${pct(x.all)}</span></td>${x.d.map((v) => `<td><span class="pct ${pctCls(v)}">${pct(v)}</span></td>`).join("")}<td>${x.n}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function submissions() {
    const rounds = Array.from({ length: A.SEASON.next[view.comp] + 1 }, (_, i) => i + 1);
    const byKey = {}; A.GAMES.filter((g) => g.comp === view.comp).forEach((g) => (byKey[g.home + ":" + g.round] = g));
    const all = compGames().flatMap((g) => FORMS[g.id]); const cnt = (s) => all.filter((f) => f.state === s).length;
    return `<div class="head"><h1>Submissions</h1><div class="ctl">${compSeg()}</div><p>Three bars per home game: competition, marketing and media. ${cnt("complete")} complete, ${cnt("partial")} partial, ${cnt("missing")} missing.</p></div>
      <div class="card"><div class="legend leg" style="margin-bottom:12px"><span><i style="background:var(--ok)"></i>Complete</span><span><i style="background:var(--warn)"></i>Partial</span><span><i style="background:var(--bad)"></i>Missing</span><span><i style="border:1px dashed var(--edge)"></i>Upcoming</span></div>
      <div class="tw"><table class="sub-grid"><thead><tr><th>Home team</th>${rounds.map((r) => `<th style="text-align:center">${r}</th>`).join("")}</tr></thead><tbody>${A.clubsOf(view.comp).map((c) => `<tr><td><span class="team">${crest(c.code, 20)}${esc(c.short)}</span></td>${rounds.map((r) => { const g = byKey[c.code + ":" + r]; if (!g) return `<td class="c"></td>`; return `<td class="c"><button type="button" class="trio" data-game="${g.id}" style="background:none;border:0;cursor:pointer;padding:2px" title="R${r} vs ${esc(CLUB[g.away].short)}: ${FORMS[g.id].map((f) => D[f.dept].name + " " + f.state).join(", ")}">${FORMS[g.id].map((f) => `<i class="${f.state}"></i>`).join("")}</button></td>`; }).join("")}</tr>`).join("")}</tbody></table></div></div>`;
  }
  const nights = () => [...new Set(A.GAMES.filter((g) => g.played).map((g) => g.date))].sort().reverse();
  function compose(date) {
    const gs = A.GAMES.filter((g) => g.date === date), iss = issues(gs);
    return `Night report · ${A.dateLong(date)}\n\n${gs.length} games with delegates: ${gs.map((g) => `${CLUB[g.home].short} ${g.hs}–${g.as} ${CLUB[g.away].short}`).join(", ")}.\nChecks passed: ${pct(passRate(gs))}.\n\n` + (iss.length ? `Issues (${iss.length}):\n` + iss.map((i) => `- ${CLUB[i.g.home].short} vs ${CLUB[i.g.away].short} · ${D[i.dept].name}: ${i.c}. ${i.note}`).join("\n") : "No issues reported tonight.") + `\n\nMissing forms: ${gs.flatMap((g) => FORMS[g.id].filter((f) => f.state === "missing").map((f) => `${CLUB[g.home].short} (${D[f.dept].name})`)).join(", ") || "none"}.\n\nCompetition Department`;
  }
  function nightPage() {
    const ns = nights(), date = view.night || ns[0], sent = store.get("sent", []), drafts = store.get("drafts", {});
    return `<div class="head"><h1>Night reports</h1><p>The app writes a draft after the last game of the night. Check it, edit it and send it to the department heads.</p></div>
      <div class="nr"><div class="card"><h2>Draft <select data-night aria-label="Game night">${ns.slice(0, 20).map((d) => `<option value="${d}"${d === date ? " selected" : ""}>${A.dateLong(d)} · ${A.GAMES.filter((g) => g.date === d).length} games</option>`).join("")}</select></h2>
        <label style="display:grid;gap:6px;margin-bottom:10px;font-weight:600;color:var(--dim)">To<input id="to" value="competition@atlas-demo.org, marketing@atlas-demo.org, media@atlas-demo.org"></label><textarea id="body" rows="16" aria-label="Report text">${esc(drafts[date] || compose(date))}</textarea>
        <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap"><button class="btn" type="button" data-send="${date}">Send report</button><button class="btn ghost" type="button" data-redraft="${date}">Write the draft again</button></div></div>
        <div class="card"><h2>Sent <small>${sent.length}</small></h2>${sent.map((s) => `<div class="issue" style="--c:var(--ok)"><b>${A.dateLong(s.date)}</b><span>Sent ${s.at} to ${s.n} recipients</span></div>`).join("") || `<p class="empty">Nothing sent yet in this demo.</p>`}</div></div>`;
  }
  function palette() {
    const q = view.palQ.trim().toLowerCase();
    const items = [...A.CLUBS.map((c) => ({ t: c.name, s: "Team", a: { page: "teams", comp: c.comp } })), ...A.GAMES.filter((g) => g.played).map((g) => ({ t: `${CLUB[g.home].short} vs ${CLUB[g.away].short} · R${g.round}`, s: A.COMPS[g.comp].short, a: { page: "game", game: g.id, comp: g.comp } })), ...DEPTS.flatMap((d) => d.checks.map((c) => ({ t: c, s: d.name + " check", a: { page: "dash", tab: "check" } })))];
    const res = (q ? items.filter((x) => x.t.toLowerCase().includes(q)) : items.slice(0, 8)).slice(0, 12); view.palRes = res;
    return `<div class="modal-bg" data-close-bg><div class="palette" role="dialog" aria-modal="true" aria-label="Search"><input id="pq" placeholder="Search games, teams or checks…" value="${esc(view.palQ)}" autocomplete="off"><div class="res">${res.map((x, i) => `<button type="button" data-pal="${i}" class="${i === view.palI ? "on" : ""}">${esc(x.t)}<small>${x.s}</small></button>`).join("") || `<p class="empty" style="padding:12px">No results.</p>`}</div></div></div>`;
  }
  function render() {
    const nav = [["dash", "Dashboard", "◧"], ["games", "Games", "▤"], ["teams", "Teams", "◎"], ["subs", "Submissions", "▦"], ["night", "Night reports", "✉"]];
    const page = { dash, games: gamesPage, game: gamePage, teams, subs: submissions, night: nightPage }[view.page]();
    app.innerHTML = `<div class="shell"><aside><span class="brand"><i></i>Delegates</span>${nav.map(([k, l, ic]) => `<button type="button" data-page="${k}" aria-current="${view.page === k || (k === "games" && view.page === "game")}"><span aria-hidden="true">${ic}</span>${l}</button>`).join("")}<button type="button" data-search><span aria-hidden="true">⌕</span>Search<kbd>Ctrl K</kbd></button><span class="sp"></span>
      <a href="../hub/"><span aria-hidden="true">←</span>Competition Hub</a><button type="button" data-theme><span aria-hidden="true">◐</span>${view.light ? "Dark mode" : "Light mode"}</button></aside><main>${page}</main></div>${view.pal ? palette() : ""}${view.toast ? `<div class="toast" role="status">${esc(view.toast)}</div>` : ""}`;
    if (view.toast) setTimeout(() => { view.toast = ""; const t = app.querySelector(".toast"); if (t) t.remove(); }, 2200);
    const pq = app.querySelector("#pq"); if (pq) { pq.focus(); pq.setSelectionRange(pq.value.length, pq.value.length); }
  }
  app.addEventListener("click", (e) => {
    const d = (s) => e.target.closest(s);
    if (d("[data-pal]")) { const x = view.palRes[+d("[data-pal]").dataset.pal]; return go({ ...x.a, pal: false, palQ: "" }); }
    if (e.target.matches("[data-close-bg]")) return go({ pal: false });
    if (d("[data-page]")) { window.scrollTo(0, 0); return go({ page: d("[data-page]").dataset.page }); }
    if (d("[data-game]")) { window.scrollTo(0, 0); return go({ page: "game", game: d("[data-game]").dataset.game }); }
    if (d("[data-comp]")) return go({ comp: d("[data-comp]").dataset.comp });
    if (d("[data-tab]")) return go({ tab: d("[data-tab]").dataset.tab });
    if (d("[data-search]")) return go({ pal: true, palQ: "", palI: 0 });
    if (d("[data-theme]")) { view.light = !view.light; store.set("light", view.light); document.body.classList.toggle("light", view.light); return render(); }
    if (d("[data-send]")) { const date = d("[data-send]").dataset.send, sent = store.get("sent", []); sent.unshift({ date, at: new Date().toTimeString().slice(0, 5), n: app.querySelector("#to").value.split(",").filter((x) => x.trim()).length }); store.set("sent", sent.slice(0, 10)); return go({ toast: "Night report sent" }); }
    if (d("[data-redraft]")) { const drafts = store.get("drafts", {}); delete drafts[d("[data-redraft]").dataset.redraft]; store.set("drafts", drafts); return render(); }
  });
  app.addEventListener("change", (e) => { if (e.target.matches("[data-night]")) go({ night: e.target.value }); });
  app.addEventListener("input", (e) => {
    if (e.target.id === "pq") { view.palQ = e.target.value; view.palI = 0; render(); }
    if (e.target.id === "body") { const drafts = store.get("drafts", {}); drafts[view.night || nights()[0]] = e.target.value; store.set("drafts", drafts); }
  });
  app.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("tr[data-game]")) go({ page: "game", game: e.target.dataset.game }); });
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); return go({ pal: !view.pal, palQ: "", palI: 0 }); }
    if (!view.pal) return;
    if (e.key === "Escape") go({ pal: false });
    if (e.key === "ArrowDown" || e.key === "ArrowUp") { e.preventDefault(); view.palI = Math.max(0, Math.min((view.palRes || []).length - 1, view.palI + (e.key === "ArrowDown" ? 1 : -1))); render(); }
    if (e.key === "Enter" && view.palRes && view.palRes[view.palI]) go({ ...view.palRes[view.palI].a, pal: false, palQ: "" });
  });
  render();
  A.ribbon("Delegates", "delegates");
})();
