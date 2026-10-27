import { error, fail, redirect } from '@sveltejs/kit';
import { formatDate } from '$lib/dates';
import { formats } from '$lib/formats';
import type { Hero } from '$lib/hero';
import { isBestOf, isScored, validateSets, type BestOf, type SetScore } from '$lib/types';
import { requireAdmin } from '$lib/server/auth';
import { int, ints, isoDate, text } from '$lib/server/forms';
import {
	addEntries,
	clearResult,
	deleteTournament,
	drawNextRound,
	findOrCreatePlayers,
	getTournament,
	listEntries,
	listPlayers,
	listRounds,
	parseNames,
	removeEntry,
	setEntryActive,
	setResult,
	setTournamentStatus,
	undoLastRound,
	updateTournament
} from '$lib/server/repo';
import type { Actions, PageServerLoad } from './$types';

/** Reads set1a/set1b, set2a/set2b, … Unplayed sets are left blank and must come last. */
function parseSets(fd: FormData, bestOf: BestOf): SetScore[] | string {
	const sets: SetScore[] = [];
	let blankSeen = false;
	for (let i = 1; i <= bestOf; i++) {
		const rawA = text(fd, `set${i}a`);
		const rawB = text(fd, `set${i}b`);
		if (!rawA && !rawB) {
			blankSeen = true;
			continue;
		}
		if (blankSeen) return `Set ${i} is filled in but an earlier set is empty.`;
		const a = int(fd, `set${i}a`);
		const b = int(fd, `set${i}b`);
		if (a === null || b === null || a > 99 || b > 99) return `Enter both pairs’ points for set ${i} as whole numbers.`;
		sets.push({ a, b });
	}
	return sets;
}

function tournamentOr404(param: string) {
	const id = /^\d+$/.test(param) ? Number(param) : NaN;
	const t = Number.isFinite(id) ? getTournament(id) : undefined;
	if (!t) error(404, 'Tournament not found');
	return t;
}

export const load: PageServerLoad = ({ params, locals }) => {
	const t = tournamentOr404(params.id);
	const entries = listEntries(t.id);
	const rounds = listRounds(t.id);
	const entered = new Set(entries.map((e) => e.playerId));
	const players = listPlayers();
	const allMatches = rounds.flatMap((r) => r.matches);
	const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
	return {
		hero: {
			eyebrow: `${formats[t.format].name} · ${t.bestOf === 1 ? 'one set' : `best of ${t.bestOf} sets`}`,
			title: t.name,
			lead: [
				t.heldOn ? formatDate(t.heldOn) : 'No date',
				plural(rounds.length, 'round'),
				`${entries.filter((e) => e.active).length} playing`,
				`${allMatches.filter(isScored).length} of ${allMatches.length} ${allMatches.length === 1 ? 'match' : 'matches'} scored`
			].join(' · '),
			back: { href: '/', label: 'All tournaments' },
			status: t.status
		} satisfies Hero,
		tournament: t,
		format: formats[t.format],
		entries,
		rounds,
		names: Object.fromEntries(players.map((p) => [p.id, p.name])) as Record<number, string>,
		// club players who could still be added (organisers only)
		available: locals.admin ? players.filter((p) => !p.archived && !entered.has(p.id)) : []
	};
};

export const actions: Actions = {
	settings: async ({ params, request, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id);
		const fd = await request.formData();
		const name = text(fd, 'name').slice(0, 80);
		if (!name) return fail(400, { action: 'settings', message: 'Give the tournament a name.' });
		const bestOf = int(fd, 'best_of');
		updateTournament(t.id, {
			name,
			courts: Math.min(int(fd, 'courts') ?? 0, 40),
			bestOf: isBestOf(bestOf) ? bestOf : t.bestOf,
			heldOn: isoDate(fd, 'held_on')
		});
		return { action: 'settings', done: 'Saved.' };
	},

	status: async ({ params, request, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id);
		setTournamentStatus(t.id, text(await request.formData(), 'status') === 'finished' ? 'finished' : 'open');
	},

	delete: async ({ params, request, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id);
		if (text(await request.formData(), 'confirm') !== t.name)
			return fail(400, { action: 'delete', message: 'Type the tournament name exactly to delete it.' });
		deleteTournament(t.id);
		redirect(303, '/');
	},

	addEntries: async ({ params, request, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id);
		const fd = await request.formData();
		const ids = ints(fd, 'player');
		const newNames = parseNames(text(fd, 'names'));
		if (!ids.length && !newNames.length) return fail(400, { action: 'addEntries', message: 'Tick club players or type new names.' });
		addEntries(t.id, [...ids, ...findOrCreatePlayers(newNames)]);
	},

	setActive: async ({ params, request, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id);
		const fd = await request.formData();
		const playerId = int(fd, 'player');
		if (playerId !== null) setEntryActive(t.id, playerId, text(fd, 'active') === '1');
	},

	removeEntry: async ({ params, request, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id);
		const playerId = int(await request.formData(), 'player');
		const problem = playerId === null ? 'Unknown player.' : removeEntry(t.id, playerId);
		if (problem) return fail(400, { action: 'removeEntry', message: problem });
	},

	draw: async ({ params, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id);
		const problem = drawNextRound(t.id);
		if (problem) return fail(400, { action: 'draw', message: problem });
	},

	undo: async ({ params, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id);
		const problem = undoLastRound(t.id);
		if (problem) return fail(400, { action: 'draw', message: problem });
	},

	score: async ({ params, request, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id);
		const fd = await request.formData();
		const matchId = int(fd, 'match');
		if (matchId === null) return fail(400, { action: 'score', message: 'Unknown match.' });
		const parsed = parseSets(fd, t.bestOf);
		const problem = typeof parsed === 'string' ? parsed : (validateSets(parsed, t.bestOf) ?? setResult(t.id, matchId, parsed));
		if (problem) return fail(400, { action: 'score', matchId, message: problem });
		return { action: 'score', matchId };
	},

	clear: async ({ params, request, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id);
		const matchId = int(await request.formData(), 'match');
		if (matchId !== null) clearResult(t.id, matchId);
	}
};
