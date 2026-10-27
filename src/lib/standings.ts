import { isScored, matchResult, type RoundView } from './types';

export interface StandingRow {
	playerId: number;
	played: number;
	won: number;
	lost: number;
	setsWon: number;
	setsLost: number;
	pointsFor: number;
	pointsAgainst: number;
}

/**
 * Tournament standings. Each player is credited with their side's result in every scored match:
 * the match win or loss, the sets their side won and lost, and the rally points of every set.
 */
export function computeStandings(rounds: RoundView[], playerIds: number[]): StandingRow[] {
	const rows = new Map<number, StandingRow>();
	const row = (id: number) => {
		let r = rows.get(id);
		if (!r)
			rows.set(id, (r = { playerId: id, played: 0, won: 0, lost: 0, setsWon: 0, setsLost: 0, pointsFor: 0, pointsAgainst: 0 }));
		return r;
	};
	for (const id of playerIds) row(id);
	for (const round of rounds)
		for (const m of round.matches) {
			if (!isScored(m)) continue;
			const { setsA, setsB, winner } = matchResult(m);
			const pointsA = m.sets.reduce((n, s) => n + s.a, 0);
			const pointsB = m.sets.reduce((n, s) => n + s.b, 0);
			const sides = [
				{ team: m.a, won: winner === 'a', sw: setsA, sl: setsB, pf: pointsA, pa: pointsB },
				{ team: m.b, won: winner === 'b', sw: setsB, sl: setsA, pf: pointsB, pa: pointsA }
			];
			for (const s of sides)
				for (const id of s.team) {
					const r = row(id);
					r.played++;
					if (s.won) r.won++;
					else r.lost++;
					r.setsWon += s.sw;
					r.setsLost += s.sl;
					r.pointsFor += s.pf;
					r.pointsAgainst += s.pa;
				}
		}
	return [...rows.values()];
}

/** Ranking order: match wins, then sets won, then total points scored. */
export function compareRows(a: StandingRow, b: StandingRow): number {
	return b.won - a.won || b.setsWon - a.setsWon || b.pointsFor - a.pointsFor;
}

export interface RankedRow extends StandingRow {
	/** Shared by players level on all three criteria; null until they have played. */
	rank: number | null;
}

export function rankRows(rows: StandingRow[], nameOf: (id: number) => string): RankedRow[] {
	const sorted = [...rows].sort(
		(a, b) =>
			Number(b.played > 0) - Number(a.played > 0) || compareRows(a, b) || nameOf(a.playerId).localeCompare(nameOf(b.playerId))
	);
	return sorted.map((r, i) => {
		if (!r.played) return { ...r, rank: null };
		let first = i;
		while (first > 0 && compareRows(sorted[first - 1], r) === 0) first--;
		return { ...r, rank: first + 1 };
	});
}
