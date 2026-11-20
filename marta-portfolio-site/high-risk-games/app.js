/* High-Risk Games (demo). The competition flags games with a security risk and sends both clubs a
   letter with the extra measures, automatically a set number of days before tip-off. Invented data. */
(function () {
  "use strict";
  const A = window.ATLAS, { esc, crest, CLUB } = A;
  const app = document.getElementById("app");
  const store = A.store("high-risk-games");
  const upcoming = A.GAMES.filter((g) => !g.played).sort((a, b) => a.date.localeCompare(b.date) || a.tip.localeCompare(b.tip));

  // seed: a few rivalries already flagged, a few letters already sent this season
  function seed() {
    const r = A.rng(321), out = { pending: {}, sent: [] };
    r.shuffle(upcoming.filter((g) => g.round <= A.SEASON.next[g.comp] + 3)).slice(0, 5).forEach((g) => (out.pending[g.id] = { days: Math.min(r.pick([7, 10, 14]), A.daysBetween(A.TODAY, g.date) - 1), extraHome: [], extraAway: [], removed: [] }));
    r.shuffle(A.GAMES.filter((g) => g.played)).slice(0, 9).forEach((g) => out.sent.push({ id: g.id, sentAt: A.addDays(g.date, -r.pick([7, 10, 14])), auto: r.chance(0.7), to: recipients(g, { extraHome: [], extraAway: [], removed: [] }) }));
    out.sent.sort((a, b) => b.sentAt.localeCompare(a.sentAt));
    return out;
  }
  const state = store.get("state", null) || seed();
  const save = () => store.set("state", state);
  function recipients(g, p) {
    const h = CLUB[g.home], a = CLUB[g.away];
    const home = [h.email, `security@${h.code.toLowerCase()}.atlas-demo.org`, ...p.extraHome].filter((x) => !p.removed.includes(x));
    const away = [a.email, `security@${a.code.toLowerCase()}.atlas-demo.org`, ...p.extraAway].filter((x) => !p.removed.includes(x));
    return { home, away };
  }

  let view = { tab: "pending", q: "", comp: "", modal: null, toast: "" };
  const go = (p) => { Object.assign(view, p); render(); };

  const sendDate = (g, days) => { const d = A.addDays(g.date, -days); return d < A.TODAY ? A.TODAY : d; };
  function letter(g) {
    const h = CLUB[g.home], a = CLUB[g.away], deadline = A.addDays(g.date, -3);
    return `<div class="lh"><span><b>Atlas Basketball</b><br>Competition Department</span><span>${A.dateLong(A.TODAY)}<br>Ref. HR-${g.id}</span></div>
      <p><b>To:</b> ${esc(h.name)} and ${esc(a.name)}<br><b>Re:</b> ${A.COMPS[g.comp].name} round ${g.round}, ${esc(h.short)} vs ${esc(a.short)}, ${A.dateLong(g.date)} at ${g.tip}, ${esc(g.venue)}</p>
      <p>Dear club officials,</p>
      <p>After reviewing the information available, the Competition Department has classified this game as <b>high risk</b>. The following measures apply in addition to the standard security regulations.</p>
      <h3>Home club · ${esc(h.short)}</h3><ul><li>Send the security plan for the game, including the steward and police deployment, by <b>${A.dateLong(deadline)}</b>.</li><li>Hold a security meeting with the police and the visiting club's security officer before the game.</li><li>Keep a separate entrance and a segregated sector for visiting fans, with stewards at both.</li><li>Keep CCTV recording for the whole event and share any footage requested.</li></ul>
      <h3>Visiting club · ${esc(a.short)}</h3><ul><li>Confirm the number of travelling fans and their travel arrangements by <b>${A.dateLong(deadline)}</b>.</li><li>Send the name and phone number of the security officer travelling with the team.</li><li>Share any information about supporter groups that may affect the risk assessment.</li></ul>
      <p>Please reply to this letter to confirm receipt. We thank both clubs for their cooperation.</p><p>Kind regards,<br><b>Competition Department</b><br>Atlas Basketball</p>`;
  }
  function modal() {
    const g = A.GAME[view.modal], p = state.pending[g.id], rc = recipients(g, p);
    const pills = (side) => rc[side].map((e) => `<div class="pill"><span>${esc(e)}</span><button type="button" data-rm="${esc(e)}" aria-label="Remove ${esc(e)}">×</button></div>`).join("");
    return `<div class="modal-bg" data-close-bg><div class="modal" role="dialog" aria-modal="true" aria-label="Letter preview"><div class="letter">${letter(g)}</div>
      <div class="side"><div style="display:flex;justify-content:space-between;align-items:center"><h2>Send settings</h2><button class="ghost" type="button" data-close>Close</button></div>
        <div class="rcp"><span class="lab">Home club · ${esc(CLUB[g.home].short)}</span>${pills("home")}<div class="addr"><input id="ah" type="email" placeholder="Add an email"><button class="ghost" type="button" data-add="home">Add</button></div></div>
        <div class="rcp"><span class="lab">Visiting club · ${esc(CLUB[g.away].short)}</span>${pills("away")}<div class="addr"><input id="aa" type="email" placeholder="Add an email"><button class="ghost" type="button" data-add="away">Add</button></div></div>
        <label class="f">Auto-send this many days before the game<input type="number" id="days" min="1" max="30" value="${p.days}"></label>
        <p style="margin:0;color:var(--dim);font-size:13px">Goes out automatically on <b style="color:#fff">${A.dateLong(sendDate(g, p.days))}</b>.</p>
        <button class="btn" type="button" data-save-days>Save settings</button><button class="btn red" type="button" data-send="${g.id}">Send now</button></div></div></div>`;
  }
  function pending() {
    const ids = Object.keys(state.pending).filter((id) => A.GAME[id]).sort((a, b) => A.GAME[a].date.localeCompare(A.GAME[b].date));
    const list = ids.map((id) => { const g = A.GAME[id], p = state.pending[id], sd = sendDate(g, p.days), due = sd <= A.addDays(A.TODAY, 2);
      return `<div class="hr ${due ? "hot" : ""}">${crest(g.home, 40)}<div><div class="vs">${esc(CLUB[g.home].short)} vs ${esc(CLUB[g.away].short)} <span class="chip ${g.comp}">${A.COMPS[g.comp].short} · R${g.round}</span></div><div class="meta">${A.dateLong(g.date)} · ${g.tip} · ${esc(g.venue)}</div></div>
        <div class="when"><span>${due ? "Sends soon" : "Auto-send"}</span><b>${A.dateShort(sd)}</b><div class="acts"><button class="ghost" type="button" data-preview="${id}">Preview letter</button><button class="ghost" type="button" data-unflag="${id}" aria-label="Remove flag">Unflag</button></div></div></div>`; }).join("");
    const q = view.q.trim().toLowerCase();
    const res = upcoming.filter((g) => !state.pending[g.id] && (!view.comp || g.comp === view.comp) && (!q || [CLUB[g.home].name, CLUB[g.away].name, g.venue, "r" + g.round].some((s) => s.toLowerCase().includes(q)))).slice(0, 14);
    return `<div class="layout"><section><h2 style="font-size:19px;margin:0 0 12px">Flagged games <span style="color:var(--dim);font-weight:500">· ${ids.length}</span></h2><div class="list">${list || `<div class="card empty">No games flagged. Use the search to flag one.</div>`}</div></section>
      <section class="card"><h2 style="font-size:19px;margin:0 0 12px">Find a game</h2><div class="search"><input id="q" type="search" placeholder="Search a team, arena or round (e.g. R16)" value="${esc(view.q)}" aria-label="Search games">
        <div class="seg" role="group" aria-label="Competition">${[["", "All"], ["L", "League"], ["C", "Cup"]].map(([k, l]) => `<button type="button" data-comp="${k}" aria-pressed="${view.comp === k}">${l}</button>`).join("")}</div></div>
        <div style="margin-top:8px">${res.map((g) => `<div class="res"><span class="rd">${A.COMPS[g.comp].short}<br>R${g.round}</span><div class="t">${crest(g.home, 20)}${esc(CLUB[g.home].short)} vs ${crest(g.away, 20)}${esc(CLUB[g.away].short)}<small>${A.dateLong(g.date)} · ${g.tip}</small></div><button class="btn sm red" type="button" data-flag="${g.id}">Flag as high-risk</button></div>`).join("") || `<div class="empty">No upcoming games match.</div>`}</div></section></div>`;
  }
  function sent() {
    return `<div class="card tw"><table><thead><tr><th>Sent</th><th>Game</th><th>Competition</th><th>Recipients</th><th>How</th><th></th></tr></thead><tbody>${state.sent.map((s, i) => { const g = A.GAME[s.id];
      return `<tr><td>${A.dateShort(s.sentAt)}</td><td><span class="team">${crest(g.home, 22)}${esc(CLUB[g.home].short)} vs ${esc(CLUB[g.away].short)}</span><div style="color:var(--dim);font-size:13px">${A.dateLong(g.date)}</div></td><td><span class="chip ${g.comp}">${A.COMPS[g.comp].short} · R${g.round}</span></td><td>${s.to.home.length + s.to.away.length} emails</td><td>${s.auto ? '<span class="chip ok">Auto-sent</span>' : '<span class="chip red">Sent now</span>'}</td><td><button class="ghost" type="button" data-view="${i}">View letter</button></td></tr>`; }).join("")}</tbody></table></div>`;
  }
  function render() {
    const n = Object.keys(state.pending).length;
    app.innerHTML = `<header class="bar"><span class="app"><i></i>High-risk games</span><div class="r"><a class="ghost" href="../hub/">Back to hub</a><button class="ghost" type="button" data-reset>Reset demo</button></div></header>
      <main class="page"><h1>High-risk <b>games</b></h1><p class="sub">Flag a game, check the letter and its recipients, and it goes to both clubs automatically before tip-off. Every letter sent stays on record.</p>
      <div class="tabs" role="tablist"><button type="button" role="tab" data-tab="pending" aria-selected="${view.tab === "pending"}">Pending<span class="n">${n}</span></button><button type="button" role="tab" data-tab="sent" aria-selected="${view.tab === "sent"}">Sent</button></div>
      ${view.tab === "pending" ? pending() : sent()}</main>${view.modal ? modal() : ""}${view.viewSent != null ? sentModal() : ""}${view.toast ? `<div class="toast" role="status">${esc(view.toast)}</div>` : ""}`;
    if (view.toast) setTimeout(() => { view.toast = ""; const t = app.querySelector(".toast"); if (t) t.remove(); }, 2400);
    const q = app.querySelector("#q"); if (q && view.focusQ) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); }
  }
  function sentModal() {
    const s = state.sent[view.viewSent], g = A.GAME[s.id];
    return `<div class="modal-bg" data-close-bg><div class="modal" role="dialog" aria-modal="true" aria-label="Sent letter"><div class="letter">${letter(g)}</div><div class="side"><div style="display:flex;justify-content:space-between;align-items:center"><h2>Sent ${A.dateShort(s.sentAt)}</h2><button class="ghost" type="button" data-close>Close</button></div>
      <div class="rcp"><span class="lab">Home club</span>${s.to.home.map((e) => `<div class="pill">${esc(e)}</div>`).join("")}</div><div class="rcp"><span class="lab">Visiting club</span>${s.to.away.map((e) => `<div class="pill">${esc(e)}</div>`).join("")}</div></div></div></div>`;
  }
  app.addEventListener("click", (e) => {
    const d = (s) => e.target.closest(s);
    if (d("[data-tab]")) return go({ tab: d("[data-tab]").dataset.tab });
    if (d("[data-comp]")) return go({ comp: d("[data-comp]").dataset.comp, focusQ: false });
    if (d("[data-flag]")) { const id = d("[data-flag]").dataset.flag; state.pending[id] = { days: 10, extraHome: [], extraAway: [], removed: [] }; save(); return go({ modal: id }); }
    if (d("[data-unflag]")) { delete state.pending[d("[data-unflag]").dataset.unflag]; save(); return go({ toast: "Flag removed" }); }
    if (d("[data-preview]")) return go({ modal: d("[data-preview]").dataset.preview });
    if (d("[data-view]")) return go({ viewSent: +d("[data-view]").dataset.view });
    if (d("[data-close]") || e.target.matches("[data-close-bg]")) return go({ modal: null, viewSent: null });
    const p = view.modal && state.pending[view.modal];
    if (p && d("[data-rm]")) { p.removed.push(d("[data-rm]").dataset.rm); save(); return render(); }
    if (p && d("[data-add]")) { const side = d("[data-add]").dataset.add, v = app.querySelector(side === "home" ? "#ah" : "#aa").value.trim();
      if (/^\S+@\S+\.\S+$/.test(v)) { (side === "home" ? p.extraHome : p.extraAway).push(v); p.removed = p.removed.filter((x) => x !== v); save(); } return render(); }
    if (p && d("[data-save-days]")) { p.days = Math.max(1, Math.min(30, +app.querySelector("#days").value || 10)); save(); return go({ modal: null, toast: "Settings saved" }); }
    if (d("[data-send]")) { const id = d("[data-send]").dataset.send, g = A.GAME[id]; state.sent.unshift({ id, sentAt: A.TODAY, auto: false, to: recipients(g, state.pending[id]) }); delete state.pending[id]; save(); return go({ modal: null, tab: "sent", toast: "Letter sent to both clubs" }); }
    if (d("[data-reset]")) { const s = seed(); state.pending = s.pending; state.sent = s.sent; save(); return go({ toast: "Demo data reset" }); }
  });
  app.addEventListener("input", (e) => { if (e.target.id === "q") { view.q = e.target.value; view.focusQ = true; render(); } });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && (view.modal || view.viewSent != null)) go({ modal: null, viewSent: null }); });
  render();
  A.ribbon("High-Risk Games", "high-risk-games");
})();
