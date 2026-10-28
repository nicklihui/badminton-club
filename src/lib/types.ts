import type { FormatId } from './formats';
import type { Messages } from './i18n';

export type BestOf = 1 | 3 | 5;
export const bestOfOptions: BestOf[] = [1, 3, 5];
export const isBestOf = (n: number | null): n is BestOf => n === 1 || n === 3 || n === 5;
/** Sets a side must win to take the match. */
export const setsToWin = (bestOf: BestOf) => Math.ceil(bestOf / 2);

export interface Tournament {
	id: number;
	name: string;
	format: FormatId;
	status: 'open' | 'finished';
	courts: number;
	bestOf: BestOf;
	heldOn: string | null;
	createdAt: number;
}

export interface Entry {
	playerId: number;
	name: string;
	active: boolean;
}

/** One set's real points, side A first. */
export interface SetScore {
	a: number;
	b: number;
}

export interface MatchView {
	id: number;
	court: number;
	a: number[];
	b: number[];
	/** Empty until the result is entered. */
	sets: SetScore[];
}

export interface RoundView {
	id: number;
	number: number;
	byes: number[];
	matches: MatchView[];
}

export const isScored = (m: MatchView) => m.sets.length > 0;

/** Sets won by each side, and the winning side once the match is scored. */
export function matchResult(m: MatchView) {
	const setsA = m.sets.filter((s) => s.a > s.b).length;
	const setsB = m.sets.length - setsA;
	return { setsA, setsB, winner: !isScored(m) ? null : setsA > setsB ? ('a' as const) : ('b' as const) };
}

/**
 * Checks a match's sets against the best-of rule. Returns an error message, or null when valid:
 * every set decided, the match decided, and no set played after it was decided.
 */
export function validateSets(sets: SetScore[], bestOf: BestOf, m: Messages['sets']): string | null {
	const need = setsToWin(bestOf);
	if (!sets.length) return m.none;
	if (sets.length > bestOf) return m.tooMany(bestOf);
	let wa = 0;
	let wb = 0;
	for (const [i, s] of sets.entries()) {
		if (wa === need || wb === need) return m.alreadyDecided(i + 1);
		if (s.a === s.b) return m.level(i + 1);
		if (s.a > s.b) wa++;
		else wb++;
	}
	if (wa < need && wb < need) return bestOf === 1 ? m.enterSet : m.needMore(need, need - Math.max(wa, wb));
	return null;
}
