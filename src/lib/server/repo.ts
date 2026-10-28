import { isFormat, type FormatId } from '$lib/formats';
import type { Problem } from '$lib/i18n';
import { isBestOf, type BestOf, type Entry, type MatchView, type RoundView, type SetScore, type Tournament } from '$lib/types';
import { all, get, run, tx } from './db';
import { buildHistory, drawers } from './formats';

/* ---------- players ---------- */

export interface PlayerRow {
	id: number;
	name: string;
	archived: boolean;
}

export function listPlayers(): PlayerRow[] {
	return all<{ id: number; name: string; archived: number }>(
		'SELECT id, name, archived FROM players ORDER BY name COLLATE NOCASE'
	).map((p) => ({ ...p, archived: !!p.archived }));
}

/** Splits "Anna, Ben\nChloe" into clean, de-duplicated names. */
export function parseNames(text: string): string[] {
	const seen = new Set<string>();
	const names: string[] = [];
	for (const raw of text.split(/[,;\n]/)) {
		const n = raw.trim().replace(/\s+/g, ' ').slice(0, 40);
		if (n && !seen.has(n.toLowerCase())) {
			seen.add(n.toLowerCase());
			names.push(n);
		}
	}
	return names;
}

/** Finds each name among club players (case-insensitive), creating the missing ones. */
export function findOrCreatePlayers(names: string[]): number[] {
	return tx(() =>
		names.map((name) => {
			const found = get<{ id: number; archived: number }>('SELECT id, archived FROM players WHERE name = ?', name);
			if (found) {
				if (found.archived) run('UPDATE players SET archived = 0 WHERE id = ?', found.id);
				return found.id;
			}
			return run('INSERT INTO players (name, created_at) VALUES (?, ?)', name, Date.now()).id;
		})
	);
}

export function renamePlayer(id: number, name: string): Problem | null {
	name = name.trim().replace(/\s+/g, ' ').slice(0, 40);
	if (!name) return 'enterName';
	if (get('SELECT 1 FROM players WHERE name = ? AND id != ?', name, id)) return 'playerExists';
	run('UPDATE players SET name = ? WHERE id = ?', name, id);
	return null;
}

export function setPlayerArchived(id: number, archived: boolean) {
	run('UPDATE players SET archived = ? WHERE id = ?', archived ? 1 : 0, id);
}

/* ---------- tournaments ---------- */

interface TournamentRow {
	id: number;
	name: string;
	format: string;
	status: 'open' | 'finished';
	courts: number;
	best_of: number;
	held_on: string | null;
	created_at: number;
}

const toTournament = (r: TournamentRow): Tournament => ({
	id: r.id,
	name: r.name,
	format: (isFormat(r.format) ? r.format : 'random_doubles') as FormatId,
	status: r.status,
	courts: r.courts,
	bestOf: isBestOf(r.best_of) ? r.best_of : 3,
	heldOn: r.held_on,
	createdAt: r.created_at
});

export interface TournamentSummary extends Tournament {
	players: number;
	rounds: number;
	matches: number;
	scored: number;
}

export function listTournaments(): TournamentSummary[] {
	return all<TournamentRow & { players: number; rounds: number; matches: number; scored: number }>(`
		SELECT t.*,
			(SELECT COUNT(*) FROM entries e WHERE e.tournament_id = t.id) AS players,
			(SELECT COUNT(*) FROM rounds r WHERE r.tournament_id = t.id) AS rounds,
			(SELECT COUNT(*) FROM matches m JOIN rounds r ON r.id = m.round_id WHERE r.tournament_id = t.id) AS matches,
			(SELECT COUNT(*) FROM matches m JOIN rounds r ON r.id = m.round_id
				WHERE r.tournament_id = t.id AND EXISTS (SELECT 1 FROM match_sets s WHERE s.match_id = m.id)) AS scored
		FROM tournaments t
		ORDER BY t.status = 'finished', COALESCE(t.held_on, '') DESC, t.created_at DESC
	`).map((r) => ({ ...toTournament(r), players: r.players, rounds: r.rounds, matches: r.matches, scored: r.scored }));
}

export function getTournament(id: number): Tournament | undefined {
	const r = get<TournamentRow>('SELECT * FROM tournaments WHERE id = ?', id);
	return r && toTournament(r);
}

interface TournamentInput {
	name: string;
	courts: number;
	bestOf: BestOf;
	heldOn: string | null;
}

export function createTournament(t: TournamentInput & { format: FormatId }): number {
	return run(
		'INSERT INTO tournaments (name, format, courts, best_of, held_on, created_at) VALUES (?, ?, ?, ?, ?, ?)',
		t.name,
		t.format,
		t.courts,
		t.bestOf,
		t.heldOn,
		Date.now()
	).id;
}

export function updateTournament(id: number, t: TournamentInput) {
	run(
		'UPDATE tournaments SET name = ?, courts = ?, best_of = ?, held_on = ? WHERE id = ?',
		t.name,
		t.courts,
		t.bestOf,
		t.heldOn,
		id
	);
}

