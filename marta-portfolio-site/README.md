# Marta Neira · Data Engineer

My personal site: who I am, my experience and education, and **ten live demo apps** rebuilt from tools I
built or run at work.

**Live site:** https://martaneira.github.io

| App | Link | What it does |
|---|---|---|
| Competition Hub | [/hub/](https://martaneira.github.io/hub/) | One sign-in for every competition tool |
| Referee Explorer | [/referee-explorer/](https://martaneira.github.io/referee-explorer/) | Every referee assignment since 2000, with filters and head-to-head |
| Referee Ranking | [/referee-ranking/](https://martaneira.github.io/referee-ranking/) | Play reviews and soft skills turned into a ranking and next round's crews |
| Game Kit | [/game-kit/](https://martaneira.github.io/game-kit/) | Facts and storylines for every game of the round |
| Security Reports | [/security-report/](https://martaneira.github.io/security-report/) | Clubs file a report after each home game; staff follow completion and incidents |
| Delegates | [/delegates/](https://martaneira.github.io/delegates/) | Arena checklists from three departments and the night report |
| Travel Plans | [/travel-plans/](https://martaneira.github.io/travel-plans/) | How every visiting team travels to every away game |
| High-Risk Games | [/high-risk-games/](https://martaneira.github.io/high-risk-games/) | Flag a game and send the security letter to both clubs |
| Injury Board | [/injury-board/](https://martaneira.github.io/injury-board/) | Player availability per round, team and game, without diagnoses |
| Coaching Insights | [/coaching-insights/](https://martaneira.github.io/coaching-insights/) | Player tables, matchups, rotations, lineups and a live game view |

## About the data

Every app runs on **Atlas Basketball**, an invented organisation with two competitions (Atlas League and
Atlas Cup), generated in the browser from a fixed seed in `shared/atlas.js`. No real club, player, referee,
medical or security data is used, and none of my employer's code is here: the apps are new code written
for this site, designed after the real tools. Anything you change in a demo is saved only in your own
browser.

## Structure

```
index.html, css/, js/, img/   the personal site (home + one page per app)
shared/atlas.js               the invented league: clubs, players, referees, schedule, box scores
shared/base.css               crests and the demo bar shared by every app
hub/                          Competition Hub
referee-explorer/  referee-ranking/  game-kit/  security-report/  delegates/
travel-plans/  high-risk-games/  injury-board/  coaching-insights/
                              one folder per app: index.html, app.css, app.js
```

No build step and no dependencies: plain HTML, CSS and JavaScript.

## Run locally

```powershell
python -m http.server 8000
```

Then open http://localhost:8000
