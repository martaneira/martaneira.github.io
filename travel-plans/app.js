/* Travel Plans (demo). Visiting clubs fill in how they travel to every away game; the competition
   department tracks completion, flags and kilometres. Invented data. */
(function () {
  "use strict";
  const A = window.ATLAS, { esc, fmt, crest, CLUB } = A;
  const app = document.getElementById("app");
  const store = A.store("travel-plans");
  const MODES = ["Airplane", "Train", "Bus"];
  const HOTELS = ["Grand Hotel", "Hotel Central", "Arena Suites", "Riverside Hotel", "Hotel Plaza", "City Park Hotel"];
  const DELAYS = ["Flight delayed by the airline", "Weather", "Air traffic control strike", "Road closure"];
  let OPEN_DAYS = store.get("openDays", 14);

  // ---------- data ----------
  const dist = (g) => A.distanceKm(CLUB[g.away], CLUB[g.home]);
  function modeFor(km, r) { return km < 350 ? (r.chance(0.6) ? "Bus" : "Train") : km < 650 && r.chance(0.35) ? "Train" : "Airplane"; }
  function genPlan(g) {
    const r = A.rng(7000 + g.code * 11 + (g.comp === "C" ? 5 : 0)), km = dist(g), mode = modeFor(km, r), air = mode === "Airplane";
    const charter = air && r.chance(g.comp === "L" ? 0.55 : 0.3);
    const double = r.chance(0.08), delay = r.chance(0.07) ? r.pick(DELAYS) : "";
    const dayBefore = r.chance(0.93), noDist = r.chance(0.04);
    const arr = `${r.int(dayBefore ? 12 : 9, dayBefore ? 22 : 13)}:${r.pick(["00", "15", "30", "45"])}`;
    return {
      mode, type: air ? (charter ? "Charter" : "Scheduled") : "", flight: air ? (charter ? "Charter " : "") + CLUB[g.away].code.slice(0, 2) + r.int(100, 9899) : "",
      from: air ? CLUB[g.away].airport : mode === "Train" ? CLUB[g.away].city + " Central" : CLUB[g.away].arena, to: air ? CLUB[g.home].airport : mode === "Train" ? CLUB[g.home].city + " Central" : CLUB[g.home].arena,
      transfers: air && !charter && r.chance(0.25) ? 1 : 0, arrDate: dayBefore ? A.addDays(g.date, -1) : g.date, arrTime: arr,
      practiceFirst: r.chance(0.3) ? "Practice first" : "Straight to hotel", hotel: r.pick(HOTELS) + " " + CLUB[g.home].city, delay,
      ret: double ? "Double round" : "Return home", retDate: double ? A.addDays(g.date, 1) : A.addDays(g.date, r.chance(0.7) ? 1 : 0),
      km: noDist ? null : Math.round(km * (double ? 1 : 2) * (mode === "Bus" ? 1.25 : mode === "Train" ? 1.15 : 1.05)), comments: "",
    };
  }
  const saved = store.get("plans", {}), flags = store.get("flags", {});
  const PLANS = {};
  A.GAMES.forEach((g) => {
    if (saved[g.id]) { PLANS[g.id] = saved[g.id]; return; }
    const r = A.rng(9100 + g.code * 3 + (g.comp === "C" ? 77 : 0));
    const daysTo = A.daysBetween(A.TODAY, g.date);
    if (g.played) { if (!r.chance(0.05)) PLANS[g.id] = genPlan(g); }
    else if (daysTo <= OPEN_DAYS && r.chance(0.5)) PLANS[g.id] = genPlan(g);
  });
  function status(g) {
    const p = PLANS[g.id], days = A.daysBetween(A.TODAY, g.date);
    if (!p) return days > OPEN_DAYS ? "Opens" : "Missing";
    if (p.delay && (flags[g.id] || "pending") === "pending") return "Flagged";
    if (p.arrDate === g.date) return "Needs review";
    if (p.km == null) return "Missing distance";
    return "Submitted";
  }
  const ST_CLASS = { Submitted: "ok", Missing: "bad", Flagged: "warn", "Needs review": "warn", "Missing distance": "bad", Opens: "idle" };

  let view = { role: null, club: null, page: "games", game: null, step: 0, form: {}, tab: "completion", comp: "L", round: "", st: "", detail: null };
  const go = (p) => { Object.assign(view, p); render(); window.scrollTo(0, 0); };

  function start() {
    app.innerHTML = `<div class="start"><div class="box"><span class="kicker">Atlas Basketball · Competition</span><h1>Travel <span style="color:var(--accent)">plans</span></h1>
      <p class="sub" style="font-size:17px">Before every away game, the visiting club tells the competition how it travels: mode, flights, arrival, hotel and the trip home. The department sees who is missing, which plans need a look, and the kilometres every team travels.</p>
      <div class="roles"><button class="role" type="button" data-role="club"><b>Club view</b><span>The team manager's page: away games, each with its travel form.</span><em>Open as a club →</em></button>
      <button class="role dark" type="button" data-role="admin"><b>Competition staff</b><span>Completion tracking, flags and travel stats.</span><em>Open the dashboard →</em></button></div></div></div>`;
  }
  function top(tabs) {
    return `<header class="top"><div class="in"><b class="app"><i>✈</i>Travel plans</b>${tabs ? `<nav>${tabs}</nav>` : ""}<div class="r">${view.role === "club" ? `<span class="team" style="color:#fff">${crest(view.club, 24)}${esc(CLUB[view.club].name)}</span>` : `<a href="../hub/">Back to hub</a>`}<button type="button" data-role="">Sign out</button></div></div></header>`;
  }
  // ---------- club ----------
  function login() {
    app.innerHTML = `<div class="start"><form class="card" id="lf" style="max-width:440px;width:100%;padding:28px"><span class="kicker">Club access</span><h1 style="font-size:32px">Travel plans</h1><p class="sub">Every club has its own login. Pick one to continue.</p>
      <label class="f">Club<select id="lc">${A.CLUBS.map((c) => `<option value="${c.code}">${esc(c.name)} · ${A.COMPS[c.comp].short}</option>`).join("")}</select></label><br>
      <label class="f">Password<input type="password" value="demo" autocomplete="current-password"></label><br><button class="btn" type="submit">Log in</button> <button class="btn ghost" type="button" data-role="">Back</button></form></div>`;
    app.querySelector("#lf").onsubmit = (e) => { e.preventDefault(); go({ role: "club", club: app.querySelector("#lc").value, page: "games" }); };
  }
  function myGames() {
    const games = A.GAMES.filter((g) => g.away === view.club).sort((a, b) => a.date.localeCompare(b.date));
    const next = games.filter((g) => !g.played), past = games.filter((g) => g.played).reverse();
    const row = (g) => {
      const p = PLANS[g.id], days = A.daysBetween(A.TODAY, g.date), opens = A.addDays(g.date, -OPEN_DAYS);
      const act = g.played ? (p ? `<span class="st ok">Completed</span> <button class="linkbtn" type="button" data-view="${g.id}">View</button>` : `<span class="st idle">Locked</span>`)
        : p ? `<span class="st ok">Completed</span> <button class="linkbtn" type="button" data-fill="${g.id}">Edit</button>` : days > OPEN_DAYS ? `<span class="st idle">Opens ${A.dateShort(opens)}</span>` : `<button class="btn sm" type="button" data-fill="${g.id}">Fill in travel plan</button>`;
      return `<div class="g"><span class="rd">R${g.round}</span><div><div class="vs">at ${crest(g.home, 22)}${esc(CLUB[g.home].name)} <span class="tag2 ${g.comp}">${A.COMPS[g.comp].short}</span></div><div class="meta">${A.dateLong(g.date)} · ${g.tip} · ${esc(g.venue)} · ${fmt(dist(g))} km away</div></div><div>${act}</div></div>`;
    };
    app.innerHTML = top() + `<div class="wrap narrow"><h1>My games</h1><p class="sub">Your away games. Each travel form opens ${OPEN_DAYS} days before the game and locks once it is played.</p>
      <h2>Coming up</h2><div class="games">${next.slice(0, 8).map(row).join("")}</div><h2 style="margin-top:28px">Played</h2><div class="games">${past.slice(0, 8).map(row).join("")}</div></div>`;
  }
  const STEPS = ["Outbound trip", "Arrival", "Return", "Review"];
  const fld = (k, label, type = "text", extra = "") => `<label class="f">${label}<input data-f="${k}" type="${type}" value="${esc(view.form[k] ?? "")}"${extra}></label>`;
  const sel = (k, label, opts) => `<label class="f">${label}<select data-f="${k}"><option value="">Select…</option>${opts.map((o) => `<option${view.form[k] === o ? " selected" : ""}>${esc(o)}</option>`).join("")}</select></label>`;
  function formStep() {
    const f = view.form, g = A.GAME[view.game], air = f.mode === "Airplane";
    if (view.step === 0) return `<h2>How are you travelling?</h2><div class="fg">${sel("mode", "Travel mode", MODES)}${air ? sel("type", "Flight type", ["Scheduled", "Charter"]) : "<span></span>"}
      ${air ? fld("flight", "Flight number", "text", ' placeholder="e.g. AL1234"') : ""}${air && f.type === "Scheduled" ? fld("transfers", "Number of transfers", "number", ' min="0"') : ""}
      ${fld("from", air ? "Departure airport" : f.mode === "Train" ? "Departure station" : "Departure address")}${fld("to", air ? "Arrival airport" : f.mode === "Train" ? "Arrival station" : "Arrival address")}</div>
      <p style="margin-top:14px">${f.km ? `<span class="calc">Distance calculated: ${fmt(f.km)} km round trip</span>` : `<span class="calc miss">Distance is calculated from the departure and arrival points</span>`}</p>`;
    if (view.step === 1) return `<h2>Arrival</h2><div class="fg">${fld("arrDate", "Arrival date", "date")}${fld("arrTime", "Arrival time", "time")}${sel("practiceFirst", "After landing", ["Straight to hotel", "Practice first"])}${fld("hotel", "Hotel")}
      <label class="f wide">Delay outside the club's control <small>Only if the trip was or will be delayed</small><select data-f="delay"><option value="">No delay</option>${DELAYS.map((d) => `<option${f.delay === d ? " selected" : ""}>${d}</option>`).join("")}</select></label></div>
      ${f.arrDate === g.date ? `<div class="note warn" style="margin-top:14px">Arriving on game day. The competition will review this plan.</div>` : ""}`;
    if (view.step === 2) return `<h2>After the game</h2><div class="fg">${sel("ret", "Next trip", ["Return home", "Double round"])}${fld("retDate", "Departure date", "date")}<label class="f wide">General comments<textarea data-f="comments" rows="3">${esc(f.comments || "")}</textarea></label></div>
      ${f.ret === "Double round" ? `<div class="note ok" style="margin-top:14px">Double round: the team flies straight to its next away game, so this plan only counts the outbound leg.</div>` : ""}`;
    const rows = [["Mode", `${f.mode || "–"}${f.type ? " · " + f.type : ""}`], ["Flight", f.flight || "–"], ["From → to", `${f.from || "–"} → ${f.to || "–"}`], ["Arrival", `${f.arrDate || "–"} ${f.arrTime || ""}`], ["After landing", f.practiceFirst], ["Hotel", f.hotel], ["Delay", f.delay || "None"], ["Next trip", `${f.ret || "–"} · ${f.retDate || ""}`], ["Distance", f.km ? fmt(f.km) + " km" : "–"]];
    return `<h2>Review</h2><dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v || "–")}</dd>`).join("")}</dl>`;
  }
  const NEED = [["mode", "from", "to"], ["arrDate", "arrTime", "practiceFirst", "hotel"], ["ret", "retDate"]];
  function form(err) {
    const g = A.GAME[view.game];
    app.innerHTML = top() + `<div class="wrap narrow"><button class="linkbtn" type="button" data-page="games">← My games</button><h1 style="margin-top:10px">${esc(CLUB[g.away].short)} at ${esc(CLUB[g.home].short)}</h1><p class="sub">${A.COMPS[g.comp].name} · round ${g.round} · ${A.dateLong(g.date)} · tip-off ${g.tip}</p>
      <div class="steps">${STEPS.map((s, i) => `<span class="${i === view.step ? "on" : i < view.step ? "done" : ""}">${i + 1}. ${s}</span>`).join("")}</div>
      <form class="card" id="tf" novalidate>${formStep()}<div class="err">${err || ""}</div><div class="navb">${view.step ? `<button class="btn ghost" type="button" data-back>← Back</button>` : "<span></span>"}<button class="btn" type="submit">${view.step === 3 ? "Submit travel plan" : "Continue"}</button></div></form></div>`;
    const f = app.querySelector("#tf");
    f.oninput = (e) => { const k = e.target.dataset.f; if (!k) return; view.form[k] = e.target.value; };
    f.onchange = (e) => { const k = e.target.dataset.f; if (!k) return; view.form[k] = e.target.value;
      if (k === "mode") { const air = e.target.value === "Airplane", tr = e.target.value === "Train"; Object.assign(view.form, { from: air ? CLUB[g.away].airport : tr ? CLUB[g.away].city + " Central" : CLUB[g.away].arena, to: air ? CLUB[g.home].airport : tr ? CLUB[g.home].city + " Central" : CLUB[g.home].arena, km: Math.round(dist(g) * 2 * (air ? 1.05 : tr ? 1.15 : 1.25)) }); if (!air) view.form.type = ""; }
      if (e.target.tagName === "SELECT" || e.target.type === "date") form(); };
    f.onclick = (e) => { if (e.target.closest("[data-back]")) { view.step--; form(); } };
    f.onsubmit = (e) => {
      e.preventDefault();
      if (view.step < 3) { const miss = (NEED[view.step] || []).filter((k) => !view.form[k]); if (view.step === 0 && view.form.mode === "Airplane" && !view.form.type) miss.push("type"); if (miss.length) return form("Fill in every field before continuing."); view.step++; return form(); }
      if (view.form.ret === "Double round" && view.form.km) view.form.km = Math.round(view.form.km / 2);
      const all = store.get("plans", {}); all[g.id] = { ...view.form }; store.set("plans", all); PLANS[g.id] = all[g.id];
      app.innerHTML = top() + `<div class="wrap narrow"><div class="card"><h2>Travel plan submitted</h2><p>The competition department can see it now. You can edit it until the game is played.</p><button class="btn" type="button" data-page="games">Back to my games</button> <button class="btn ghost" type="button" data-staff="${g.id}">See it as competition staff</button></div></div>`;
    };
  }
  // ---------- admin ----------
  const adminTabs = () => [["completion", "Completion"], ["stats", "Travel stats"]].map(([k, l]) => `<button type="button" data-tab="${k}" aria-selected="${view.tab === k}">${l}</button>`).join("");
  const rowsFor = () => A.GAMES.filter((g) => g.comp === view.comp && A.daysBetween(A.TODAY, g.date) <= OPEN_DAYS)
    .map((g) => ({ g, s: status(g), p: PLANS[g.id] })).filter((x) => (!view.round || x.g.round === +view.round) && (!view.st || x.s === view.st)).sort((a, b) => b.g.date.localeCompare(a.g.date) || a.g.away.localeCompare(b.g.away));
  function completion() {
    const all = A.GAMES.filter((g) => g.comp === view.comp && A.daysBetween(A.TODAY, g.date) <= OPEN_DAYS).map(status);
    const count = (s) => all.filter((x) => x === s).length, rows = rowsFor();
    return `<h1>Completion</h1><p class="sub">Every visiting team's travel plan, from round 1 to the games whose form is already open.</p>
      <div class="setting"><label class="f">Forms open this many days before the game<input type="number" id="od" min="1" max="30" value="${OPEN_DAYS}"></label><button class="btn sm" type="button" data-save-days>Save</button></div>
      <div class="counters">${[["Submitted", "ok"], ["Missing", "miss"], ["Flagged", "flag"], ["Needs review", "flag"], ["Missing distance", "miss"]].map(([s, c]) => `<button class="counter ${c}" type="button" data-st="${s}" aria-pressed="${view.st === s}"><b>${count(s)}</b>${s}</button>`).join("")}</div>
      <div class="filters"><label class="f">Competition<select data-filter="comp">${["L", "C"].map((c) => `<option value="${c}"${view.comp === c ? " selected" : ""}>${A.COMPS[c].name}</option>`).join("")}</select></label>
        <label class="f">Round<select data-filter="round"><option value="">All rounds</option>${Array.from({ length: A.SEASON.next[view.comp] }, (_, i) => `<option${view.round === String(i + 1) ? " selected" : ""}>${i + 1}</option>`).join("")}</select></label>
        <label class="f">Status<select data-filter="st"><option value="">All statuses</option>${Object.keys(ST_CLASS).filter((s) => s !== "Opens").map((s) => `<option${view.st === s ? " selected" : ""}>${s}</option>`).join("")}</select></label><button class="btn ghost" type="button" data-csv>Download CSV</button></div>
      <div class="card tw" style="padding:6px"><table><thead><tr><th>Round</th><th>Date</th><th>Travelling team</th><th>Destination</th><th>Mode</th><th>Arrival</th><th>Km</th><th>Status</th><th></th></tr></thead><tbody>${rows.slice(0, 120).map(({ g, s, p }) => `<tr><td>${g.round}</td><td>${g.date}</td><td><span class="team">${crest(g.away, 22)}${esc(CLUB[g.away].name)}</span> ${p && p.ret === "Double round" ? '<span class="dr">DR</span>' : ""}</td><td>${esc(CLUB[g.home].city)}</td><td>${p ? p.mode + (p.type ? " · " + p.type : "") : "–"}</td><td>${p ? (p.arrDate === g.date ? "Game day " : A.dateShort(p.arrDate) + " ") + p.arrTime : "–"}</td><td>${p && p.km ? fmt(p.km) : "–"}</td><td><span class="st ${ST_CLASS[s]}">${s}</span></td><td><button class="linkbtn" type="button" data-detail="${g.id}">Open →</button></td></tr>`).join("") || `<tr><td colspan="9" style="padding:24px;color:var(--muted)">Nothing for these filters.</td></tr>`}</tbody></table></div>
      ${rows.length > 120 ? `<p class="sub" style="margin-top:8px">Showing the 120 most recent of ${rows.length}. Filter by round to see the rest.</p>` : ""}`;
  }
  function detail() {
    const g = A.GAME[view.detail], p = PLANS[g.id], s = status(g);
    let note = "";
    if (!p) note = `<div class="note bad">No submission found for this game yet. ${CLUB[g.away].name} has been reminded by email (${esc(CLUB[g.away].travelEmail)}).</div>`;
    else if (s === "Flagged") note = `<div class="note warn"><b>Delay reported:</b> ${esc(p.delay)}. This one's worth a quick check. Currently <b>pending</b>. <button class="btn sm" type="button" data-review="${g.id}">Mark as reviewed</button></div>`;
    else if (s === "Needs review") note = `<div class="note warn">The team arrives on game day (${esc(p.arrTime)}). Check that it fits the competition rules.</div>`;
    else if (s === "Missing distance") note = `<div class="note bad">The app couldn't calculate the distance for this trip. Totals are incomplete until it's filled in. <button class="btn sm" type="button" data-fix="${g.id}">Fill in missing data</button></div>`;
    else note = `<div class="note ok">Complete. Nothing to check.</div>`;
    const kv = (rows) => `<dl class="kv">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v ?? "–")}</dd>`).join("")}</dl>`;
    return `<button class="linkbtn" type="button" data-tab="completion">← Back to completion tracking</button>
      <div style="display:flex;gap:14px;align-items:center;margin:14px 0 6px;flex-wrap:wrap">${crest(g.away, 46)}<div><h1 style="margin:0">${esc(CLUB[g.away].name)} → ${esc(CLUB[g.home].city)}</h1><p class="sub" style="margin:0">${A.COMPS[g.comp].name} · round ${g.round} · ${A.dateLong(g.date)} at ${g.tip} · <span class="st ${ST_CLASS[s]}">${s}</span></p></div></div><br>${note}
      ${p ? `<div class="detail-grid"><div class="card"><h2 style="margin-top:0;font-size:18px">Outbound journey</h2>${kv([["Mode", p.mode + (p.type ? " · " + p.type : "")], ["Flight", p.flight || "–"], ["From", p.from], ["To", p.to], ["Transfers", p.transfers || 0], ["Arrival", `${p.arrDate} · ${p.arrTime}`], ["After arrival", p.practiceFirst], ["Hotel", p.hotel]])}</div>
        <div class="card"><h2 style="margin-top:0;font-size:18px">Return journey</h2>${p.ret === "Double round" ? `<p>No return leg: double round, the team travels straight to its next away game on ${A.dateShort(p.retDate)}.</p>` : kv([["Mode", p.mode], ["Departure", p.retDate], ["From", p.to], ["To", p.from]])}<h2 style="font-size:18px">Total distance</h2><p style="font:700 30px var(--body);margin:0">${p.km ? fmt(p.km) + " km" : "–"}</p>${p.comments ? `<h2 style="font-size:18px">General comments</h2><p>${esc(p.comments)}</p>` : ""}</div></div>` : ""}`;
  }
  function donut(parts) {
    const tot = parts.reduce((s, p) => s + p[1], 0) || 1; let a = 0;
    const arcs = parts.map(([, v, c]) => { const f = v / tot, a0 = a; a += f; const L = f > 0.5 ? 1 : 0, p = (t) => [60 + 50 * Math.sin(2 * Math.PI * t), 60 - 50 * Math.cos(2 * Math.PI * t)];
      if (f >= 0.999) return `<circle cx="60" cy="60" r="50" fill="none" stroke="${c}" stroke-width="20"/>`; const [x0, y0] = p(a0), [x1, y1] = p(a); return v ? `<path d="M${x0} ${y0} A50 50 0 ${L} 1 ${x1} ${y1}" fill="none" stroke="${c}" stroke-width="20"/>` : ""; });
    return `<div class="donut"><svg viewBox="0 0 120 120" role="img" aria-label="${parts.map((p) => p[0] + " " + p[1]).join(", ")}">${arcs.join("")}</svg><div class="lg">${parts.map(([l, v, c]) => `<span style="--c:${c}">${l} · <b>${v}</b> (${Math.round((100 * v) / tot)}%)</span>`).join("")}</div></div>`;
  }
  function stats() {
    const plans = A.GAMES.filter((g) => g.comp === view.comp && PLANS[g.id]).map((g) => ({ g, p: PLANS[g.id] }));
    const byTeam = {}; plans.forEach(({ g, p }) => (byTeam[g.away] = (byTeam[g.away] || 0) + (p.km || 0)));
    const top = Object.entries(byTeam).sort((a, b) => b[1] - a[1]).slice(0, 10), mx = top[0] ? top[0][1] : 1;
    const modes = MODES.map((m, i) => [m, plans.filter((x) => x.p.mode === m).length, ["#2a1b78", "#f05a28", "#2ea3f2"][i]]);
    const flights = plans.filter((x) => x.p.mode === "Airplane");
    const byRound = {}; plans.forEach(({ g, p }) => (byRound[g.round] = (byRound[g.round] || 0) + (p.km || 0)));
    const rounds = Object.entries(byRound).sort((a, b) => a[0] - b[0]), rmx = Math.max(1, ...rounds.map((r) => r[1]));
    const total = plans.reduce((s, x) => s + (x.p.km || 0), 0);
    return `<h1>Travel stats</h1><p class="sub">${fmt(total)} km travelled across ${plans.length} trips in the ${A.COMPS[view.comp].name} so far · ${plans.filter((x) => x.p.ret === "Double round").length} double rounds.</p>
      <div class="filters"><label class="f">Competition<select data-filter="comp">${["L", "C"].map((c) => `<option value="${c}"${view.comp === c ? " selected" : ""}>${A.COMPS[c].name}</option>`).join("")}</select></label></div>
      <div class="charts"><div class="card"><h2>Total km by team · top 10</h2>${top.map(([c, v]) => `<div class="hb"><span class="team">${crest(c, 18)}${esc(CLUB[c].name)}</span><span class="t"><i style="width:${(100 * v) / mx}%"></i></span><span class="v">${fmt(v)}</span></div>`).join("")}</div>
        <div class="card"><h2>Travel mode</h2>${donut(modes)}<h2 style="margin-top:22px">Flights: charter vs scheduled</h2>${donut([["Charter", flights.filter((x) => x.p.type === "Charter").length, "#f2873a"], ["Scheduled", flights.filter((x) => x.p.type !== "Charter").length, "#2a1b78"]])}</div></div>
      <div class="card"><h2 style="font-size:17px;margin:0 0 8px">Km by round</h2><div class="cols">${rounds.map(([r, v]) => `<div title="Round ${r}: ${fmt(v)} km"><i style="height:${(100 * v) / rmx}%"></i><small>${r}</small></div>`).join("")}</div></div>`;
  }
  function admin() { app.innerHTML = top(adminTabs()) + `<div class="wrap">${view.detail ? detail() : view.tab === "stats" ? stats() : completion()}</div>`; }
  function render() {
    if (!view.role) return start();
    if (view.role === "login") return login();
    if (view.role === "club") return view.page === "form" ? form() : myGames();
    admin();
  }
  app.addEventListener("click", (e) => {
    const t = e.target, d = (s) => t.closest(s);
    if (d("[data-role]")) { const r = d("[data-role]").dataset.role; return go({ role: r === "club" ? "login" : r || null, detail: null, tab: "completion" }); }
    if (d("[data-page]")) return go({ page: "games" });
    if (d("[data-fill]")) { const id = d("[data-fill]").dataset.fill, g = A.GAME[id]; return go({ page: "form", game: id, step: 0, form: PLANS[id] ? { ...PLANS[id] } : { arrDate: A.addDays(g.date, -1), retDate: A.addDays(g.date, 1) } }); }
    if (d("[data-view]")) { const id = d("[data-view]").dataset.view; return go({ page: "form", game: id, step: 3, form: { ...PLANS[id] } }); }
    if (d("[data-staff]")) { const id = d("[data-staff]").dataset.staff; return go({ role: "admin", comp: A.GAME[id].comp, detail: id }); }
    if (d("[data-tab]")) return go({ tab: d("[data-tab]").dataset.tab, detail: null });
    if (d("[data-detail]")) return go({ detail: d("[data-detail]").dataset.detail });
    if (d("[data-st]")) { const s = d("[data-st]").dataset.st; return go({ st: view.st === s ? "" : s }); }
    if (d("[data-review]")) { flags[view.detail] = "reviewed"; store.set("flags", flags); return render(); }
    if (d("[data-fix]")) { const g = A.GAME[view.detail], p = PLANS[g.id]; p.km = Math.round(dist(g) * (p.ret === "Double round" ? 1 : 2) * 1.05); const all = store.get("plans", {}); all[g.id] = p; store.set("plans", all); return render(); }
    if (d("[data-save-days]")) { OPEN_DAYS = Math.max(1, Math.min(30, +app.querySelector("#od").value || 14)); store.set("openDays", OPEN_DAYS); return render(); }
    if (d("[data-csv]")) {
      const rows = [["competition", "round", "date", "team", "destination", "mode", "type", "flight", "arrival_date", "arrival_time", "hotel", "km", "status"]].concat(rowsFor().map(({ g, s, p }) => [g.comp, g.round, g.date, CLUB[g.away].name, CLUB[g.home].city, p?.mode, p?.type, p?.flight, p?.arrDate, p?.arrTime, p?.hotel, p?.km, s]));
      return A.download(`travel_plans_${view.comp}.csv`, A.toCSV(rows));
    }
  });
  app.addEventListener("change", (e) => { const k = e.target.dataset.filter; if (k) { view[k] = e.target.value; if (k === "comp") view.round = ""; render(); } });
  render();
  A.ribbon("Travel Plans", "travel-plans");
})();
