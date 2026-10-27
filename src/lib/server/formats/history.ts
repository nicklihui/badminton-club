import type { RoundView } from '$lib/types';

/** What has happened so far in a tournament, as the draw sees it. */
export interface History {
	played: Map<number, number>;
	byes: Map<number, number>;
	partners: Map<string, number>;
	opponents: Map<string, number>;
}

export interface DrawInput {
	/** Players available for this round. */
	active: number[];
	/** Courts available; 0 means as many as the players fill. */
	courts: number;
	history: History;
}

export interface DrawnRound {
	byes: number[];
	matches: { a: number[]; b: number[] }[];
}

export type Drawer = (input: DrawInput) => DrawnRound;

export const pairKey = (x: number, y: number) => (x < y ? `${x}|${y}` : `${y}|${x}`);

export const count = <K>(m: Map<K, number>, k: K) => m.get(k) ?? 0;

export function buildHistory(rounds: RoundView[]): History {
	const h: History = { played: new Map(), byes: new Map(), partners: new Map(), opponents: new Map() };
	const inc = <K>(m: Map<K, number>, k: K) => m.set(k, (m.get(k) ?? 0) + 1);
	for (const r of rounds) {
		for (const id of r.byes) inc(h.byes, id);
		for (const m of r.matches) {
			for (const id of [...m.a, ...m.b]) inc(h.played, id);
			for (const team of [m.a, m.b])
				for (let i = 0; i < team.length; i++)
					for (let j = i + 1; j < team.length; j++) inc(h.partners, pairKey(team[i], team[j]));
			for (const x of m.a) for (const y of m.b) inc(h.opponents, pairKey(x, y));
		}
	}
	return h;
}
