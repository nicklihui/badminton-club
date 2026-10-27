# Badminton Club

A small website for running club tournaments. Organisers draw random doubles rounds and enter results set by set. Everyone else follows the draw and standings live on their phone.

- **Random-partner doubles:** every round shuffles the players into new pairs, avoids repeat partners and opponents, and rotates who sits out fairly.
- **Results per set:** matches are one set, best of 3 or best of 5, with the real points of each set (e.g. 21:15).
- **Standings:** ranked by matches won, then sets won, then total points scored.

## Requirements

- [Node.js](https://nodejs.org) 22.13 or newer
- [Git](https://git-scm.com)

The database is a single SQLite file, so nothing else needs installing.

## Run it for a club night

Each computer that runs the site keeps its **own** results. Run it on **one** computer, for example the organiser's laptop, and let everyone else open it in their phone browser over the same Wi-Fi.

**Install once:**

```sh
git clone https://github.com/nicklihui/badminton-club.git
cd badminton-club
npm ci
npm run build
```

**Start it each club night:**

```sh
npm run local
```

It prints the addresses to open:

```
Badminton club site is running.
  On this computer:  http://localhost:3000
  On phones (Wi-Fi): http://<laptop-ip>:3000
```

`<laptop-ip>` is the laptop's address on the Wi-Fi network. The command prints the real one.

- Phones must be on the same Wi-Fi as the laptop.
- On Windows, allow Node.js through the firewall when asked, choosing **private networks**. Otherwise phones can't connect.
- Stop the site with `Ctrl+C`.

**Get the latest changes:**

When this repository is updated with new features or fixes, the laptop running the site still has the old copy. To bring it up to date, stop the site and run:

```sh
git pull        # download the latest code
npm ci          # install anything new it needs
npm run build   # rebuild the site
```

Then start it again with `npm run local`. Players, tournaments and results are kept, and the database upgrades itself if needed.

## Using the site

1. **First start:** open the site and create the first **organiser** account. Organisers can add more organisers under **Organisers**. Viewers don't need an account.
2. **Create a tournament** on the Tournaments page: name, date, number of courts and sets per match.
3. **Add players** on the tournament's **Players** tab. Tick club members you've added before, or type new names separated by commas.
4. **Draw a round** on the **Rounds** tab. Each court gets four players, and anyone left over sits out. **Redraw** replaces the latest round as long as it has no results yet.
5. **Enter results** on each court card, set by set. The third set of a best of 3 is only needed if it's 1–1.
6. **Standings** update as soon as a result is saved. Each player is credited with their pair's result. Players level on matches won, sets won and points share a place.
7. If someone leaves early, switch them to **Not playing** on the Players tab. They keep their results and aren't drawn again.
8. **Finish the tournament** at the bottom of the Players tab. This stops new rounds; results stay visible and the tournament can be reopened.

The **Players** page in the top menu shows each club member's totals across all tournaments.

## Settings

Optional. Put these in a `.env` file in the project folder, or set them as environment variables:

| Variable        | Default          | Meaning                                  |
| --------------- | ---------------- | ---------------------------------------- |
| `CLUB_NAME`     | `Badminton Club` | Name shown in the header and page titles |
| `PORT`          | `3000`           | Port the site listens on                 |
| `DATABASE_PATH` | `data/club.db`   | Where results are stored                 |

## Backups

All players, tournaments and results are in `data/club.db`. To back up, stop the site and copy that file somewhere safe. To restore, put the copy back in `data/` before starting.

## Deploy on a server (optional)

To host it permanently under its own web address, run it behind a reverse proxy with HTTPS (Caddy, nginx, Traefik). `ORIGIN` must be the public address people use, or the site will refuse sign-ins and score entry.

With Docker (edit `ORIGIN` and `CLUB_NAME` in `compose.yaml` first):

```sh
docker compose up -d --build
```

Without Docker:

```sh
npm ci
npm run build
ORIGIN=https://club.example.org DATABASE_PATH=/var/lib/club/club.db PORT=3000 node build
```

On a server, back up the database while it runs with `sqlite3 club.db ".backup backup.db"`.
