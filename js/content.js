/*
 * Text for each project page: what it does, what I did, how it works and a
 * short excerpt of the idea behind the code. The excerpts are rewritten for
 * this portfolio; the production code belongs to my employer.
 */
window.PROFILE = {
  name: "Marta Neira",
  role: "Data Engineer",
  languages: ["Spanish · native", "Catalan · native", "English · professional", "Italian · basic"],
  city: "Barcelona, Spain",
  email: "mneiramartinez33@gmail.com",
  github: "https://github.com/martaneira",
  linkedin: "https://www.linkedin.com/in/marta-neira33/",
};

window.PROJECTS = [
  {
    id: "referee-explorer", no: "01", area: "Referees", title: "Referee Explorer",
    tagline: "Every referee assignment since 2000, searchable in seconds.",
    teaser: "26 seasons of games and crews behind one set of filters, with head-to-head mode and export.",
    problem: [
      "The referee department regularly asked questions like “how often has this referee worked this club’s games?” or “who refereed every meeting between these two teams?”. The answers were in the league’s public games API, but split across one endpoint per season and competition, and people exported Excel files one season at a time.",
      "I built a single explorer over the whole history, designed to be pleasant to use: crests, filter chips and instant results.",
    ],
    did: [
      "Audited the public API across every season first and documented its gaps (missing referee slots, renamed phases, cancelled games) so the app shows what the data really contains.",
      "Wrote a loader that pulls every season of both competitions and turns the three or four referee slots of each game into one row per assignment.",
      "Built a Flask API with filters for season, phase, round, referee position, team and referee, plus a head-to-head mode that only keeps games between the selected teams.",
      "Designed the single-page frontend (crests come from the API itself) and added Excel export.",
      "Deployed it on Google Cloud Run with a mock-data mode for local development.",
    ],
    flow: [["Games API", "1 call per season × competition"], ["Loader", "normalise + cache"], ["Flask /api/games", "filters, head-to-head"], ["Web UI", "chips, table, export"]],
    stack: ["Python", "Flask", "Requests", "Google Cloud Run", "JavaScript", "openpyxl"],
    files: [["app.py", "API routes, filtering, Excel export"], ["loader.py", "season-by-season fetch with cache"], ["static/index.html", "single-page UI"], ["Dockerfile", "Cloud Run image"]],
    codeFile: "app.py · head-to-head filter",
    code: `<span class="k">def</span> filter_games(games, teams=(), h2h=False, side="any"):
    <span class="c">"""Keep games involving the selected teams.

    h2h=True keeps only games *between* two selected teams, so the
    home/away side filter no longer makes sense and is ignored."""</span>
    teams = set(teams)
    <span class="k">if not</span> teams:
        <span class="k">return</span> games
    <span class="k">if</span> h2h <span class="k">and</span> len(teams) >= 2:
        <span class="k">return</span> [g <span class="k">for</span> g <span class="k">in</span> games
                <span class="k">if</span> g[<span class="s">"home"</span>] <span class="k">in</span> teams <span class="k">and</span> g[<span class="s">"away"</span>] <span class="k">in</span> teams]
    keep = {<span class="s">"home"</span>: (<span class="s">"home"</span>,), <span class="s">"away"</span>: (<span class="s">"away"</span>,)}.get(side, (<span class="s">"home"</span>, <span class="s">"away"</span>))
    <span class="k">return</span> [g <span class="k">for</span> g <span class="k">in</span> games <span class="k">if</span> any(g[k] <span class="k">in</span> teams <span class="k">for</span> k <span class="k">in</span> keep)]`,
    demoNote: "Try: pick two teams and switch on head-to-head, then open a referee’s profile and export to Excel.",
  },
  {
    id: "game-kit", no: "02", area: "Media", title: "Game Kit",
    tagline: "Stats and storylines for every game of the round, ready before the round starts.",
    teaser: "Automated weekly notes for the media team, with a web app to review, edit and present them.",
    problem: [
      "Every week the media team prepares notes for each game: records, milestones, streaks and head-to-head facts. A colleague had written a script that generated these phrases from the league API, but it had to be started by hand, covered one competition at a time and its output lived in email only.",
      "I turned it into a scheduled pipeline for both competitions and gave the team a web app to work with the result.",
    ],
    did: [
      "Took over and extended a colleague’s phrase generator: both competitions, and a check that only sends a round once, when it starts within the next few days.",
      "Wrote an API client with throttling, retries that respect the Retry-After header, and an in-memory plus on-disk cache, so a full run stays polite to the API.",
      "Moved the run to GitHub Actions: it generates the phrases, emails them through SendGrid, uploads them to the app and commits the “last sent” state back to the repo.",
      "Built the Game Kit web app: browse by round, edit any phrase in place, and present one game per screen during meetings. A “Generate now” button starts the workflow.",
    ],
    flow: [["GitHub Actions", "manual or from the app"], ["Round check", "starts soon? already sent?"], ["Generator", "1 run per competition"], ["Outputs", "email + upload to app"]],
    stack: ["Python", "pandas", "Requests", "GitHub Actions", "SendGrid", "Flask"],
    files: [["send_both_if_new.py", "orchestrates both competitions"], ["run.py", "builds the phrases for one round"], ["api_client.py", "throttling, retries, cache"], ["game-kit-app/app.py", "browse, edit, present"]],
    codeFile: "send_both_if_new.py · send each round once",
    code: `<span class="k">def</span> should_send(competition, rounds, last_sent, today, window_days=4):
    <span class="c">"""Return the next round to send, or None.

    A round is sent when it starts within the window and has not been
    sent before. last_sent.json is committed back by the workflow, so
    re-running the job is always safe."""</span>
    upcoming = [r <span class="k">for</span> r <span class="k">in</span> rounds <span class="k">if</span> r.start >= today]
    <span class="k">if not</span> upcoming:
        <span class="k">return None</span>
    nxt = min(upcoming, key=<span class="k">lambda</span> r: r.start)
    <span class="k">if</span> (nxt.start - today).days > window_days:
        <span class="k">return None</span>
    <span class="k">if</span> last_sent.get(competition) == nxt.number:
        <span class="k">return None</span>
    <span class="k">return</span> nxt`,
    demoNote: "Try: search a player, edit a line, feature it, then press Showcase. Explore has leaders and career highs.",
  },
  {
    id: "security-report", no: "03", area: "Competition", title: "Security Report",
    tagline: "A purpose-built report every home club files after each game, and a dashboard to follow it.",
    teaser: "Replaced a generic form tool: personal links per club, reminders, completion grid and team stats.",
    problem: [
      "Home clubs reported on security after each game through a generic online form. The competition department couldn’t easily see who had submitted, who was late, or compare clubs over a season.",
      "Together with two colleagues I replaced it with our own app, built on the same pattern as our Travel Plans app.",
    ],
    did: [
      "Mapped the old questionnaire into a structured multi-step form (staffing, medical services, security meetings, incident checklist) and turned most free-text answers into options that can be counted.",
      "Gave each club a personal signed link plus password, and stored every report in BigQuery.",
      "Set up the emails: the report link goes to each club’s security manager before every home game, with reminders until it is submitted (SendGrid, scheduled jobs).",
      "Built the admin dashboard: a completion grid of teams × rounds (submitted, pending, overdue), per-team averages (spectators, ushers, stewards, paramedics), incident breakdowns and a detail view.",
      "Connected it to the department’s hub so staff sign in once for every tool.",
    ],
    flow: [["Schedule", "before each home game"], ["Email", "signed link per club"], ["Form", "multi-step, validated"], ["BigQuery", "one row per report"], ["Admin", "grid + team stats"]],
    stack: ["Python", "Flask", "itsdangerous", "BigQuery", "SendGrid", "Cloud Run", "GitHub CI deploy"],
    files: [["app.py", "club form with signed links"], ["admin.py", "grid, stats, detail, hub sign-in"], ["store.py", "BigQuery reads and writes"], ["templates/", "form steps and dashboard"]],
    codeFile: "admin.py · completion grid status",
    code: `<span class="k">def</span> cell_status(game, report, today, grace_days=2):
    <span class="c">"""Colour of one team × round cell in the completion grid."""</span>
    <span class="k">if</span> game <span class="k">is None</span>:
        <span class="k">return</span> <span class="s">"away"</span>          <span class="c"># no home game this round</span>
    <span class="k">if</span> game.date > today:
        <span class="k">return</span> <span class="s">"future"</span>
    <span class="k">if</span> report <span class="k">is not None</span>:
        <span class="k">return</span> <span class="s">"submitted"</span>
    late = (today - game.date).days > grace_days
    <span class="k">return</span> <span class="s">"overdue"</span> <span class="k">if</span> late <span class="k">else</span> <span class="s">"pending"</span>`,
    demoNote: "Try: open as a club, fill in a report, then see it turn green in the staff completion grid.",
  },
  {
    id: "delegates", no: "04", area: "Competition · Marketing · Media", title: "Delegates",
    tagline: "One place where three departments read the game delegate’s report, each seeing what matters to them.",
    teaser: "Delegate reports split by department, automatic incident flags and next-morning emails.",
    problem: [
      "After every game, the league’s delegate fills in a long report (about 155 questions across three forms) on an external officiating platform. Competition, Marketing and Media each need a different part of it, and often heard about problems days later.",
    ],
    did: [
      "Built the pipeline that brings the reports from the platform’s export into BigQuery (first as Cloud Functions, later consolidated).",
      "Built the review app with one view per department: Competition sees timing, court and officials; Marketing sees LED boards, branding and the halftime show; Media sees press seats, the mixed zone and broadcast issues.",
      "Added incident detection: answers that indicate a problem are flagged and routed to the right department.",
      "Automated two emails: a night report after each game day, and a Tuesday summary of the round’s incidents.",
      "Plugged it into the department hub with single sign-in.",
    ],
    flow: [["Officiating platform", "delegate fills the report"], ["Pipeline", "export → BigQuery"], ["Rules", "flag + route incidents"], ["App", "3 department views"], ["Emails", "night + Tuesday"]],
    stack: ["Python", "Flask", "BigQuery", "Cloud Functions", "Cloud Scheduler", "SendGrid"],
    files: [["pipeline/", "export ingestion into BigQuery"], ["app.py", "department views, hub sign-in"], ["flags.py", "incident rules per department"], ["emails.py", "night and weekly summaries"]],
    codeFile: "flags.py · route incidents to departments",
    code: `RULES = [
    <span class="c"># (department, question, answer that means "problem", label)</span>
    (<span class="s">"Competition"</span>, <span class="s">"shot_clock_ok"</span>,  <span class="k">False</span>,  <span class="s">"Shot clock failure"</span>),
    (<span class="s">"Competition"</span>, <span class="s">"tip_off_delay"</span>,  <span class="k">lambda</span> m: m > 5, <span class="s">"Tip-off delayed"</span>),
    (<span class="s">"Marketing"</span>,   <span class="s">"led_boards_ok"</span>,  <span class="k">False</span>,  <span class="s">"LED boards off"</span>),
    (<span class="s">"Media"</span>,       <span class="s">"mixed_zone_late"</span>, <span class="k">True</span>,  <span class="s">"Mixed zone late"</span>),
]

<span class="k">def</span> flags_for(report):
    out = []
    <span class="k">for</span> dept, q, bad, label <span class="k">in</span> RULES:
        value = report.get(q)
        hit = bad(value) <span class="k">if</span> callable(bad) <span class="k">else</span> value == bad
        <span class="k">if</span> value <span class="k">is not None and</span> hit:
            out.append({<span class="s">"dept"</span>: dept, <span class="s">"label"</span>: label})
    <span class="k">return</span> out`,
    demoNote: "Try: press Ctrl K to search, open a game’s checklist, then send a night report.",
  },
  {
    id: "injury-board", no: "05", area: "Sports", title: "Injury Board",
    tagline: "Player availability for every club, without exposing a single medical detail.",
    teaser: "Daily injury sync reduced to availability only, decided on the server.",
    problem: [
      "Injury records come from the clubs’ athlete-monitoring platform and from a reporting portal for the second competition. Staff needed to know who can play, but the records are medical data: diagnosis, body area and dates must stay with the medical team.",
    ],
    did: [
      "Connected to the athlete-monitoring export API and loaded it into BigQuery every morning, with a weekly summary email on Mondays.",
      "Built a reporting portal for the clubs of the second competition, and a normalisation step that maps both sources to the same categories so the competitions can be compared.",
      "Built the board: it joins rosters, crests and fixtures from the league API with the injury records, and reduces each player to an availability status (Available, In doubt, Partial training, Out) on the server. The diagnosis never reaches the browser.",
      "Protected it with the hub’s signed, single-use sign-in tokens.",
    ],
    flow: [["Monitoring API", "daily export"], ["BigQuery", "injuries table"], ["Server", "availability only"], ["Board", "rosters + fixtures"]],
    stack: ["Python", "Flask", "BigQuery", "Cloud Scheduler", "Cloud Run", "Privacy by design"],
    files: [["sync/main.py", "daily export → BigQuery"], ["app.py", "board API, hub sign-in"], ["normalize.py", "maps both sources to one model"], ["web/index.html", "board UI"]],
    codeFile: "app.py · only availability leaves the server",
    code: `<span class="k">def</span> availability(record, next_game_date):
    <span class="c">"""Reduce a medical record to one of three words.

    The diagnosis, body area and dates are used here and dropped:
    the JSON sent to the browser never contains them."""</span>
    <span class="k">if</span> record <span class="k">is None or</span> record.closed:
        <span class="k">return</span> <span class="s">"Available"</span>
    <span class="k">if</span> record.expected_return <span class="k">is None</span>:
        <span class="k">return</span> <span class="s">"Out"</span>
    days = (record.expected_return - next_game_date).days
    <span class="k">return</span> <span class="s">"Out"</span> <span class="k">if</span> days > 1 <span class="k">else</span> <span class="s">"In doubt"</span>

<span class="k">def</span> board_row(player, record, next_game_date):
    <span class="k">return</span> {<span class="s">"name"</span>: player.name, <span class="s">"number"</span>: player.number,
            <span class="s">"status"</span>: availability(record, next_game_date)}`,
    demoNote: "Try: switch rounds, open a team’s season availability grid, then check the Alerts tab.",
  },
  {
    id: "coaching-insights", no: "06", area: "Sports", title: "Coaching Insights",
    tagline: "Compare any two players, or one player against himself, in two clicks.",
    teaser: "Two-lens player comparison over three seasons, plus a live section during games.",
    problem: [
      "Coaches used a Tableau dashboard fed by a project that was being retired. They wanted the last two seasons as well as the current one, more flexible comparisons (home vs away, one season vs another) and live data during games.",
    ],
    did: [
      "Rebuilt the live box-score, shooting-chart and play-by-play loaders in our own Google Cloud project and replaced the hand-edited daily schedule with a 04:00 job that finds yesterday’s games and fills any gaps.",
      "Wrote SQL views over both competitions and a daily refresh that rebuilds the four tables the app reads.",
      "Built the Flask app: it loads those tables into memory, reloads them only when they change, and computes each side of the comparison (a “lens”) in Python.",
      "Added a Live section with a pluggable data provider, so the upcoming live stats feed can replace the simulator without touching the UI.",
    ],
    flow: [["Daily 04:00 job", "find yesterday’s games"], ["Loaders", "box score, PBP, shots"], ["BigQuery", "views + 4 app tables"], ["Flask", "in-memory lenses"], ["UI", "compare + live"]],
    stack: ["Python", "Flask", "BigQuery", "SQL", "Cloud Run", "Cloud Scheduler", "Tableau (previous)"],
    files: [["main.py", "routes and API"], ["data.py", "loads tables, computes lenses"], ["live.py", "live provider (demo / API)"], ["app_stats_refresh.sql", "daily table rebuild"]],
    codeFile: "data.py · one side of the comparison",
    code: `<span class="k">def</span> lens(logs, player_id, season=<span class="k">None</span>, venue=<span class="s">"all"</span>):
    <span class="c">"""Per-game averages for one player under one set of filters."""</span>
    df = logs[logs.player_id == player_id]
    <span class="k">if</span> season:
        df = df[df.season == season]
    <span class="k">if</span> venue != <span class="s">"all"</span>:
        df = df[df.is_home == (venue == <span class="s">"home"</span>)]
    <span class="k">if</span> df.empty:
        <span class="k">return None</span>
    avg = df[[<span class="s">"min"</span>, <span class="s">"pts"</span>, <span class="s">"reb"</span>, <span class="s">"ast"</span>, <span class="s">"stl"</span>, <span class="s">"tov"</span>, <span class="s">"pm"</span>]].mean().round(1)
    avg[<span class="s">"3p_pct"</span>] = round(100 * df.tpm.sum() / max(df.tpa.sum(), 1), 1)
    avg[<span class="s">"games"</span>] = len(df)
    <span class="k">return</span> avg.to_dict()`,
    demoNote: "Try: filter home games only, switch to per 28 minutes, compare three players, then open a live game.",
  },
  {
    id: "referee-ranking", no: "07", area: "Referees", title: "Referee Ranking",
    tagline: "Every reviewed play and evaluation turned into a ranking, and the ranking into next round’s crews.",
    teaser: "Call accuracy plus soft skills, adjustable weights, and a nomination screen that respects the rules.",
    problem: [
      "After each round, the referee department reviews the key plays of every game and evaluates each referee’s soft skills. Turning that into a fair ranking, and then into nominations for the next round, was a spreadsheet exercise every week.",
      "The ranking app existed when I joined. I took it over, and now run and extend it, including the weekly nomination tool.",
    ],
    did: [
      "Took over the codebase and its data model: reviewed plays with outcomes (correct call, incorrect no call, incorrect use of IRS…), soft-skill evaluations and referee levels and statuses.",
      "Kept the score transparent: call accuracy and soft skills with weights the department can change behind an edit code, and a minimum number of plays before a referee is ranked.",
      "Built the nomination view: the hardest games get the best-ranked active referees, never with a team they are not allowed to work with, and never twice in the same round.",
      "Added the assignments matrix (frequency rules per referee and team) and the historical view of games per season.",
    ],
    flow: [["Play reviews", "after each round"], ["Evaluations", "9 soft skills"], ["Ranking", "weighted score"], ["Nominations", "rules + difficulty"]],
    stack: ["Python", "Flask", "BigQuery", "SQL", "Cloud Run", "JavaScript"],
    files: [["ranking.py", "accuracy, soft skills, weighted score"], ["nominations.py", "crew suggestions with rules"], ["settings.py", "weights behind an edit code"], ["templates/", "referees, plays, nominations"]],
    codeFile: "nominations.py · suggest a crew",
    code: `<span class="k">def</span> suggest_crew(game, ranking, taken, rules):
    <span class="c">"""Best-ranked active referees who may work with both teams."""</span>
    ok = [r <span class="k">for</span> r <span class="k">in</span> ranking
          <span class="k">if</span> r.status == <span class="s">"Active"</span> <span class="k">and</span> r.id <span class="k">not in</span> taken
          <span class="k">and</span> rules.get((r.id, game.home)) != <span class="s">"Not allowed"</span>
          <span class="k">and</span> rules.get((r.id, game.away)) != <span class="s">"Not allowed"</span>]
    chief = next((r <span class="k">for</span> r <span class="k">in</span> ok <span class="k">if</span> r.can_lead), ok[0])
    rest = [r <span class="k">for</span> r <span class="k">in</span> ok <span class="k">if</span> r <span class="k">is not</span> chief][:2]
    <span class="k">return</span> [chief] + rest

<span class="c"># games are filled hardest first, so they get the top of the ranking</span>
<span class="k">for</span> game <span class="k">in</span> sorted(games, key=<span class="k">lambda</span> g: g.difficulty, reverse=<span class="k">True</span>):
    crew = suggest_crew(game, ranking, taken, rules)
    taken.update(r.id <span class="k">for</span> r <span class="k">in</span> crew)`,
    demoNote: "Try: change the round range, open a referee, then go to Nominations and Settings (edit code: demo).",
  },
  {
    id: "travel-plans", no: "08", area: "Competition", title: "Travel Plans",
    tagline: "How every visiting team travels to every away game, in one place.",
    teaser: "Clubs fill in their trip; the department sees what’s missing, what needs a look and the kilometres.",
    problem: [
      "Before each away game, clubs must tell the competition how they travel: flights or buses, arrival time, hotel and the trip home. It arrived by email in every format, and nobody could say quickly which plans were still missing.",
      "With two colleagues I built a dedicated app for it, which later became the pattern for our other club-facing apps.",
    ],
    did: [
      "Designed the club form around how teams actually travel: mode, scheduled or charter flights, transfers, arrival before practice or straight to the hotel, delays outside the club’s control, and double rounds.",
      "Calculated distances automatically from the departure and arrival points, and flagged plans where the distance could not be worked out.",
      "Built the completion view for the department: submitted, missing, flagged and needs-review counters, filters, CSV export and a detail page per trip.",
      "Made the opening window a setting (forms open a number of days before each game) and added the travel stats: kilometres by team and round, travel modes, charter vs scheduled.",
      "Deployed on Cloud Run with code in GitHub.",
    ],
    flow: [["Club form", "opens N days before"], ["Checks", "distance, arrival, delays"], ["BigQuery", "one row per trip"], ["Admin", "completion + stats"]],
    stack: ["Python", "Flask", "BigQuery", "Cloud Run", "SendGrid", "GitHub"],
    files: [["app.py", "club form and validation"], ["admin.py", "completion, flags, stats"], ["distance.py", "airport and city distances"], ["templates/", "form steps and dashboard"]],
    codeFile: "admin.py · status of one trip",
    code: `<span class="k">def</span> trip_status(game, plan, today, open_days=<span class="s">14</span>):
    <span class="k">if</span> plan <span class="k">is None</span>:
        opens = game.date - timedelta(days=open_days)
        <span class="k">return</span> <span class="s">"Opens"</span> <span class="k">if</span> today < opens <span class="k">else</span> <span class="s">"Missing"</span>
    <span class="k">if</span> plan.delay_reason <span class="k">and</span> plan.flag != <span class="s">"reviewed"</span>:
        <span class="k">return</span> <span class="s">"Flagged"</span>
    <span class="k">if</span> plan.arrival_date == game.date:
        <span class="k">return</span> <span class="s">"Needs review"</span>       <span class="c"># arriving on game day</span>
    <span class="k">if</span> plan.distance_km <span class="k">is None</span>:
        <span class="k">return</span> <span class="s">"Missing distance"</span>
    <span class="k">return</span> <span class="s">"Submitted"</span>`,
    demoNote: "Try: open as a club and fill in a trip, then switch to staff and open a flagged plan.",
  },
  {
    id: "high-risk-games", no: "09", area: "Competition", title: "High-Risk Games",
    tagline: "Flag a game, check the letter, and both clubs get it before tip-off.",
    teaser: "Security-plan letters to both clubs, sent automatically a set number of days before the game.",
    problem: [
      "When a game is considered high risk, the competition writes to both clubs with extra security requirements and a deadline. Each letter was written by hand, and it was easy to lose track of which ones had gone out.",
    ],
    did: [
      "Built a search over the upcoming schedule (league, cup or both) to flag a game in two clicks.",
      "Generated the letter from the game’s data, with separate requirements for the home and the visiting club and a reply deadline.",
      "Added the send settings: recipients per club that staff can add or remove, an auto-send a chosen number of days before the game, and a Send now button.",
      "Kept every letter sent on record, with who received it and whether it went automatically.",
    ],
    flow: [["Schedule", "search upcoming games"], ["Flag", "high risk"], ["Letter", "home + visiting club"], ["Scheduler", "auto-send N days before"], ["Sent", "on record"]],
    stack: ["Python", "Flask", "BigQuery", "Cloud Scheduler", "SendGrid", "Cloud Run"],
    files: [["app.py", "search, flag, preview"], ["letters.py", "letter text from game data"], ["sender.py", "daily auto-send job"], ["templates/", "pending, sent, preview"]],
    codeFile: "sender.py · daily job",
    code: `<span class="k">def</span> letters_due(pending, today):
    <span class="c">"""Flagged games whose letter should go out today."""</span>
    <span class="k">for</span> flag <span class="k">in</span> pending:
        send_on = flag.game.date - timedelta(days=flag.days_before)
        <span class="k">if</span> max(send_on, flag.created) <= today:
            <span class="k">yield</span> flag

<span class="k">for</span> flag <span class="k">in</span> letters_due(load_pending(), date.today()):
    send(flag.recipients_home + flag.recipients_away, render_letter(flag.game))
    mark_sent(flag, auto=<span class="k">True</span>)`,
    demoNote: "Try: search a team, flag a game, edit the recipients and press Send now.",
  },
  {
    id: "hub", no: "10", area: "Competition", title: "Competition Hub",
    tagline: "One sign-in for every competition tool.",
    teaser: "A single entry point with short-lived signed passes into each department app.",
    problem: [
      "As the number of internal apps grew, each one had its own password. Staff had to remember several logins, and turning someone’s access off meant touching every app.",
    ],
    did: [
      "Built a hub where staff sign in once and see the tools of their department, grouped by area.",
      "Opened each app with a short-lived signed pass, so the apps trust the hub instead of keeping their own passwords.",
      "Added a games-of-the-day panel so the hub is useful on its own on game days.",
    ],
    flow: [["Hub sign-in", "once"], ["Signed pass", "short-lived"], ["App", "verifies and opens"]],
    stack: ["Python", "Flask", "itsdangerous", "Cloud Run", "Secret Manager"],
    files: [["hub.py", "sign-in, tiles, passes"], ["passes.py", "sign and verify"], ["templates/", "login and hub"]],
    codeFile: "passes.py · sign and verify",
    code: `serializer = URLSafeTimedSerializer(SECRET, salt=<span class="s">"hub-pass"</span>)

<span class="k">def</span> make_pass(user, app):
    <span class="k">return</span> serializer.dumps({<span class="s">"user"</span>: user.email, <span class="s">"app"</span>: app})

<span class="k">def</span> read_pass(token, app, max_age=<span class="s">60</span>):
    data = serializer.loads(token, max_age=max_age)   <span class="c"># raises if old or forged</span>
    <span class="k">if</span> data[<span class="s">"app"</span>] != app:
        <span class="k">raise</span> BadSignature(<span class="s">"pass is for another app"</span>)
    <span class="k">return</span> data[<span class="s">"user"</span>]`,
    demoNote: "Try: sign in with any name, switch between Competition, Sports and Referees, and open a tool.",
  },
];

window.ALSO = [
  ["Live game data pipeline", "Box score, play-by-play and shot chart loaders on Cloud Run, filled daily."],
  ["Doping Control Register", "Records anti-doping tests and checks testing quotas per team and phase."],
  ["Historical data audit", "Documented 26 seasons of the league API, endpoint by endpoint, before building on it."],
  ["Player ID mapping", "Reviewed the player, coach and team ID mapping with an external data partner."],
];