export function setTournamentStatus(id: number, status: 'open' | 'finished') {
	run('UPDATE tournaments SET status = ? WHERE id = ?', status, id);
}

export function deleteTournament(id: number) {
	run('DELETE FROM tournaments WHERE id = ?', id);
}

/* ---------- entries ---------- */

export function listEntries(tournamentId: number): Entry[] {
	return all<{ player_id: number; name: string; active: number }>(
		`SELECT e.player_id, p.name, e.active FROM entries e JOIN players p ON p.id = e.player_id
		 WHERE e.tournament_id = ? ORDER BY p.name COLLATE NOCASE`,
		tournamentId
	).map((e) => ({ playerId: e.player_id, name: e.name, active: !!e.active }));
}

export function addEntries(tournamentId: number, playerIds: number[]) {
	tx(() => {
		for (const id of playerIds)
			run('INSERT INTO entries (tournament_id, player_id) VALUES (?, ?) ON CONFLICT (tournament_id, player_id) DO UPDATE SET active = 1', tournamentId, id);
	});
}

export function setEntryActive(tournamentId: number, playerId: number, active: boolean) {
	run('UPDATE entries SET active = ? WHERE tournament_id = ? AND player_id = ?', active ? 1 : 0, tournamentId, playerId);
}

/** Removes a player from a tournament, only if they have no rounds in it yet. */
export function removeEntry(tournamentId: number, playerId: number): Problem | null {
	const used = get(
		`SELECT 1 FROM rounds r WHERE r.tournament_id = ? AND (
			EXISTS (SELECT 1 FROM round_byes b WHERE b.round_id = r.id AND b.player_id = ?) OR
			EXISTS (SELECT 1 FROM matches m JOIN match_players mp ON mp.match_id = m.id
				WHERE m.round_id = r.id AND mp.player_id = ?))`,
		tournamentId,
		playerId,
		playerId
	);
	if (used) return 'playerInRound';
	run('DELETE FROM entries WHERE tournament_id = ? AND player_id = ?', tournamentId, playerId);
	return null;
}

/* ---------- rounds and matches ---------- */

export function listRounds(tournamentId: number): RoundView[] {
	const rounds = all<{ id: number; number: number }>(
		'SELECT id, number FROM rounds WHERE tournament_id = ? ORDER BY number',
		tournamentId
	);
	const matches = all<{ id: number; round_id: number; court: number }>(
		`SELECT m.id, m.round_id, m.court FROM matches m
		 JOIN rounds r ON r.id = m.round_id WHERE r.tournament_id = ? ORDER BY m.court`,
		tournamentId
	);
	const sets = all<{ match_id: number; score_a: number; score_b: number }>(
		`SELECT s.match_id, s.score_a, s.score_b FROM match_sets s
		 JOIN matches m ON m.id = s.match_id JOIN rounds r ON r.id = m.round_id
		 WHERE r.tournament_id = ? ORDER BY s.match_id, s.set_no`,
		tournamentId
	);
	const sides = all<{ match_id: number; side: 'A' | 'B'; player_id: number }>(
		`SELECT mp.match_id, mp.side, mp.player_id FROM match_players mp
		 JOIN matches m ON m.id = mp.match_id JOIN rounds r ON r.id = m.round_id
		 WHERE r.tournament_id = ? ORDER BY mp.rowid`,
		tournamentId
	);
	const byes = all<{ round_id: number; player_id: number }>(
		`SELECT b.round_id, b.player_id FROM round_byes b JOIN rounds r ON r.id = b.round_id
		 WHERE r.tournament_id = ? ORDER BY b.rowid`,
		tournamentId
	);

	const byRound = new Map<number, RoundView>(rounds.map((r) => [r.id, { id: r.id, number: r.number, byes: [], matches: [] }]));
	const byMatch = new Map<number, MatchView>();
	for (const m of matches) {
		const view: MatchView = { id: m.id, court: m.court, a: [], b: [], sets: [] };
		byMatch.set(m.id, view);
		byRound.get(m.round_id)!.matches.push(view);
	}
	for (const s of sides) byMatch.get(s.match_id)![s.side === 'A' ? 'a' : 'b'].push(s.player_id);
	for (const s of sets) byMatch.get(s.match_id)!.sets.push({ a: s.score_a, b: s.score_b });
	for (const b of byes) byRound.get(b.round_id)!.byes.push(b.player_id);
	return [...byRound.values()];
}

