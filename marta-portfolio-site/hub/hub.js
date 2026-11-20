/* Competition Hub (demo): one sign-in, then a tile for every tool. In the real hub the
   sign-in passes a short-lived signed token to each app; here it is a session flag. */
(function () {
  "use strict";
  const A = window.ATLAS, { esc, crest } = A;
  const app = document.getElementById("app");
  const store = A.store("hub");

  const ICON = {
    shield: '<path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z"/><path d="M9 12l2 2 4-4"/>',
    plane: '<path d="M2 16l20-8-6 12-3-5-5 3 1-5z"/>',
    alert: '<path d="M12 3l9 16H3L12 3z"/><path d="M12 10v4M12 17h.01"/>',
    list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
    whistle: '<circle cx="9" cy="14" r="5"/><path d="M13 11l8-4v4l-6 2"/>',
    medic: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M12 9v6M9 12h6"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    book: '<path d="M4 4h10a4 4 0 014 4v12H8a4 4 0 01-4-4V4z"/><path d="M8 8h6M8 12h6"/>',
    rank: '<path d="M8 21V11M16 21V7M12 21V3M4 21h16"/>',
  };
  const svg = (k) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[k]}</svg>`;
  const HUBS = {
    Competition: { lede: "Sign in once to reach every competition tool.", tiles: [
      ["high-risk-games", "alert", "High-risk games", "Flag fixtures and send security-plan letters to both clubs."],
      ["travel-plans", "plane", "Travel plans", "See which clubs have submitted travel plans for each away game."],
      ["security-report", "shield", "Security report", "Track completed match reports and compare stats per team."],
      ["delegates", "list", "Delegates", "Read the delegate reports by department, with incident emails."],
    ] },
    Sports: { lede: "Player availability, coaching analysis and the weekly game notes.", tiles: [
      ["injury-board", "medic", "Injuries", "See which players are available, in doubt or out for each round."],
      ["coaching-insights", "chart", "Coaching insights", "Compare players, lineups and rotations, and follow games live."],
      ["game-kit", "book", "Game Kit", "Stats and storylines for every game of the next round."],
    ] },
    Referees: { lede: "Assignments, history and the weekly ranking.", tiles: [
      ["referee-explorer", "whistle", "Referee explorer", "Every referee assignment since 2000, with profiles and filters."],
      ["referee-ranking", "rank", "Referee ranking", "Composite ranking, evaluated plays and the weekly nominations."],
    ] },
  };

  function login(err) {
    app.innerHTML = `<main class="login"><form class="panel" id="f" novalidate>
      <span class="wordmark"><i></i>Atlas Basketball</span>
      <h1>Competition Hub</h1><p>Sign in once to reach every competition tool.</p>
      ${err ? `<p class="error">${esc(err)}</p>` : ""}
      <label class="field"><span>Username</span><input id="u" autocomplete="username" value="demo"></label>
      <label class="field"><span>Password</span><input id="p" type="password" autocomplete="current-password" value="demo"></label>
      <button class="btn" type="submit">Sign in</button>
      <p class="hint">Demo: the fields are already filled in.</p></form></main>`;
    document.getElementById("f").onsubmit = (e) => {
      e.preventDefault();
      const u = document.getElementById("u").value.trim(), p = document.getElementById("p").value;
      if (!u || !p) return login("Enter your username and password.");
      store.set("user", u); hub("Competition");
    };
  }
  function games(day) {
    const r = day === "last" ? A.SEASON.played.L : A.SEASON.next.L;
    return A.GAMES.filter((g) => g.round === r || (g.comp === "C" && g.round === (day === "last" ? A.SEASON.played.C : A.SEASON.next.C))).sort((a, b) => a.date.localeCompare(b.date) || a.tip.localeCompare(b.tip));
  }
  function today(day) {
    const list = games(day);
    const side = (code, score, win) => `<div class="side${win ? " win" : ""}">${crest(code, 22)}<span>${esc(A.CLUB[code].short)}</span><span class="tscore">${score ?? ""}</span></div>`;
    return `<div class="day-tabs"><button type="button" data-day="last" aria-pressed="${day === "last"}">Latest results</button><button type="button" data-day="next" aria-pressed="${day === "next"}">Next games</button></div>
      ${list.slice(0, 12).map((g) => `<div class="game">${side(g.home, g.hs, g.played && g.hs > g.as)}<div class="gmeta"><span class="chip ${g.comp}">${g.comp === "L" ? "League" : "Cup"} R${g.round}</span><br>${g.played ? "Final" : A.dateShort(g.date) + " · " + g.tip}</div>${side(g.away, g.as, g.played && g.as > g.hs)}</div>`).join("")}`;
  }
  function hub(name, day = "last") {
    const u = store.get("user", "demo"), H = HUBS[name];
    app.innerHTML = `<header class="topbar"><span class="wordmark"><i></i>Atlas Basketball</span><div class="user"><span class="avatar">${esc(u.slice(0, 2).toUpperCase())}</span><span class="name">${esc(u)}</span><button class="signout" type="button" id="out">Sign out</button></div></header>
      <main class="hub"><h1><b>${name}</b> Hub</h1><p class="lede">${H.lede}</p>
        <div class="hub-tabs" role="group" aria-label="Hubs">${Object.keys(HUBS).map((k) => `<button type="button" data-hub="${k}" aria-pressed="${k === name}">${k}</button>`).join("")}</div>
        <div class="hub-layout"><nav class="grid" aria-label="${name} tools">${H.tiles.map(([dir, ic, title, desc]) => `<a class="tile" href="../${dir}/"><span class="icon">${svg(ic)}</span><span class="open" aria-hidden="true"><svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 8h10M9 4l4 4-4 4"/></svg></span><h2>${title}</h2><p>${desc}</p></a>`).join("")}</nav>
          <aside class="today"><div class="today-head"><h2>Games of the day</h2><span class="today-date">${A.dateLong(A.TODAY)}</span></div><div id="tb">${today(day)}</div></aside></div></main>
      <footer class="foot"><span>Atlas League and Atlas Cup, season ${A.SEASON.label}</span><span>Competition Department · demo data</span></footer>`;
    document.getElementById("out").onclick = () => { store.set("user", null); login(); };
    app.querySelectorAll("[data-hub]").forEach((b) => (b.onclick = () => hub(b.dataset.hub)));
    app.onclick = (e) => { const d = e.target.closest("[data-day]"); if (d) document.getElementById("tb").innerHTML = today(d.dataset.day); };
  }
  store.get("user", null) ? hub("Competition") : login();
  A.ribbon("Competition Hub", "hub");
})();
