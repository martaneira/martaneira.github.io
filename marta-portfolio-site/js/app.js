/* Marta Neira · personal portfolio. Hash routing: #home (with #experience, #projects,
   #skills, #education, #about, #contact anchors) or #<project-id>. */
(function () {
  "use strict";
  const P = window.PROJECTS, ME = window.PROFILE;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const main = document.getElementById("main");
  let cleanup = null;


  const EXPERIENCE = [
    {
      role: "Data Engineer", org: "EuroLeague Basketball", place: "Barcelona", when: "July 2026 – today",
      lead: "I build the data pipelines, APIs and internal web apps behind EuroLeague and EuroCup competition operations.",
      points: [
        "Build SQL and Python pipelines on Google Cloud that turn raw competition stats into data ready for dashboards and apps.",
        "Design the apps clubs and staff use to send and review information: security reports, travel plans, high-risk games, delegate reports and injury availability.",
        "Rebuilt the live box-score, play-by-play and shot-chart loaders in a new Google Cloud project, with a daily job that finds played games and fills any gaps.",
        "Built a single sign-on hub so staff use one login across the department tools.",
        "Audited 26 seasons of the league’s public API endpoint by endpoint, and reviewed the player, coach and team ID mapping with an external data partner.",
        "Work with analysts so the coaching and operations dashboards run on clean, reliable data.",
      ],
      stack: ["Python", "SQL", "BigQuery", "Cloud Run", "Flask", "Cloud Scheduler", "SendGrid", "Tableau"],
    },
    {
      role: "Graduate Assistant", org: "Providence College", place: "Rhode Island, US", when: "Sep 2025 – May 2026",
      lead: "Graduate assistant in the Business Department during my MBA.",
      points: [], stack: ["Data", "Business analytics"],
    },
    {
      role: "Head Student Manager", org: "Bryant University", place: "Rhode Island, US", when: "Fall 2024 – May 2025",
      lead: "Equipment room intern for Bryant Athletics.",
      points: ["Coordinated a team of 12 students to distribute and maintain athletic equipment on time.", "Managed inventory: ordering and restocking."],
      stack: ["Team coordination", "Inventory"],
    },
    {
      role: "Analytics Intern", org: "Cutco", place: "Online", when: "Spring 2024",
      lead: "Market analysis internship.",
      points: ["Analysed market trends and gave stock recommendations based on the data.", "Identified opportunities in emerging industries to attract new clients."],
      stack: ["Market analysis", "Excel"],
    },
    {
      role: "Student-athlete", org: "Bryant University", place: "Rhode Island, US", when: "2021 – 2025",
      lead: "NCAA Division I women’s basketball (#33), while studying applied mathematics and statistics.",
      points: ["Balanced a full Division I schedule with a demanding degree and a 3.92 GPA."],
      stack: ["Teamwork", "Discipline", "Performance under pressure"],
    },
  ];

  const SKILLS = [
    ["Data engineering", ["BigQuery", "SQL", "ETL / ELT pipelines", "Cloud Run", "Cloud Functions", "Cloud Scheduler", "Firestore", "REST APIs", "Data quality audits"]],
    ["Programming", ["Python", "SQL", "R", "Java", "C++", "pandas", "Flask", "JavaScript", "HTML / CSS", "Git"]],
    ["Analytics", ["Statistics", "SAS", "Tableau", "Excel", "Dashboards", "Data modelling"]],
    ["Ways of working", ["Stakeholder interviews", "Documentation", "Security and secrets", "AI-assisted development"]],
  ];

  function home() {
    document.title = `${ME.name} · Data Engineer`;
    main.innerHTML = `
      <section class="hero"><div class="wrap">
        <svg class="court" viewBox="0 0 600 560" fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true"><rect x="20" y="20" width="560" height="520"/><rect x="220" y="20" width="160" height="230"/><circle cx="300" cy="250" r="60"/><path d="M60 20 V150 A240 240 0 0 0 540 150 V20"/><circle cx="300" cy="62" r="11"/></svg>
        <div class="kicker">Data Engineer · ${esc(ME.city)}</div>
        <h1>Marta <em>Neira</em></h1>
        <p class="lede">I’m a data engineer at <strong>EuroLeague Basketball</strong>. I build the pipelines, APIs and web apps that run competition operations: from live game data in BigQuery to the tools clubs and staff use every week.</p>
        <div class="ctas"><a class="btn big" href="#projects">See my apps</a><a class="btn big ghost" href="./hub/">Open the app hub ↗</a><a class="btn big ghost" href="${ME.linkedin}">LinkedIn</a></div>
        <div class="scoreboard">
          <div><b class="num">${P.length}</b><span>live demo apps</span></div>
          <div><b class="num">26</b><span>seasons of data audited</span></div>
          <div><b class="num">3.92</b><span>GPA at Bryant</span></div>
          <div><b class="num">33</b><span>my number at Bryant</span></div>
        </div>
      </div></section>

      <section class="section" id="experience"><div class="wrap">
        <div class="section-head"><h2>Experience</h2><p>Where I’ve worked and what I delivered.</p></div>
        <div class="xp">${EXPERIENCE.map((x) => `
          <article class="job">
            <div class="job-side"><span class="when">${esc(x.when)}</span><span class="place">${esc(x.place)}</span></div>
            <div class="job-main">
              <h3>${esc(x.role)} <span>· ${esc(x.org)}</span></h3>
              <p class="job-lead">${esc(x.lead)}</p>
              ${x.points.length ? `<ul>${x.points.map((t) => `<li>${esc(t)}</li>`).join("")}</ul>` : ""}
              <div class="stack">${x.stack.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
              ${x.link ? `<p style="margin:12px 0 0"><a class="textlink" href="${x.link[1]}">${esc(x.link[0])} →</a></p>` : ""}
            </div>
          </article>`).join("")}
        </div>
      </div></section>

      <section class="section" id="projects" style="padding-top:0"><div class="wrap">
        <div class="section-head"><h2>My apps</h2><p>${P.length} tools I built or run at work, rebuilt from scratch as live demos. They run on an invented league, Atlas Basketball, so no real club, player, referee or medical data appears here. Open any app and click around, or read how I built it.</p></div>
        <div class="roster">${P.map((p) => `
          <article class="card"><a class="thumb" href="./${p.id}/" tabindex="-1" aria-hidden="true"><img src="img/apps/${p.id}.jpg" alt="" loading="lazy" width="1440" height="900"></a>
            <div class="body"><span class="area">${esc(p.area)}</span><div class="head-row"><h3><a class="stretch" href="#${p.id}">${esc(p.title)}</a></h3><span class="jersey">${p.no}</span></div><p>${esc(p.teaser)}</p>
            <div class="links"><a class="app" href="./${p.id}/">Open the app</a><a class="cs" href="#${p.id}">How I built it</a></div></div></article>`).join("")}
        </div>
        <p class="apps-note">Every app is plain HTML, CSS and JavaScript, generated in your browser from the same invented data. Code: <a class="textlink" href="${ME.github}/martaneira.github.io">github.com/martaneira/martaneira.github.io</a></p>
        <div class="also-wrap"><h3 class="also-h">Also built</h3>
          <div class="also">${window.ALSO.map(([t, d]) => `<div><b>${esc(t)}</b><span>${esc(d)}</span></div>`).join("")}</div></div>
      </div></section>

      <section class="section band" id="skills"><div class="wrap">
        <div class="section-head"><h2>Skills</h2><p style="color:inherit;opacity:.75">The tools I use every week.</p></div>
        <div class="skills">${SKILLS.map(([g, list]) => `<div><b>${esc(g)}</b><div class="stack">${list.map((t) => `<span class="chip dark">${esc(t)}</span>`).join("")}</div></div>`).join("")}</div>
      </div></section>

      <section class="section" id="education"><div class="wrap">
        <div class="section-head"><h2>Education</h2></div>
        <div class="edu-grid">
          <figure class="edu-card"><img src="img/mba.jpg" alt="Marta at her MBA graduation at Providence College" width="720" height="900" loading="lazy">
            <figcaption><span class="when2">Sep 2025 – Jul 2026</span><b>MBA</b><span>Providence College · concentration in Mathematics &amp; Business Analytics</span></figcaption></figure>
          <figure class="edu-card"><img src="img/bryant-grad.jpg" alt="Marta at her graduation at Bryant University" width="720" height="900" loading="lazy">
            <figcaption><span class="when2">2021 – 2025</span><b>Applied Mathematics &amp; Statistics</b><span>Bryant University · 3.92 GPA · minors in International Business and Business Administration</span></figcaption></figure>
          <figure class="edu-card"><img src="img/court-33.jpg" alt="Marta playing for Bryant University, number 33" width="640" height="800" loading="lazy">
            <figcaption><span class="when2">2021 – 2025</span><b>NCAA Division I basketball</b><span>Bryant University women’s basketball · #33</span></figcaption></figure>
        </div>
        <div class="edu-more">
          <div><b>Honours</b><ul><li>SAS Institute Award at commencement, Bryant University</li><li>President’s List (spring and fall 2023), Dean’s List every other semester</li><li>Applied Mathematics Club and Bryant Research</li><li>High school valedictorian, Escola Palcam, Barcelona</li></ul></div>
          <div><b>Projects</b><ul><li>Consultant, Chafee Center for International Business: go-to-market plan in the US for a cyber-security software firm (2024)</li><li>X-Culture: top 20 worldwide with an international team, business plan for a Japanese company (2024)</li></ul></div>
          <div><b>Certifications</b><ul><li>SQL, Harvard edX</li><li>SAS certification, Bryant University</li><li>Data Science Engineering, first year, Universitat Politècnica de Catalunya (2021)</li></ul></div>
        </div>
      </div></section>

      <section class="section" id="about" style="padding-top:0"><div class="wrap about-me">
        <img src="img/marta.jpg" alt="Portrait of Marta Neira" width="600" height="600">
        <div><div class="section-head"><h2>About me</h2></div>
          <p>I’m from Barcelona. I moved to the US to play Division I basketball and study maths, stayed for an MBA in data analytics, and came home to work in basketball from the data side.</p>
          <p>Sport taught me how teams work: everyone needs the right information at the right moment. That’s what I like building. I start from the people who will use a tool, check the data before trusting it, and ship small, documented pieces that keep running.</p>
          <p>I build with an AI pair programmer, which makes me faster. I own the problem, the design, the data decisions, testing and delivery.</p>
          <div class="stack" style="margin-top:14px">${ME.languages.map((l) => `<span class="chip">${esc(l)}</span>`).join("")}</div>
        </div>
      </div></section>

      <section class="section cta-band" id="contact"><div class="wrap cta-inner">
        <div><h2>Let’s talk</h2><p>Open to data engineering and analytics engineering roles. The fastest way to reach me is email or LinkedIn.</p></div>
        <div class="contact-btns"><a class="btn big light" href="mailto:${ME.email}">${esc(ME.email)}</a><a class="btn big ghost light-ghost" href="${ME.linkedin}">LinkedIn</a></div>
      </div></section>`;
  }

  function project(p) {
    document.title = `${p.title} · ${ME.name}`;
    const i = P.indexOf(p), prev = P[(i - 1 + P.length) % P.length], next = P[(i + 1) % P.length];
    main.innerHTML = `
      <section class="proj-head"><div class="wrap">
        <a class="back" href="#projects">← All apps</a>
        <span class="jersey">${p.no}</span>
        <div class="kicker">${esc(p.area)}</div>
        <div><h1>${esc(p.title)}</h1><p class="tagline">${esc(p.tagline)}</p></div>
      </div></section>
      <div class="wrap">
        <a class="shot" href="./${p.id}/"><span class="badge">Live app</span><img src="img/apps/${p.id}.jpg" alt="Screenshot of the ${esc(p.title)} demo app" width="1440" height="900"></a>
        <div class="app-actions"><a class="btn big" href="./${p.id}/">Open the app ↗</a><a class="btn big ghost" href="${ME.github}/martaneira.github.io/tree/main/${p.id}">See the code</a><span class="try">${esc(p.demoNote)}</span></div>
        <div class="cols">
          <div><h2>The problem</h2>${p.problem.map((t) => `<p>${esc(t)}</p>`).join("")}
            <h2 style="margin-top:26px">What I did</h2><ol class="did">${p.did.map((t) => `<li>${esc(t)}</li>`).join("")}</ol></div>
          <div><h2>How it works</h2>
            <div class="flow">${p.flow.map(([a, b], k) => `${k ? '<span class="arrow" aria-hidden="true">→</span>' : ""}<span class="step">${esc(a)}<small>${esc(b)}</small></span>`).join("")}</div>
            <div class="stack" style="margin-bottom:18px">${p.stack.map((t) => `<span class="chip">${esc(t)}</span>`).join("")}</div>
            <h2 style="font-size:24px">Code at a glance</h2>
            <ul class="files">${p.files.map(([f, d]) => `<li><b>${esc(f)}</b> · ${esc(d)}</li>`).join("")}</ul>
            <div class="codefile">${esc(p.codeFile)}</div>
            <pre class="code"><code>${p.code}</code></pre>
            <p class="note">Excerpt rewritten for this portfolio; the production code belongs to my employer. The demo app is new code written for this site.</p>
          </div>
        </div>
        <nav class="next-prev" aria-label="More projects"><a href="#${prev.id}"><small>← Previous</small>${esc(prev.title)}</a><a href="#${next.id}" style="text-align:right"><small>Next →</small>${esc(next.title)}</a></nav>
      </div>`;
  }

  const ANCHORS = ["experience", "projects", "skills", "education", "about", "contact"];
  function route() {
    if (typeof cleanup === "function") cleanup();
    cleanup = null;
    const id = (location.hash || "#home").slice(1);
    const p = P.find((x) => x.id === id);
    if (p) { project(p); window.scrollTo(0, 0); return; }
    if (!main.querySelector("#experience")) home();
    if (ANCHORS.includes(id)) document.getElementById(id)?.scrollIntoView();
    else window.scrollTo(0, 0);
  }

  document.getElementById("brand").innerHTML = `<span>Marta Neira</span>`;
  document.getElementById("foot").innerHTML = `<div class="wrap foot-grid">
    <div class="foot-brand"><div><b>Marta Neira</b><span>Data Engineer · ${esc(ME.city)}</span></div></div>
    <div><b>Contact</b><span>${esc(ME.email)}</span></div>
    <div><b>Elsewhere</b><a href="${ME.linkedin}">LinkedIn</a><a href="${ME.github}">GitHub</a><a href="https://martaneira.github.io/backcourt/">Backcourt</a></div>
    <div class="foot-legal">© ${new Date().getFullYear()} Marta Neira. The apps use invented data (Atlas Basketball).</div>
  </div>`;
  window.addEventListener("hashchange", route);
  route();
})();