export function drawNextRound(tournamentId: number): Problem | null {
	return tx((): Problem | null => {
		const t = getTournament(tournamentId);
		if (!t) return 'tournamentGone';
		if (t.status === 'finished') return 'tournamentFinished';
		const active = listEntries(tournamentId)
			.filter((e) => e.active)
			.map((e) => e.playerId);
		const rounds = listRounds(tournamentId);
		const drawn = drawers[t.format]({ active, courts: t.courts, history: buildHistory(rounds) });
		if (!drawn.matches.length) return 'notEnoughPlayers';

		const number = (rounds.at(-1)?.number ?? 0) + 1;
		const roundId = run('INSERT INTO rounds (tournament_id, number, created_at) VALUES (?, ?, ?)', tournamentId, number, Date.now()).id;
		for (const id of drawn.byes) run('INSERT INTO round_byes (round_id, player_id) VALUES (?, ?)', roundId, id);
		drawn.matches.forEach((m, i) => {
			const matchId = run('INSERT INTO matches (round_id, court) VALUES (?, ?)', roundId, i + 1).id;
			for (const id of m.a) run("INSERT INTO match_players (match_id, side, player_id) VALUES (?, 'A', ?)", matchId, id);
			for (const id of m.b) run("INSERT INTO match_players (match_id, side, player_id) VALUES (?, 'B', ?)", matchId, id);
		});
		return null;
	});
}

/** Deletes the latest round so it can be drawn again, only while none of its matches has a score. */
export function undoLastRound(tournamentId: number): Problem | null {
	return tx((): Problem | null => {
		const last = get<{ id: number }>('SELECT id FROM rounds WHERE tournament_id = ? ORDER BY number DESC LIMIT 1', tournamentId);
		if (!last) return 'noRound';
		if (get('SELECT 1 FROM match_sets s JOIN matches m ON m.id = s.match_id WHERE m.round_id = ?', last.id)) return 'roundHasResults';
		run('DELETE FROM rounds WHERE id = ?', last.id);
		return null;
	});
}

function matchInTournament(matchId: number, tournamentId: number) {
	return !!get('SELECT 1 FROM matches m JOIN rounds r ON r.id = m.round_id WHERE m.id = ? AND r.tournament_id = ?', matchId, tournamentId);
}

/** Replaces a match's result with these sets (already validated against the best-of rule). */
export function setResult(tournamentId: number, matchId: number, sets: SetScore[]): Problem | null {
	if (!matchInTournament(matchId, tournamentId)) return 'matchNotInTournament';
	tx(() => {
		run('DELETE FROM match_sets WHERE match_id = ?', matchId);
		sets.forEach((s, i) => run('INSERT INTO match_sets (match_id, set_no, score_a, score_b) VALUES (?, ?, ?, ?)', matchId, i + 1, s.a, s.b));
		run('UPDATE matches SET scored_at = ? WHERE id = ?', Date.now(), matchId);
	});
	return null;
}

export function clearResult(tournamentId: number, matchId: number) {
	if (!matchInTournament(matchId, tournamentId)) return;
	tx(() => {
		run('DELETE FROM match_sets WHERE match_id = ?', matchId);
		run('UPDATE matches SET scored_at = NULL WHERE id = ?', matchId);
	});
}

/* ---------- club-wide stats ---------- */

export interface CareerRow {
	playerId: number;
	tournaments: number;
	played: number;
	won: number;
	setsWon: number;
	setsLost: number;
	pointsFor: number;
	pointsAgainst: number;
}

/** Totals for every player across all tournaments (scored matches only). */
export function careerStats(): CareerRow[] {
	return all<{ player_id: number; tournaments: number; played: number; won: number; sw: number; sl: number; pf: number; pa: number }>(`
		WITH ms AS (
			SELECT match_id,
				SUM(score_a > score_b) AS sets_a, SUM(score_b > score_a) AS sets_b,
				SUM(score_a) AS points_a, SUM(score_b) AS points_b
			FROM match_sets GROUP BY match_id
		)
		SELECT p.id AS player_id,
			(SELECT COUNT(*) FROM entries e WHERE e.player_id = p.id) AS tournaments,
			COUNT(ms.match_id) AS played,
			COALESCE(SUM(CASE WHEN (mp.side = 'A' AND ms.sets_a > ms.sets_b) OR (mp.side = 'B' AND ms.sets_b > ms.sets_a) THEN 1 ELSE 0 END), 0) AS won,
			COALESCE(SUM(CASE mp.side WHEN 'A' THEN ms.sets_a ELSE ms.sets_b END), 0) AS sw,
			COALESCE(SUM(CASE mp.side WHEN 'A' THEN ms.sets_b ELSE ms.sets_a END), 0) AS sl,
			COALESCE(SUM(CASE mp.side WHEN 'A' THEN ms.points_a ELSE ms.points_b END), 0) AS pf,
			COALESCE(SUM(CASE mp.side WHEN 'A' THEN ms.points_b ELSE ms.points_a END), 0) AS pa
		FROM players p
		LEFT JOIN match_players mp ON mp.player_id = p.id
		LEFT JOIN ms ON ms.match_id = mp.match_id
		GROUP BY p.id
	`).map((r) => ({
		playerId: r.player_id,
		tournaments: r.tournaments,
		played: r.played,
		won: r.won,
		setsWon: r.sw,
		setsLost: r.sl,
		pointsFor: r.pf,
		pointsAgainst: r.pa
	}));
}
