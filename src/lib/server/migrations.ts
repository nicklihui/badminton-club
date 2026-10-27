/**
 * Schema migrations, applied in order on startup. PRAGMA user_version records
 * how many have run. Never edit a migration that has shipped; append a new one.
 */
export const migrations: string[] = [
	`
	CREATE TABLE admins (
		id INTEGER PRIMARY KEY,
		username TEXT NOT NULL UNIQUE COLLATE NOCASE,
		password_hash TEXT NOT NULL,
		created_at INTEGER NOT NULL
	);

	CREATE TABLE sessions (
		token_hash TEXT PRIMARY KEY,
		admin_id INTEGER NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
		expires_at INTEGER NOT NULL
	);

	-- Club members. Kept across tournaments so stats can build up over time.
	CREATE TABLE players (
		id INTEGER PRIMARY KEY,
		name TEXT NOT NULL UNIQUE COLLATE NOCASE,
		archived INTEGER NOT NULL DEFAULT 0,
		created_at INTEGER NOT NULL
	);

	CREATE TABLE tournaments (
		id INTEGER PRIMARY KEY,
		name TEXT NOT NULL,
		format TEXT NOT NULL,
		status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'finished')),
		courts INTEGER NOT NULL DEFAULT 0,      -- 0 = as many as the players fill
		held_on TEXT,                           -- ISO date
		created_at INTEGER NOT NULL
	);

	-- Who takes part in a tournament. "active" = still available for new rounds.
	CREATE TABLE entries (
		tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
		player_id INTEGER NOT NULL REFERENCES players(id),
		active INTEGER NOT NULL DEFAULT 1,
		PRIMARY KEY (tournament_id, player_id)
	);

	CREATE TABLE rounds (
		id INTEGER PRIMARY KEY,
		tournament_id INTEGER NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
		number INTEGER NOT NULL,
		created_at INTEGER NOT NULL,
		UNIQUE (tournament_id, number)
	);

	CREATE TABLE round_byes (
		round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
		player_id INTEGER NOT NULL REFERENCES players(id),
		PRIMARY KEY (round_id, player_id)
	);

	CREATE TABLE matches (
		id INTEGER PRIMARY KEY,
		round_id INTEGER NOT NULL REFERENCES rounds(id) ON DELETE CASCADE,
		court INTEGER NOT NULL,
		score_a INTEGER,
		score_b INTEGER,
		scored_at INTEGER
	);

	-- One row per player per match; side A or B. Works for singles and doubles alike.
	CREATE TABLE match_players (
		match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
		side TEXT NOT NULL CHECK (side IN ('A', 'B')),
		player_id INTEGER NOT NULL REFERENCES players(id),
		PRIMARY KEY (match_id, player_id)
	);

	CREATE INDEX rounds_tournament ON rounds(tournament_id);
	CREATE INDEX matches_round ON matches(round_id);
	CREATE INDEX match_players_player ON match_players(player_id);
	`,
	`
	-- Matches are played over sets. Each set stores its real points, e.g. 21:15.
	CREATE TABLE match_sets (
		match_id INTEGER NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
		set_no INTEGER NOT NULL CHECK (set_no >= 1),
		score_a INTEGER NOT NULL,
		score_b INTEGER NOT NULL,
		PRIMARY KEY (match_id, set_no)
	);
	INSERT INTO match_sets (match_id, set_no, score_a, score_b)
		SELECT id, 1, score_a, score_b FROM matches WHERE score_a IS NOT NULL AND score_b IS NOT NULL;
	ALTER TABLE matches DROP COLUMN score_a;
	ALTER TABLE matches DROP COLUMN score_b;

	ALTER TABLE tournaments ADD COLUMN best_of INTEGER NOT NULL DEFAULT 3 CHECK (best_of IN (1, 3, 5));
	-- tournaments created before sets existed were single-game
	UPDATE tournaments SET best_of = 1;
	`
];
