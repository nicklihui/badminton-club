import { count, pairKey, type DrawInput, type DrawnRound } from './history';

const ATTEMPTS = 4000;
const REPEAT_PARTNER_COST = 10;
const REPEAT_OPPONENT_COST = 2;

function shuffle<T>(a: T[]): T[] {
	for (let i = a.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[a[i], a[j]] = [a[j], a[i]];
	}
	return a;
}

/**
 * Random doubles: fill as many courts as possible with four players each.
 * Whoever has played most (then sat out least) sits out first, so byes rotate.
 * Among many random shuffles, keep the one with the fewest repeat partners and opponents.
 */
export function drawRandomDoubles({ active, courts, history: h }: DrawInput): DrawnRound {
	const maxCourts = courts > 0 ? courts : Infinity;
	const nCourts = Math.min(Math.floor(active.length / 4), maxCourts);
	if (nCourts < 1) return { byes: [...active], matches: [] };

	const tie = new Map(active.map((id) => [id, Math.random()]));
	const order = [...active].sort(
		(x, y) =>
			count(h.played, y) - count(h.played, x) ||
			count(h.byes, x) - count(h.byes, y) ||
			tie.get(x)! - tie.get(y)!
	);
	const sitCount = active.length - nCourts * 4;
	const byes = order.slice(0, sitCount);
	const playing = order.slice(sitCount);

	let best = playing;
	let bestCost = Infinity;
	for (let t = 0; t < ATTEMPTS && bestCost > 0; t++) {
		const p = shuffle([...playing]);
		let cost = 0;
		for (let i = 0; i < p.length; i += 4) {
			cost +=
				REPEAT_PARTNER_COST *
				(count(h.partners, pairKey(p[i], p[i + 1])) + count(h.partners, pairKey(p[i + 2], p[i + 3])));
			for (const x of [p[i], p[i + 1]])
				for (const y of [p[i + 2], p[i + 3]]) cost += REPEAT_OPPONENT_COST * count(h.opponents, pairKey(x, y));
		}
		if (cost < bestCost) {
			best = p;
			bestCost = cost;
		}
	}

	const matches = [];
	for (let i = 0; i < best.length; i += 4) matches.push({ a: [best[i], best[i + 1]], b: [best[i + 2], best[i + 3]] });
	return { byes, matches };
}
