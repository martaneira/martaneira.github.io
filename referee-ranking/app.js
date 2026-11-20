/* Referee Ranking (demo). Every reviewed play and every soft-skill evaluation feeds a ranking that the
   referee department uses to nominate crews for the next round. Invented data. */
(function () {
  "use strict";
  const A = window.ATLAS, { esc, fmt, crest, CLUB, REF } = A;
  const app = document.getElementById("app");
  const store = A.store("referee-ranking");
  const OUTCOMES = [["Correct call", "var(--good)"], ["Correct no call", "#5bbf8a"], ["Incorrect call", "var(--bad)"], ["Incorrect no call", "#e8798a"], ["Incorrect application of rules", "#a33a8f"], ["Incorrect use of IRS", "var(--mid)"], ["For discussion", "var(--blue)"]];
  const OC = Object.fromEntries(OUTCOMES);
  const CALLS = ["Personal foul", "Shooting foul", "Offensive foul", "Unsportsmanlike foul", "Travelling", "Out of bounds", "Goaltending", "24-second violation", "Technical foul", "Block / charge"];
  const SKILLS = ["Rules knowledge", "Primary coverage", "Game management", "Misconduct management", "Fitness", "Positioning", "Work rate", "Communication", "Teamwork"];
  const POS = ["Crew chief", "Referee 1", "Referee 2"];
  const FREQ = ["Preferred", "Frequent", "Occasional", "Rare", "Not allowed"];
  const DIFF = ["Normal", "Medium", "Hard", "Very hard", "Hardest"];
  const LEVELS = ["Umpire 1 / CC", "Umpire 1", "Umpire 2", "Umpire 2 newcomer"];

  // ---------- referees in the ranking ----------
  const REFS = A.ACTIVE_REFS.slice().sort((a, b) => a.from - b.from).map((r, i, arr) => {
    const R = A.rng(parseInt(r.id.slice(1), 10) * 29);
    return { ...r, rlevel: LEVELS[Math.min(3, Math.floor((i / arr.length) * 4))], skill: 0.875 + 0.05 * (1 - i / arr.length) + R.next() * 0.05, soft: 3 + R.next() * 1.6, status: i === 9 ? "Temporary leave" : i === 31 ? "Sanctioned" : i === 22 ? "Low performance" : "Active" };
  });
  const RX = Object.fromEntries(REFS.map((r) => [r.id, r]));
  // ---------- reviewed plays & evaluations ----------
  const PLAYS = [], EVALS = [];
  A.GAMES.filter((g) => g.played).forEach((g) => {
    const r = A.rng(g.code * 101 + (g.comp === "C" ? 13 : 0));
    g.refs.forEach((id, pi) => {
      const ref = RX[id]; if (!ref) return;
      const n = r.int(4, 9);
      for (let k = 0; k < n; k++) {
        const roll = r.next(), acc = ref.skill;
        const out = roll < acc * 0.62 ? "Correct call" : roll < acc ? "Correct no call" : roll < acc + (1 - acc) * 0.4 ? "Incorrect call" : roll < acc + (1 - acc) * 0.65 ? "Incorrect no call" : roll < acc + (1 - acc) * 0.75 ? "Incorrect application of rules" : roll < acc + (1 - acc) * 0.82 ? "Incorrect use of IRS" : "For discussion";
        PLAYS.push({ id: `${g.id}-${pi}-${k}`, game: g.id, comp: g.comp, round: g.round, ref: id, pos: POS[pi], q: r.int(1, 4), clock: `${String(r.int(0, 9)).padStart(2, "0")}:${String(r.int(0, 59)).padStart(2, "0")}`, call: r.pick(CALLS), team: r.chance(0.5) ? g.home : g.away, outcome: out });
      }
      EVALS.push({ game: g.id, comp: g.comp, round: g.round, ref: id, pos: POS[pi], scores: SKILLS.map(() => Math.max(1, Math.min(5, Math.round((ref.soft + r.normal(0, 0.55)) * 2) / 2))) });
    });
  });
  // frequency of a referee with each team (department rules)
  const freqOf = (refId, club) => { const r = A.rng(parseInt(refId.slice(1), 10) * 7 + club.charCodeAt(0) * 3 + club.charCodeAt(2)); const x = r.next(); return x < 0.04 ? "Not allowed" : x < 0.16 ? "Rare" : x < 0.55 ? "Occasional" : x < 0.85 ? "Frequent" : "Preferred"; };

  let settings = store.get("settings", { wAcc: 60, wSoft: 40, minPlays: 15 });
  let view = { page: "refs", comp: "", pos: "", from: 1, to: 14, team: "", ref: null, sort: "score", dir: -1, outcome: "", round: "", game: "", nomComp: "L", modal: false, toast: "", hist: "L" };
  const go = (p) => { Object.assign(view, p); render(); };
  const inScope = (x) => (!view.comp || x.comp === view.comp) && (!view.pos || x.pos === view.pos) && x.round >= view.from && x.round <= view.to && (!view.team || (A.GAME[x.game].home === view.team || A.GAME[x.game].away === view.team));

  function ranking() {
    const plays = PLAYS.filter(inScope), evals = EVALS.filter(inScope);
    return REFS.map((ref) => {
      const p = plays.filter((x) => x.ref === ref.id), ev = evals.filter((x) => x.ref === ref.id);
      const judged = p.filter((x) => x.outcome !== "For discussion"), ok = judged.filter((x) => x.outcome.startsWith("Correct")).length;
      const acc = judged.length ? ok / judged.length : 0;
      const soft = ev.length ? ev.reduce((s, e) => s + e.scores.reduce((a, b) => a + b, 0) / SKILLS.length, 0) / ev.length : 0;
      const score = (settings.wAcc * acc * 100 + settings.wSoft * (soft / 5) * 100) / Math.max(1, settings.wAcc + settings.wSoft);
      return { ref, games: new Set(ev.map((e) => e.game)).size, plays: p.length, acc, wrong: judged.length - ok, disc: p.length - judged.length, soft, score: p.length >= settings.minPlays ? score : null };
    }).filter((x) => x.games);
  }
  const statusTag = (s) => `<span class="tag ${{ Active: "good", Sanctioned: "bad", "Low performance": "mid", "Temporary leave": "blue" }[s]}">${s}</span>`;
  const pct = (x) => (100 * x).toFixed(1) + "%";
  function filters(extra = "") {
    const rounds = (k) => Array.from({ length: 14 }, (_, i) => `<option${view[k] === i + 1 ? " selected" : ""}>${i + 1}</option>`).join("");
    return `<div class="filters"><label>Competition<select data-v="comp"><option value="">Both</option>${["L", "C"].map((c) => `<option value="${c}"${view.comp === c ? " selected" : ""}>${A.COMPS[c].name}</option>`).join("")}</select></label>
      <label>Position<select data-v="pos"><option value="">All positions</option>${POS.map((p) => `<option${view.pos === p ? " selected" : ""}>${p}</option>`).join("")}</select></label>
      <label>From round<select data-v="from" data-num>${rounds("from")}</select></label><label>To round<select data-v="to" data-num>${rounds("to")}</select></label>
      <label>Team<select data-v="team"><option value="">All teams</option>${A.CLUBS.filter((c) => !view.comp || c.comp === view.comp).map((c) => `<option value="${c.code}"${view.team === c.code ? " selected" : ""}>${esc(c.name)}</option>`).join("")}</select></label>${extra}</div>`;
  }
  function refsPage() {
    const rows = ranking().sort((a, b) => { const k = view.sort, va = k === "name" ? a.ref.name : a[k] ?? -1, vb = k === "name" ? b.ref.name : b[k] ?? -1; return (va > vb ? 1 : va < vb ? -1 : 0) * view.dir; });
    const ranked = ranking().filter((x) => x.score != null).sort((a, b) => b.score - a.score).map((x) => x.ref.id);
    const th = (k, l) => `<th data-sort="${k}" class="${view.sort === k ? "on" : ""}">${l}${view.sort === k ? (view.dir < 0 ? " ↓" : " ↑") : ""}</th>`;
    const all = PLAYS.filter(inScope), judged = all.filter((x) => x.outcome !== "For discussion");
    return `<div class="head"><h1>Referees</h1><p>Score = ${settings.wAcc}% call accuracy + ${settings.wSoft}% soft skills. Referees need ${settings.minPlays} reviewed plays to be ranked.</p></div>${filters(`<button class="btn ghost" type="button" data-csv style="margin-left:auto">Download CSV</button>`)}
      <div class="kpis"><div class="kpi"><b>${fmt(all.length)}</b><span>Reviewed plays</span></div><div class="kpi"><b>${pct(judged.filter((x) => x.outcome.startsWith("Correct")).length / Math.max(1, judged.length))}</b><span>Correct decisions</span></div><div class="kpi"><b>${all.filter((x) => x.outcome === "For discussion").length}</b><span>Plays for discussion</span></div><div class="kpi"><b>${ranked.length}</b><span>Referees ranked</span></div></div>
      <div class="card tw"><table><thead><tr><th>#</th>${th("name", "Referee")}<th>Level</th><th>Status</th>${th("games", "Games")}${th("plays", "Plays")}${th("acc", "Accuracy")}${th("wrong", "Incorrect")}${th("soft", "Soft skills")}${th("score", "Score")}</tr></thead><tbody>
      ${rows.map((x) => { const rk = ranked.indexOf(x.ref.id) + 1; return `<tr class="click" data-ref="${x.ref.id}" tabindex="0"><td class="rank ${rk && rk <= 3 ? "top" : ""}">${rk || "–"}</td><td class="nm"><b>${esc(x.ref.name)}</b><small>${x.ref.country}</small></td><td>${x.ref.rlevel}</td><td>${statusTag(x.ref.status)}</td><td>${x.games}</td><td>${x.plays}</td><td>${pct(x.acc)}<span class="meter"><i style="width:${Math.max(0, (x.acc - 0.7) / 0.3) * 100}%"></i></span></td><td>${x.wrong}</td><td>${x.soft.toFixed(2)}</td><td class="score">${x.score == null ? `<span class="tag">Not enough plays</span>` : x.score.toFixed(1)}</td></tr>`; }).join("")}</tbody></table></div>`;
  }
  function refDetail() {
    const ref = RX[view.ref], plays = PLAYS.filter((x) => x.ref === ref.id && inScope(x)), ev = EVALS.filter((x) => x.ref === ref.id && inScope(x));
    const row = ranking().find((x) => x.ref.id === ref.id) || { score: null, acc: 0, soft: 0 };
    const byRound = []; for (let r = view.from; r <= view.to; r++) { const p = plays.filter((x) => x.round === r && x.outcome !== "For discussion"); if (p.length) byRound.push([r, p.filter((x) => x.outcome.startsWith("Correct")).length / p.length]); }
    const W = 600, H = 160, xs = (i) => 30 + (i * (W - 50)) / Math.max(1, byRound.length - 1), ys = (v) => 14 + (1 - (v - 0.6) / 0.4) * (H - 34);
    const line = byRound.map(([, v], i) => `${xs(i)},${ys(Math.max(0.6, v))}`).join(" ");
    const sk = SKILLS.map((s, i) => [s, ev.length ? ev.reduce((a, e) => a + e.scores[i], 0) / ev.length : 0]);
    const oc = OUTCOMES.map(([o, c]) => [o, plays.filter((x) => x.outcome === o).length, c]), omx = Math.max(1, ...oc.map((x) => x[1]));
    const games = [...new Set(ev.map((e) => e.game))].map((id) => A.GAME[id]).sort((a, b) => b.date.localeCompare(a.date));
    return `<button class="back" type="button" data-page="refs">← All referees</button><div class="rtop"><span class="avatar">${A.initials(ref.name)}</span><div><h1 style="font-size:36px;text-transform:uppercase">${esc(ref.name)}</h1><span style="color:var(--muted)">${ref.country} · ${ref.rlevel} · since ${ref.from}</span> ${statusTag(ref.status)}</div><div style="margin-left:auto;text-align:right"><div class="big">${row.score == null ? "–" : row.score.toFixed(1)}</div><span style="color:var(--muted);font-weight:600">${pct(row.acc)} accuracy · ${row.soft.toFixed(2)} soft skills</span></div></div>
      ${filters()}<div class="g2"><div class="card"><h2>Accuracy by round</h2><svg class="line" viewBox="0 0 ${W} ${H}" role="img" aria-label="Accuracy by round">${[0.6, 0.8, 1].map((v) => `<line x1="30" x2="${W - 20}" y1="${ys(v)}" y2="${ys(v)}" stroke="#eef0f4"/><text x="0" y="${ys(v) + 4}" font-size="11" fill="#667085">${v * 100}%</text>`).join("")}<polyline points="${line}" fill="none" stroke="#f05a28" stroke-width="3" stroke-linejoin="round"/>${byRound.map(([r, v], i) => `<circle cx="${xs(i)}" cy="${ys(Math.max(0.6, v))}" r="4" fill="#f05a28"><title>Round ${r}: ${pct(v)}</title></circle><text x="${xs(i)}" y="${H - 2}" font-size="11" text-anchor="middle" fill="#667085">${r}</text>`).join("")}</svg></div>
        <div class="card"><h2>Outcomes <small>${plays.length} plays</small></h2>${oc.map(([o, n, c]) => `<div class="hb" style="--c:${c}"><span>${o}</span><span class="t"><i style="width:${(100 * n) / omx}%"></i></span><span class="v">${n}</span></div>`).join("")}</div></div>
      <div class="g2"><div class="card"><h2>Soft skills <small>average of ${ev.length} evaluations, out of 5</small></h2>${sk.map(([s, v]) => `<div class="hb"><span>${s}</span><span class="t"><i style="width:${(100 * v) / 5}%"></i></span><span class="v">${v.toFixed(1)}</span></div>`).join("")}</div>
        <div class="card tw"><h2>Games <small>${games.length}</small></h2><table><thead><tr><th>Round</th><th>Game</th><th>Position</th><th>Plays</th><th>Correct</th></tr></thead><tbody>${games.map((g) => { const p = plays.filter((x) => x.game === g.id), j = p.filter((x) => x.outcome !== "For discussion"); return `<tr><td>${A.COMPS[g.comp].short} ${g.round}</td><td>${esc(CLUB[g.home].short)} vs ${esc(CLUB[g.away].short)}</td><td>${p[0] ? p[0].pos : "–"}</td><td>${p.length}</td><td>${j.length ? pct(j.filter((x) => x.outcome.startsWith("Correct")).length / j.length) : "–"}</td></tr>`; }).join("")}</tbody></table></div></div>`;
  }
  function playsPage() {
    const list = PLAYS.filter((x) => inScope(x) && (!view.outcome || x.outcome === view.outcome)).sort((a, b) => b.round - a.round || a.game.localeCompare(b.game) || a.q - b.q);
    return `<div class="head"><h1>Plays</h1><p>Every play reviewed after the game, with the decision and who made it.</p></div>${filters(`<label>Outcome<select data-v="outcome"><option value="">All outcomes</option>${OUTCOMES.map(([o]) => `<option${view.outcome === o ? " selected" : ""}>${o}</option>`).join("")}</select></label>`)}
      <div class="card tw"><table><thead><tr><th>Round</th><th>Game</th><th>Q</th><th>Clock</th><th>Call</th><th>Against</th><th>Referee</th><th>Position</th><th>Outcome</th></tr></thead><tbody>${list.slice(0, 150).map((x) => { const g = A.GAME[x.game]; return `<tr><td>${A.COMPS[x.comp].short} ${x.round}</td><td>${esc(CLUB[g.home].short)} vs ${esc(CLUB[g.away].short)}</td><td>${x.q}</td><td>${x.clock}</td><td>${x.call}</td><td><span style="display:inline-flex;gap:6px;align-items:center">${crest(x.team, 18)}${x.team}</span></td><td><button class="back" style="margin:0" type="button" data-ref="${x.ref}">${esc(RX[x.ref].name)}</button></td><td>${x.pos}</td><td><span class="oc" style="--c:${OC[x.outcome]}"><i></i>${x.outcome}</span></td></tr>`; }).join("")}</tbody></table>
      <p style="color:var(--muted);margin:10px 0 0">${list.length > 150 ? `Showing 150 of ${fmt(list.length)} plays. Narrow the filters to see the rest.` : `${list.length} plays.`}</p></div>`;
  }
  // ---------- nominations ----------
  const noms = store.get("noms", {});
  function suggest(g, taken) {
    const rank = ranking(); const sc = Object.fromEntries(rank.map((x) => [x.ref.id, x.score ?? 0]));
    const ok = REFS.filter((r) => r.status === "Active" && !taken.has(r.id) && freqOf(r.id, g.home) !== "Not allowed" && freqOf(r.id, g.away) !== "Not allowed").sort((a, b) => sc[b.id] - sc[a.id]);
    const cc = ok.find((r) => r.rlevel === "Umpire 1 / CC") || ok[0]; const rest = ok.filter((r) => r !== cc);
    return [cc, rest[0], rest[1]].filter(Boolean).map((r) => r.id);
  }
  function nominations() {
    const round = A.SEASON.next[view.nomComp], games = A.gamesOf(view.nomComp, round);
    const taken = new Set(); const plan = games.map((g, i) => ({ g, d: DIFF[A.rng(g.code * 3 + i).int(0, 4)] }));
    plan.forEach((p) => { if (noms[p.g.id]) { p.crew = noms[p.g.id]; p.crew.forEach((c) => taken.add(c)); } });
    plan.slice().sort((a, b) => DIFF.indexOf(b.d) - DIFF.indexOf(a.d)).forEach((p) => { if (!p.crew) { p.crew = suggest(p.g, taken); p.crew.forEach((c) => taken.add(c)); } });
    const counts = {}; plan.forEach((p) => p.crew.forEach((c) => (counts[c] = (counts[c] || 0) + 1)));
    return `<div class="head"><h1>Nominations</h1><p>Round ${round} of the ${A.COMPS[view.nomComp].name}. The app gives the hardest games the best-ranked active referees who are allowed with both teams. Change any slot and save.</p></div>
      <div class="filters"><label>Competition<select data-v="nomComp">${["L", "C"].map((c) => `<option value="${c}"${view.nomComp === c ? " selected" : ""}>${A.COMPS[c].name}</option>`).join("")}</select></label><button class="btn" type="button" data-save-noms style="margin-left:auto">Save nominations</button><button class="btn ghost" type="button" data-reset-noms>Suggest again</button></div>
      <div class="card">${plan.map(({ g, d, crew }) => `<div class="nom"><div class="vs">${crest(g.home, 22)}${esc(CLUB[g.home].short)} vs ${crest(g.away, 22)}${esc(CLUB[g.away].short)}<small>${A.dateLong(g.date)} · ${g.tip}</small></div><span class="diff" style="color:${["var(--muted)", "var(--blue)", "var(--mid)", "var(--accent)", "var(--bad)"][DIFF.indexOf(d)]}">${d}</span>
        <div class="crew">${POS.map((p, i) => { const id = crew[i]; const f = id ? [freqOf(id, g.home), freqOf(id, g.away)] : []; return `<label>${p}<select data-nom="${g.id}" data-i="${i}">${REFS.map((r) => `<option value="${r.id}"${r.id === id ? " selected" : ""}>${esc(r.name)}${r.status !== "Active" ? " (" + r.status + ")" : ""}</option>`).join("")}</select>${f.includes("Not allowed") ? `<span class="warn">Not allowed with ${f[0] === "Not allowed" ? CLUB[g.home].short : CLUB[g.away].short}</span>` : id && counts[id] > 1 ? `<span class="warn">Nominated twice this round</span>` : id && RX[id].status !== "Active" ? `<span class="warn">${RX[id].status}</span>` : ""}</label>`; }).join("")}</div><span></span></div>`).join("")}</div>`;
  }
  function assignments() {
    const clubs = A.clubsOf(view.nomComp);
    return `<div class="head"><h1>Assignments</h1><p>How often each referee may work with each team, and how many games they have done with them this season.</p></div>
      <div class="filters"><label>Competition<select data-v="nomComp">${["L", "C"].map((c) => `<option value="${c}"${view.nomComp === c ? " selected" : ""}>${A.COMPS[c].name}</option>`).join("")}</select></label><span style="display:flex;gap:6px;flex-wrap:wrap;align-items:center;margin-left:auto">${FREQ.map((f) => `<span class="fq ${f.split(" ")[0]}">${f}</span>`).join("")}</span></div>
      <div class="card tw"><table class="mx"><thead><tr><th>Referee</th>${clubs.map((c) => `<th style="text-align:center" title="${esc(c.name)}">${crest(c.code, 22)}</th>`).join("")}</tr></thead><tbody>${REFS.map((r) => `<tr><td class="nm"><b>${esc(r.name)}</b><small>${r.rlevel}</small></td>${clubs.map((c) => { const f = freqOf(r.id, c.code), n = A.GAMES.filter((g) => g.played && g.comp === view.nomComp && g.refs.includes(r.id) && (g.home === c.code || g.away === c.code)).length; return `<td class="c"><span class="fq ${f.split(" ")[0]}" title="${esc(r.name)} with ${esc(c.name)}: ${f}, ${n} games">${n}</span></td>`; }).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  function historical() {
    const H = A.HISTORY.filter((h) => h.comp === view.hist), seasons = [...new Set(H.map((h) => h.season))].slice(-10);
    const rows = A.REFEREES.map((r) => ({ r, by: seasons.map((s) => H.filter((h) => h.season === s && h.refs.includes(r.id)).length), total: H.filter((h) => h.refs.includes(r.id)).length, finals: H.filter((h) => h.phase !== "Regular Season" && h.refs.includes(r.id)).length })).filter((x) => x.total).sort((a, b) => b.total - a.total).slice(0, 25);
    const mx = Math.max(1, ...rows.flatMap((x) => x.by));
    return `<div class="head"><h1>Historical</h1><p>Games per season for the 25 referees with the most games since 2000. Darker means more games.</p></div>
      <div class="filters"><label>Competition<select data-v="hist">${["L", "C"].map((c) => `<option value="${c}"${view.hist === c ? " selected" : ""}>${A.COMPS[c].name}</option>`).join("")}</select></label></div>
      <div class="card tw"><table><thead><tr><th>Referee</th><th>Total</th><th>Playoffs</th>${seasons.map((s) => `<th style="text-align:center">${s}</th>`).join("")}</tr></thead><tbody>${rows.map((x) => `<tr><td class="nm"><b>${esc(x.r.name)}</b><small>${x.r.from}–${x.r.to >= 2026 ? "today" : x.r.to}</small></td><td><b>${x.total}</b></td><td>${x.finals}</td>${x.by.map((n) => `<td style="text-align:center;background:rgba(42,27,120,${n ? 0.08 + (0.75 * n) / mx : 0});color:${n / mx > 0.55 ? "#fff" : "inherit"}">${n || ""}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  }
  function modal() {
    return `<div class="modal-bg" data-close-bg><form class="modal" id="sf" role="dialog" aria-modal="true" aria-label="Settings"><h2>Settings</h2><p style="color:var(--muted);margin-top:0">Changes apply to everyone who opens the ranking. Enter the edit code to save (in this demo it's <b>demo</b>).</p>
      <div class="wrow"><span>Weight of call accuracy (%)</span><input type="number" id="wa" min="0" max="100" value="${settings.wAcc}"></div><div class="wrow"><span>Weight of soft skills (%)</span><input type="number" id="ws" min="0" max="100" value="${settings.wSoft}"></div><div class="wrow"><span>Minimum reviewed plays to be ranked</span><input type="number" id="mp" min="0" max="80" value="${settings.minPlays}"></div>
      <div class="wrow"><span>Edit code</span><input type="password" id="code" autocomplete="off"></div><p class="warn" id="serr"></p><div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn ghost" type="button" data-close>Cancel</button><button class="btn" type="submit">Save for everyone</button></div></form></div>`;
  }
  function render() {
    const nav = [["refs", "Referees", "◎"], ["plays", "Plays", "▶"], ["noms", "Nominations", "✎"], ["assign", "Assignments", "▦"], ["hist", "Historical", "⟲"]];
    const page = view.ref ? refDetail() : { refs: refsPage, plays: playsPage, noms: nominations, assign: assignments, hist: historical }[view.page]();
    app.innerHTML = `<div class="shell"><aside><span class="brand"><i>R</i>Referee ranking</span>${nav.map(([k, l, ic]) => `<button type="button" data-page="${k}" aria-current="${view.page === k && !view.ref}"><span aria-hidden="true">${ic}</span>${l}</button>`).join("")}<span class="sp"></span><button type="button" data-settings><span aria-hidden="true">⚙</span>Settings</button><a href="../hub/"><span aria-hidden="true">←</span>Back to hub</a></aside><main>${page}</main></div>${view.modal ? modal() : ""}${view.toast ? `<div class="toast" role="status">${esc(view.toast)}</div>` : ""}`;
    if (view.toast) setTimeout(() => { view.toast = ""; const t = app.querySelector(".toast"); if (t) t.remove(); }, 2200);
    const sf = app.querySelector("#sf"); if (sf) sf.onsubmit = (e) => { e.preventDefault(); if (app.querySelector("#code").value !== "demo") { app.querySelector("#serr").textContent = "Wrong edit code."; return; } settings = { wAcc: +app.querySelector("#wa").value || 0, wSoft: +app.querySelector("#ws").value || 0, minPlays: +app.querySelector("#mp").value || 0 }; store.set("settings", settings); go({ modal: false, toast: "Settings saved" }); };
  }
  app.addEventListener("click", (e) => {
    const d = (s) => e.target.closest(s);
    if (d("[data-page]")) { window.scrollTo(0, 0); return go({ page: d("[data-page]").dataset.page, ref: null }); }
    if (d("[data-ref]")) { window.scrollTo(0, 0); return go({ ref: d("[data-ref]").dataset.ref }); }
    if (d("[data-sort]")) { const k = d("[data-sort]").dataset.sort; return go({ sort: k, dir: view.sort === k ? -view.dir : k === "name" ? 1 : -1 }); }
    if (d("[data-settings]")) return go({ modal: true });
    if (d("[data-close]") || e.target.matches("[data-close-bg]")) return go({ modal: false });
    if (d("[data-save-noms]")) { const round = A.SEASON.next[view.nomComp]; A.gamesOf(view.nomComp, round).forEach((g) => { noms[g.id] = POS.map((_, i) => app.querySelector(`[data-nom="${g.id}"][data-i="${i}"]`).value); }); store.set("noms", noms); return go({ toast: "Nominations saved" }); }
    if (d("[data-reset-noms]")) { A.gamesOf(view.nomComp, A.SEASON.next[view.nomComp]).forEach((g) => delete noms[g.id]); store.set("noms", noms); return go({ toast: "New suggestion ready" }); }
    if (d("[data-csv]")) { const rows = [["rank_score", "referee", "country", "level", "status", "games", "plays", "accuracy", "incorrect", "soft_skills"]].concat(ranking().map((x) => [x.score == null ? "" : x.score.toFixed(1), x.ref.name, x.ref.country, x.ref.rlevel, x.ref.status, x.games, x.plays, (100 * x.acc).toFixed(1), x.wrong, x.soft.toFixed(2)])); return A.download("referee_ranking.csv", A.toCSV(rows)); }
  });
  app.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.matches("tr[data-ref]")) go({ ref: e.target.dataset.ref }); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && view.modal) go({ modal: false }); });
  app.addEventListener("change", (e) => {
    const t = e.target;
    if (t.dataset.v) { view[t.dataset.v] = t.hasAttribute("data-num") ? +t.value : t.value; if (view.from > view.to) [view.from, view.to] = [view.to, view.from]; if (t.dataset.v === "comp") view.team = ""; return render(); }
    if (t.dataset.nom) { const id = t.dataset.nom, cur = noms[id] || POS.map((_, i) => app.querySelector(`[data-nom="${id}"][data-i="${i}"]`).value); cur[+t.dataset.i] = t.value; noms[id] = cur; return render(); }
  });
  render();
  A.ribbon("Referee Ranking", "referee-ranking");
})();
