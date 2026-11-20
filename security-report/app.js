/* Security Reports (demo). Clubs file a report after every home game through a personal link;
   the competition department follows completion, stats and incidents. Invented data. */
(function () {
  "use strict";
  const A = window.ATLAS, { esc, fmt, crest, CLUB } = A;
  const app = document.getElementById("app");
  const store = A.store("security-report");

  // ---------- questionnaire ----------
  const USHER_LOC = ["Entrances", "Stands", "Visiting fans sector", "Court side", "Exits and corridors"];
  const POLICE = ["Local and national police, inside and outside", "Local police outside only", "Private security only"];
  const MEETING = ["The day before the game", "Morning of the game", "2 hours before tip-off", "No security meeting"];
  const INCIDENTS = ["Pyrotechnics", "Objects thrown", "Discriminatory chants", "Court invasion", "Fights between fans", "Banners against the rules", "Laser pointers", "Damage to the arena"];
  const STEPS = ["Game", "Staff & police", "Meeting & risk", "Visiting fans", "Incidents", "Review"];

  // ---------- data ----------
  function genReport(g) {
    const r = A.rng(5000 + g.code * 13 + (g.comp === "C" ? 7 : 0));
    const c = CLUB[g.home], risky = (c.code.charCodeAt(1) % 5) / 10;
    const inc = r.chance(0.13 + risky * 0.35) ? r.shuffle(INCIDENTS).slice(0, r.chance(0.3) ? 2 : 1) : [];
    return {
      spectators: Math.round(c.capacity * (0.55 + r.next() * 0.43)), by: r.pick(["Head of security", "Security manager", "Venue manager"]),
      ushers: Math.round(c.capacity / 220 * (0.85 + r.next() * 0.3)), usherLoc: r.shuffle(USHER_LOC).slice(0, r.int(2, 4)),
      stewards: r.int(18, 60), stewardLoc: r.shuffle(USHER_LOC).slice(0, r.int(2, 3)), police: r.pick(POLICE),
      ambulance: "Yes", ambulances: r.int(1, 3), paramedics: r.int(4, 12), fire: r.chance(0.7) ? "Yes" : "No",
      meeting: r.pick(MEETING.slice(0, 3)), meetingNotes: "Club security, police liaison and the visiting team's security manager.",
      risk: inc.length > 1 ? "High" : inc.length || r.chance(0.15) ? "Medium" : "Low", extra: inc.length ? "Yes" : "No", extraWhat: inc.length ? "Extra stewards around the visiting sector." : "",
      visDirector: r.chance(0.6) ? "Yes" : "No", visFans: r.chance(0.55) ? "Yes" : "No", visSection: "Yes", visDetails: `${r.int(20, 400)} fans in the north corner, segregated with two rows of stewards.`,
      shared: "Yes", damages: inc.includes("Damage to the arena") ? "Yes" : "No", footage: inc.length ? "Yes" : "No", inspection: "Yes",
      breach: r.chance(0.06) ? "Yes" : "No", breachHow: "Reported by the visiting team's security manager.",
      incidents: inc.length ? "Yes" : "No", incidentTypes: inc, other: "No", otherWhat: "", anything: "",
    };
  }
  const saved = store.get("reports", {});
  const REPORTS = {};
  A.GAMES.filter((g) => g.played).forEach((g) => {
    const r = A.rng(4000 + g.code + (g.comp === "C" ? 999 : 0));
    const last = g.round === A.SEASON.played[g.comp];
    if (saved[g.id]) REPORTS[g.id] = { ...saved[g.id], submittedAt: saved[g.id].submittedAt };
    else if (!r.chance(last ? 0.45 : 0.08)) REPORTS[g.id] = { ...genReport(g), submittedAt: A.addDays(g.date, r.int(0, 2)) };
  });
  const alertsOf = (rep) => [rep.incidents === "Yes" && "Incidents", rep.breach === "Yes" && "Code of Conduct breach", rep.damages === "Yes" && "Damages", rep.risk === "High" && "High risk"].filter(Boolean);
  function state(g) {
    if (!g.played) return "upcoming";
    if (REPORTS[g.id]) return "submitted";
    return g.round === A.SEASON.played[g.comp] ? "pending" : "overdue";
  }

  let view = { role: null, comp: "L", club: null, game: null, step: 0, form: {}, tab: "grid", report: null, inc: { type: "", round: "" } };
  const go = (patch) => { Object.assign(view, patch); render(); window.scrollTo(0, 0); };

  // ---------- start ----------
  function start() {
    app.innerHTML = `<div class="start"><div class="start-box"><span class="kicker">Atlas Basketball · Competition</span>
      <h1>Security <span>reports</span></h1>
      <p class="lede">After every home game, the club's security manager files one report: staff, police, medical services, the visiting fans and any incident. The competition department follows completion and incidents in a dashboard.</p>
      <div class="roles"><button class="role" type="button" data-role="club"><b>Club view</b><span>What the home club's security manager sees through the personal link sent after each game.</span><em>Open as a club →</em></button>
      <button class="role dark" type="button" data-role="admin"><b>Competition staff</b><span>Completion grid, team stats and incidents, opened from the Competition Hub.</span><em>Open the dashboard →</em></button></div></div></div>`;
  }
  // ---------- club ----------
  function clubTop() { const c = CLUB[view.club]; return `<header class="club-top"><div class="in"><span class="who">${crest(c.code, 28)}${esc(c.name)} · Security reports</span><span><button type="button" data-go="dashboard">My home games</button> <button type="button" data-go="logout">Log out</button></span></div></header>`; }
  function clubLogin(err) {
    app.innerHTML = `<div class="login-card"><span class="kicker">Personal link</span><h1>Security report</h1><p>Each club gets its own link and password before the season. Pick a club to continue.</p>
      <form id="lf" novalidate><label class="f">Club<select id="lc">${A.CLUBS.map((c) => `<option value="${c.code}">${esc(c.name)} · ${A.COMPS[c.comp].short}</option>`).join("")}</select></label>
      <label class="f">Password<input id="lp" type="password" value="demo" autocomplete="current-password"></label><div class="err">${err || ""}</div>
      <button class="btn-or" type="submit">Log in</button> <button class="btn-ghost" type="button" data-role="">Back</button></form></div>`;
    app.querySelector("#lf").onsubmit = (e) => { e.preventDefault(); if (!app.querySelector("#lp").value) return clubLogin("Enter the password from your welcome email."); go({ club: app.querySelector("#lc").value, role: "club", page: "dashboard" }); };
  }
  function dashboard() {
    const c = CLUB[view.club], games = A.GAMES.filter((g) => g.home === c.code).sort((a, b) => (a.played === b.played ? (a.played ? b.round - a.round : a.round - b.round) : a.played ? -1 : 1));
    app.innerHTML = clubTop() + `<div class="wrap"><div class="hero-strip"><h1>Home games</h1><p>Fill in one report after each home game. The link opens when the game ends.</p></div>
      <div class="games">${games.map((g) => { const s = state(g); return `<div class="g"><span class="rd">R${g.round}</span><div><div class="vs">${crest(g.home, 22)}${esc(CLUB[g.home].short)} vs ${crest(g.away, 22)}${esc(CLUB[g.away].short)}</div><div class="meta">${A.dateLong(g.date)} · ${g.tip} · ${esc(g.venue)}</div></div>
        <div>${s === "submitted" ? `<span class="st ok">Submitted</span> <button class="act" type="button" data-fill="${g.id}">Edit</button>` : s === "upcoming" ? `<span class="st wait">Available after ${A.dateShort(g.date)}</span>` : `<span class="st need">Needs report</span> <button class="act" type="button" data-fill="${g.id}">Fill report →</button>`}</div></div>`; }).join("")}</div></div>`;
  }
  const yn = (k) => `<div class="yn" role="group">${["Yes", "No"].map((v) => `<button type="button" data-yn="${k}" data-v="${v}" aria-pressed="${view.form[k] === v}">${v}</button>`).join("")}</div>`;
  const multi = (k, opts) => `<div class="opts">${opts.map((o) => `<label><input type="checkbox" data-multi="${k}" value="${esc(o)}"${(view.form[k] || []).includes(o) ? " checked" : ""}> ${esc(o)}</label>`).join("")}</div>`;
  const sel = (k, opts) => `<select data-f="${k}"><option value="">Select…</option>${opts.map((o) => `<option${view.form[k] === o ? " selected" : ""}>${esc(o)}</option>`).join("")}</select>`;
  const inp = (k, type = "text", ph = "") => `<input data-f="${k}" type="${type}" value="${esc(view.form[k] ?? "")}" placeholder="${ph}"${type === "number" ? ' min="0" inputmode="numeric"' : ""}>`;
  const ta = (k) => `<textarea data-f="${k}" rows="3">${esc(view.form[k] ?? "")}</textarea>`;
  const q = (label, html, req = true, show = true) => show ? `<div class="q"><span class="ql">${label}${req ? ' <span class="req">*</span>' : ""}</span>${html}</div>` : "";
  function stepHtml() {
    const f = view.form;
    switch (view.step) {
      case 0: return `<h2>Game & attendance</h2>${q("Official number of spectators in the arena", inp("spectators", "number", "e.g. 8400"))}${q("Name of the person completing this report", inp("by", "text", "Name and role"))}`;
      case 1: return `<h2>Staff & police presence</h2>${q("How many ushers were present?", inp("ushers", "number"))}${q("Where were the ushers located? (select all that apply)", multi("usherLoc", USHER_LOC))}${q("How many stewards were present?", inp("stewards", "number"))}${q("Where were the stewards located?", multi("stewardLoc", USHER_LOC))}${q("What type of police were present, and where?", sel("police", POLICE))}${q("Was an ambulance present?", yn("ambulance"))}${q("How many ambulances?", inp("ambulances", "number"), false, f.ambulance === "Yes")}${q("How many paramedics were present?", inp("paramedics", "number"))}${q("Was the fire brigade present?", yn("fire"))}`;
      case 2: return `<h2>Security meeting & risk</h2>${q("When did the security meeting take place?", sel("meeting", MEETING))}${q("Who took part and what was decided?", ta("meetingNotes"), true, f.meeting && f.meeting !== "No security meeting")}${q("What was the risk evaluation before this game?", sel("risk", ["Low", "Medium", "High"]))}${q("Did you take any additional security measures?", yn("extra"))}${q("What were the additional measures?", ta("extraWhat"), false, f.extra === "Yes")}`;
      case 3: return `<h2>Visiting fans</h2>${q("Did the visiting club's security director travel to the game?", yn("visDirector"))}${q("Did any fans of the visiting club attend?", yn("visFans"))}${q("Was there a designated section for them?", yn("visSection"), true, f.visFans === "Yes")}${q("How many fans, where, and how were they separated?", ta("visDetails"), true, f.visFans === "Yes")}${q("Did you share information with the visiting team's security manager?", yn("shared"))}${q("Were there any damages caused by visiting fans?", yn("damages"))}${q("Have you shared the relevant footage?", yn("footage"))}${q("Was the arena inspected right after the fans left?", yn("inspection"))}`;
      case 4: return `<h2>Incidents</h2>${q("Was any breach of the Code of Conduct reported to you?", yn("breach"))}${q("How were you informed?", ta("breachHow"), false, f.breach === "Yes")}${q("Were there any incidents?", yn("incidents"))}${q("Select all that apply", multi("incidentTypes", INCIDENTS), true, f.incidents === "Yes")}${q("Any other incident or damage not listed?", yn("other"))}${q("Please describe", ta("otherWhat"), false, f.other === "Yes")}${q("Is there anything else you would like to report?", ta("anything"), false)}`;
      default: {
        const rows = [["Spectators", f.spectators], ["Completed by", f.by], ["Ushers", `${f.ushers || "–"} · ${(f.usherLoc || []).join(", ")}`], ["Stewards", `${f.stewards || "–"} · ${(f.stewardLoc || []).join(", ")}`], ["Police", f.police], ["Ambulances / paramedics", `${f.ambulance === "Yes" ? f.ambulances || 1 : 0} / ${f.paramedics || "–"}`], ["Security meeting", f.meeting], ["Risk evaluation", f.risk], ["Visiting fans", f.visFans], ["Damages", f.damages], ["Incidents", f.incidents === "Yes" ? (f.incidentTypes || []).join(", ") : "None"]];
        return `<h2>Review and send</h2><dl class="review">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v || "–")}</dd>`).join("")}</dl>`;
      }
    }
  }
  const NEED = [["spectators", "by"], ["ushers", "stewards", "police", "ambulance", "paramedics", "fire"], ["meeting", "risk", "extra"], ["visDirector", "visFans", "shared", "damages", "footage", "inspection"], ["breach", "incidents", "other"]];
  function form(err) {
    const g = A.GAME[view.game];
    app.innerHTML = clubTop() + `<div class="wrap"><div class="hero-strip"><h1>${esc(CLUB[g.home].short)} vs ${esc(CLUB[g.away].short)}</h1><p>Round ${g.round} · ${A.dateLong(g.date)} · ${esc(g.venue)} · final ${g.hs}–${g.as}</p></div>
      <div class="stepper">${STEPS.map((s, i) => `<span class="${i === view.step ? "on" : i < view.step ? "done" : ""}">${i + 1}. ${s}</span>`).join("")}</div>
      <form class="sheet" id="sf" novalidate>${stepHtml()}<div class="err">${err || ""}</div>
        <div class="nav-btns">${view.step ? `<button class="btn-ghost" type="button" data-back>← Back</button>` : `<button class="btn-ghost" type="button" data-go="dashboard">← Back to dashboard</button>`}<button class="btn-or" type="submit">${view.step === 5 ? "Send report" : "Continue"}</button></div></form></div>`;
    const f = app.querySelector("#sf");
    f.oninput = (e) => { const k = e.target.dataset.f; if (k) view.form[k] = e.target.value; const m = e.target.dataset.multi; if (m) view.form[m] = [...f.querySelectorAll(`[data-multi="${m}"]:checked`)].map((x) => x.value); };
    f.onchange = (e) => { if (e.target.tagName === "SELECT") { view.form[e.target.dataset.f] = e.target.value; form(); } };
    f.onclick = (e) => { const b = e.target.closest("[data-yn]"); if (b) { view.form[b.dataset.yn] = b.dataset.v; form(); } if (e.target.closest("[data-back]")) { view.step--; form(); } };
    f.onsubmit = (e) => {
      e.preventDefault();
      if (view.step < 5) {
        const miss = (NEED[view.step] || []).filter((k) => view.form[k] == null || view.form[k] === "");
        if (miss.length) return form("Please answer every question marked with *.");
        view.step++; return form();
      }
      const all = store.get("reports", {}); all[g.id] = { ...view.form, submittedAt: A.TODAY }; store.set("reports", all);
      REPORTS[g.id] = all[g.id];
      app.innerHTML = clubTop() + `<div class="wrap"><div class="sheet done-box"><h2>Report sent</h2><p>Thank you. The competition department sees it in the completion grid now, and the reminders for this game stop.</p><button class="btn-or" type="button" data-go="dashboard">Back to my games</button> <button class="btn-ghost" type="button" data-admin-game="${g.id}">See it in the staff dashboard</button></div></div>`;
    };
  }
  // ---------- admin ----------
  function bar() {
    return `<header class="bar"><span class="app"><i></i>Security reports</span><nav class="tabs">${[["grid", "Completion grid"], ["stats", "Team stats"], ["incidents", "Incidents"], ["istats", "Incident stats"]].map(([k, l]) => `<button type="button" data-tab="${k}" aria-selected="${view.tab === k}">${l}</button>`).join("")}</nav>
      <div class="right"><a class="ghost" href="../hub/">Back to hub</a><button class="ghost" type="button" data-role="">Sign out</button></div></header>`;
  }
  const ctoggle = () => `<div class="ctoggle" role="group" aria-label="Competition">${["L", "C"].map((c) => `<button type="button" data-comp="${c}" aria-pressed="${view.comp === c}">${A.COMPS[c].name}</button>`).join("")}</div>`;
  const compGames = () => A.GAMES.filter((g) => g.comp === view.comp);
  function grid() {
    const games = compGames(), played = games.filter((g) => g.played);
    const sub = played.filter((g) => REPORTS[g.id]), alerts = sub.filter((g) => alertsOf(REPORTS[g.id]).length);
    const rounds = Array.from({ length: 34 }, (_, i) => i + 1).filter((r) => r <= A.SEASON.next[view.comp] + 3);
    const byKey = {}; games.forEach((g) => { byKey[g.home + ":" + g.round] = { g, home: true }; byKey[g.away + ":" + g.round] = { g, home: false }; });
    return `<h1><b>Completion</b> grid</h1><p class="sub">Every home game's security report, team by team. Click a green square to open the report. A dark dot means the report needs a closer look.</p>
      <div class="stats-row"><div class="card stat good"><div class="v">${sub.length}</div><div class="l">Reports submitted</div></div><div class="card stat warn"><div class="v">${played.filter((g) => state(g) === "pending").length}</div><div class="l">Open, not yet submitted</div></div><div class="card stat bad"><div class="v">${played.filter((g) => state(g) === "overdue").length}</div><div class="l">Overdue</div></div><div class="card stat flag"><div class="v">${alerts.length}</div><div class="l">Reports with alerts</div></div><div class="card stat"><div class="v">${Math.round((100 * sub.length) / Math.max(1, played.length))}%</div><div class="l">Completion rate so far</div></div></div>
      <div class="toolbar">${ctoggle()}<div class="legend"><span><i class="sq s-submitted"></i>Submitted</span><span><i class="sq s-submitted"><b class="dot"></b></i>With alerts</span><span><i class="sq s-pending"></i>Open</span><span><i class="sq s-overdue"></i>Overdue</span><span><i class="sq s-upcoming"></i>Not played yet</span><span><i class="sq s-away"></i>Away game</span></div></div>
      <div class="card grid-wrap"><table class="grid"><thead><tr><th class="team" style="text-align:left">Team</th>${rounds.map((r) => `<th>${r}</th>`).join("")}</tr></thead><tbody>${A.clubsOf(view.comp).map((c) => `<tr><td class="team"><span class="team-cell">${crest(c.code, 20)}${esc(c.short)}</span></td>${rounds.map((r) => {
        const x = byKey[c.code + ":" + r]; if (!x) return "<td></td>";
        const g = x.g, opp = CLUB[x.home ? g.away : g.home].short;
        if (!x.home) return `<td><i class="sq s-away" title="Round ${r} at ${esc(opp)}, ${g.date}. Away game"></i></td>`;
        const s = state(g), al = s === "submitted" ? alertsOf(REPORTS[g.id]) : [];
        return s === "submitted" ? `<td><button type="button" class="sq s-submitted" data-open="${g.id}" title="Round ${r} vs ${esc(opp)}. Submitted${al.length ? ". Alerts: " + al.join(", ") : ""}. Click to open">${al.length ? '<b class="dot"></b>' : ""}</button></td>` : `<td><i class="sq s-${s}" title="Round ${r} vs ${esc(opp)}, ${g.date}. ${{ pending: "Open, waiting for report", overdue: "Overdue", upcoming: "Not played yet" }[s]}"></i></td>`;
      }).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  function stats() {
    const rows = A.clubsOf(view.comp).map((c) => {
      const reps = compGames().filter((g) => g.home === c.code && REPORTS[g.id]).map((g) => REPORTS[g.id]);
      const avg = (k) => reps.length ? Math.round(reps.reduce((s, r) => s + (+r[k] || 0), 0) / reps.length) : 0;
      const types = {}; reps.forEach((r) => (r.incidentTypes || []).forEach((t) => (types[t] = (types[t] || 0) + 1)));
      const top = Object.entries(types).sort((a, b) => b[1] - a[1])[0];
      return { c, n: reps.length, spec: avg("spectators"), ush: avg("ushers"), stw: avg("stewards"), par: avg("paramedics"), amb: reps.length ? Math.round((100 * reps.filter((r) => r.ambulance === "Yes").length) / reps.length) : 0, inc: reps.filter((r) => r.incidents === "Yes").length, top: top ? top[0] : "–" };
    }).sort((a, b) => b.spec - a.spec);
    return `<h1><b>Team</b> stats</h1><p class="sub">Averages per home game from the submitted reports.</p><div class="toolbar">${ctoggle()}<button class="btn-a" type="button" data-csv="stats">Download CSV</button></div>
      <div class="card tw"><table class="t"><thead><tr><th>Team</th><th>Reports</th><th>Spectators</th><th>Ushers</th><th>Stewards</th><th>Paramedics</th><th>Ambulance</th><th>Games with incidents</th><th>Most common incident</th></tr></thead><tbody>${rows.map((x) => `<tr><td><span class="team-cell">${crest(x.c.code, 22)}${esc(x.c.name)}</span></td><td>${x.n}</td><td>${fmt(x.spec)}</td><td>${x.ush}</td><td>${x.stw}</td><td>${x.par}</td><td>${x.amb}%</td><td>${x.inc}</td><td>${x.top === "–" ? "–" : `<span class="tag">${esc(x.top)}</span>`}</td></tr>`).join("")}</tbody></table></div>`;
  }
  function incidentRows() {
    return compGames().filter((g) => REPORTS[g.id] && alertsOf(REPORTS[g.id]).length).map((g) => ({ g, rep: REPORTS[g.id] }))
      .filter((x) => (!view.inc.type || (x.rep.incidentTypes || []).includes(view.inc.type)) && (!view.inc.round || x.g.round === +view.inc.round)).sort((a, b) => b.g.date.localeCompare(a.g.date));
  }
  function incidents() {
    const rows = incidentRows();
    return `<h1><b>Incidents</b></h1><p class="sub">Every report with an incident, a Code of Conduct breach, damages or a high-risk evaluation.</p>
      <div class="toolbar">${ctoggle()}<button class="btn-a" type="button" data-word>Download Word</button></div>
      <div class="filters"><label>Incident type<select data-inc="type"><option value="">All types</option>${INCIDENTS.map((t) => `<option${view.inc.type === t ? " selected" : ""}>${t}</option>`).join("")}</select></label><label>Round<select data-inc="round"><option value="">All rounds</option>${Array.from({ length: A.SEASON.played[view.comp] }, (_, i) => `<option${view.inc.round === String(i + 1) ? " selected" : ""}>${i + 1}</option>`).join("")}</select></label></div>
      <div class="card tw"><table class="t"><thead><tr><th>Date</th><th>Round</th><th>Game</th><th>Alerts</th><th>Incident types</th><th></th></tr></thead><tbody>${rows.map(({ g, rep }) => `<tr><td>${g.date}</td><td>${g.round}</td><td><span class="team-cell">${crest(g.home, 20)}${esc(CLUB[g.home].short)} vs ${esc(CLUB[g.away].short)}</span></td><td>${alertsOf(rep).map((a) => `<span class="tag">${a}</span>`).join("")}</td><td>${(rep.incidentTypes || []).join(", ") || "–"}</td><td><button class="ghost" type="button" data-open="${g.id}">Open</button></td></tr>`).join("") || `<tr><td colspan="6" style="color:var(--a-dim);padding:24px">No incidents for these filters.</td></tr>`}</tbody></table></div>`;
  }
  function istats() {
    const reps = compGames().filter((g) => REPORTS[g.id]).map((g) => ({ g, r: REPORTS[g.id] }));
    const byType = {}; reps.forEach(({ r }) => (r.incidentTypes || []).forEach((t) => (byType[t] = (byType[t] || 0) + 1)));
    const byRound = {}; reps.forEach(({ g, r }) => { if (r.incidents === "Yes") byRound[g.round] = (byRound[g.round] || 0) + 1; });
    const byTeam = {}; reps.forEach(({ g, r }) => { if (r.incidents === "Yes") byTeam[g.home] = (byTeam[g.home] || 0) + 1; });
    const hb = (rows, lab) => { const m = Math.max(1, ...rows.map((x) => x[1])); return rows.map(([k, v]) => `<div class="hb"><span>${lab(k)}</span><span class="t"><i style="width:${(100 * v) / m}%"></i></span><span class="v">${v}</span></div>`).join("") || `<p style="color:var(--a-dim)">No incidents yet.</p>`; };
    return `<h1><b>Incident</b> stats</h1><p class="sub">${reps.filter((x) => x.r.incidents === "Yes").length} of ${reps.length} reports this season include an incident.</p><div class="toolbar">${ctoggle()}</div>
      <div class="two"><div class="card"><h3 style="margin-top:0">By type</h3>${hb(Object.entries(byType).sort((a, b) => b[1] - a[1]), esc)}</div><div class="card"><h3 style="margin-top:0">By home team</h3>${hb(Object.entries(byTeam).sort((a, b) => b[1] - a[1]).slice(0, 10), (k) => `<span class="team-cell">${crest(k, 18)}${esc(CLUB[k].name)}</span>`)}</div>
      <div class="card" style="grid-column:1/-1"><h3 style="margin-top:0">By round</h3>${hb(Object.entries(byRound).sort((a, b) => a[0] - b[0]), (k) => "Round " + k)}</div></div>`;
  }
  function report() {
    const g = A.GAME[view.report], rep = REPORTS[g.id], al = alertsOf(rep);
    const rows = [["Spectators", fmt(rep.spectators)], ["Completed by", rep.by], ["Ushers", `${rep.ushers} · ${(rep.usherLoc || []).join(", ")}`], ["Stewards", `${rep.stewards} · ${(rep.stewardLoc || []).join(", ")}`], ["Police", rep.police], ["Ambulances", rep.ambulance === "Yes" ? rep.ambulances : "None"], ["Paramedics", rep.paramedics], ["Fire brigade", rep.fire], ["Security meeting", rep.meeting], ["Risk evaluation", rep.risk], ["Additional measures", rep.extra === "Yes" ? rep.extraWhat || "Yes" : "No"], ["Visiting security director travelled", rep.visDirector], ["Visiting fans", rep.visFans === "Yes" ? rep.visDetails || "Yes" : "No"], ["Damages", rep.damages], ["Footage shared", rep.footage], ["Code of Conduct breach", rep.breach], ["Incidents", rep.incidents === "Yes" ? (rep.incidentTypes || []).join(", ") : "None"], ["Submitted", rep.submittedAt]];
    return `<p><button class="ghost" type="button" data-tab="grid">← Completion grid</button></p><div class="report-head">${crest(g.home, 44)}<span class="score">${g.hs}–${g.as}</span>${crest(g.away, 44)}<div><h1 style="font-size:28px;margin:0"><b>${esc(CLUB[g.home].name)}</b> vs ${esc(CLUB[g.away].name)}</h1><span class="sub">${A.COMPS[g.comp].name} · round ${g.round} · ${A.dateLong(g.date)} · ${esc(g.venue)}</span></div></div>
      ${al.length ? `<div class="alert-box"><b>Alerts:</b> ${al.map((a) => `<span class="tag">${a}</span>`).join("")}</div>` : `<div class="alert-box" style="border-color:rgba(62,201,138,.35);background:rgba(62,201,138,.08)"><span class="tag ok">No alerts</span></div>`}
      <div class="card"><dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v ?? "–")}</dd>`).join("")}</dl></div>`;
  }
  function admin() {
    const page = view.report ? report() : { grid, stats, incidents, istats }[view.tab]();
    app.innerHTML = `<div class="admin">${bar()}<main class="page">${page}</main></div>`;
  }
  // ---------- routing ----------
  function render() {
    if (!view.role) return start();
    if (view.role === "club-login") return clubLogin();
    if (view.role === "club") return view.page === "form" ? form() : dashboard();
    return admin();
  }
  app.addEventListener("click", (e) => {
    const t = e.target;
    const role = t.closest("[data-role]"); if (role) return go({ role: role.dataset.role === "club" ? "club-login" : role.dataset.role || null, report: null, tab: "grid" });
    const gg = t.closest("[data-go]"); if (gg) return gg.dataset.go === "logout" ? go({ role: null, club: null }) : go({ page: "dashboard" });
    const fill = t.closest("[data-fill]"); if (fill) { const id = fill.dataset.fill; return go({ page: "form", game: id, step: 0, form: REPORTS[id] ? JSON.parse(JSON.stringify(REPORTS[id])) : {} }); }
    const ag = t.closest("[data-admin-game]"); if (ag) return go({ role: "admin", comp: A.GAME[ag.dataset.adminGame].comp, report: ag.dataset.adminGame });
    const tab = t.closest("[data-tab]"); if (tab) return go({ tab: tab.dataset.tab, report: null });
    const comp = t.closest("[data-comp]"); if (comp) return go({ comp: comp.dataset.comp });
    const open = t.closest("[data-open]"); if (open) return go({ report: open.dataset.open });
    if (t.closest("[data-word]")) {
      const rows = incidentRows();
      const html = `<html><head><meta charset="utf-8"><title>Incidents</title></head><body style="font-family:Calibri,Arial"><h1>Security report incidents · ${A.COMPS[view.comp].name} ${A.SEASON.label}</h1>${rows.map(({ g, rep }) => `<h2>${esc(CLUB[g.home].name)} vs ${esc(CLUB[g.away].name)} · round ${g.round} · ${g.date}</h2><p><b>Alerts:</b> ${alertsOf(rep).join(", ")}</p><p><b>Incidents:</b> ${(rep.incidentTypes || []).join(", ") || "None"}</p><p><b>Risk evaluation:</b> ${rep.risk}. <b>Spectators:</b> ${rep.spectators}. <b>Stewards:</b> ${rep.stewards}.</p>`).join("")}</body></html>`;
      return A.download(`incidents_${view.comp}.doc`, html, "application/msword");
    }
    const csv = t.closest("[data-csv]"); if (csv) {
      const rows = [["team", "reports", "avg_spectators", "avg_ushers", "avg_stewards"]].concat(A.clubsOf(view.comp).map((c) => { const reps = compGames().filter((g) => g.home === c.code && REPORTS[g.id]).map((g) => REPORTS[g.id]); const avg = (k) => reps.length ? Math.round(reps.reduce((s, r) => s + (+r[k] || 0), 0) / reps.length) : 0; return [c.name, reps.length, avg("spectators"), avg("ushers"), avg("stewards")]; }));
      return A.download(`security_team_stats_${view.comp}.csv`, A.toCSV(rows));
    }
  });
  app.addEventListener("change", (e) => { const k = e.target.dataset.inc; if (k) { view.inc[k] = e.target.value; render(); } });
  render();
  A.ribbon("Security Reports", "security-report");
})();
