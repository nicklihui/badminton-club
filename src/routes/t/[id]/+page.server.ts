import { error, fail, redirect } from '@sveltejs/kit';
import { formatDate } from '$lib/dates';
import type { Hero } from '$lib/hero';
import { msgs, type Lang, type Messages } from '$lib/i18n';
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
function parseSets(fd: FormData, bestOf: BestOf, m: Messages['sets']): SetScore[] | string {
	const sets: SetScore[] = [];
	let blankSeen = false;
	for (let i = 1; i <= bestOf; i++) {
		const rawA = text(fd, `set${i}a`);
		const rawB = text(fd, `set${i}b`);
		if (!rawA && !rawB) {
			blankSeen = true;
			continue;
		}
		if (blankSeen) return m.gapBefore(i);
		const a = int(fd, `set${i}a`);
		const b = int(fd, `set${i}b`);
		if (a === null || b === null || a > 99 || b > 99) return m.bothPoints(i);
		sets.push({ a, b });
	}
	return sets;
}

function tournamentOr404(param: string, lang: Lang) {
	const id = /^\d+$/.test(param) ? Number(param) : NaN;
	const t = Number.isFinite(id) ? getTournament(id) : undefined;
	if (!t) error(404, msgs(lang).tournament.notFound);
	return t;
}

export const load: PageServerLoad = ({ params, locals }) => {
	const m = msgs(locals.lang);
	const t = tournamentOr404(params.id, locals.lang);
	const entries = listEntries(t.id);
	const rounds = listRounds(t.id);
	const entered = new Set(entries.map((e) => e.playerId));
	const players = listPlayers();
	const allMatches = rounds.flatMap((r) => r.matches);
	return {
		hero: {
			eyebrow: `${m.formats[t.format].name} · ${m.bestOfText(t.bestOf)}`,
			title: t.name,
			lead: [
				t.heldOn ? formatDate(t.heldOn, locals.lang) : m.noDate,
				m.tournament.rounds(rounds.length),
				m.tournament.nPlaying(entries.filter((e) => e.active).length),
				m.tournament.matchesScored(allMatches.filter(isScored).length, allMatches.length)
			].join(' · '),
			back: { href: '/', label: m.tournament.allTournaments },
			status: t.status
		} satisfies Hero,
		tournament: t,
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
		const t = tournamentOr404(params.id, locals.lang);
		const fd = await request.formData();
		const name = text(fd, 'name').slice(0, 80);
		if (!name) return fail(400, { action: 'settings', message: msgs(locals.lang).problems.tournamentName });
		const bestOf = int(fd, 'best_of');
		updateTournament(t.id, {
			name,
			courts: Math.min(int(fd, 'courts') ?? 0, 40),
			bestOf: isBestOf(bestOf) ? bestOf : t.bestOf,
			heldOn: isoDate(fd, 'held_on')
		});
		return { action: 'settings', done: msgs(locals.lang).tournament.saved };
	},

	status: async ({ params, request, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id, locals.lang);
		setTournamentStatus(t.id, text(await request.formData(), 'status') === 'finished' ? 'finished' : 'open');
	},

	delete: async ({ params, request, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id, locals.lang);
		if (text(await request.formData(), 'confirm') !== t.name)
			return fail(400, { action: 'delete', message: msgs(locals.lang).problems.typeName });
		deleteTournament(t.id);
		redirect(303, '/');
	},

	addEntries: async ({ params, request, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id, locals.lang);
		const fd = await request.formData();
		const ids = ints(fd, 'player');
		const newNames = parseNames(text(fd, 'names'));
		if (!ids.length && !newNames.length) return fail(400, { action: 'addEntries', message: msgs(locals.lang).problems.pickPlayers });
		addEntries(t.id, [...ids, ...findOrCreatePlayers(newNames)]);
	},

	setActive: async ({ params, request, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id, locals.lang);
		const fd = await request.formData();
		const playerId = int(fd, 'player');
		if (playerId !== null) setEntryActive(t.id, playerId, text(fd, 'active') === '1');
	},

	removeEntry: async ({ params, request, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id, locals.lang);
		const playerId = int(await request.formData(), 'player');
		const problem = playerId === null ? 'unknownPlayer' : removeEntry(t.id, playerId);
		if (problem) return fail(400, { action: 'removeEntry', message: msgs(locals.lang).problems[problem] });
	},

	draw: async ({ params, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id, locals.lang);
		const problem = drawNextRound(t.id);
		if (problem) return fail(400, { action: 'draw', message: msgs(locals.lang).problems[problem] });
	},

	undo: async ({ params, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id, locals.lang);
		const problem = undoLastRound(t.id);
		if (problem) return fail(400, { action: 'draw', message: msgs(locals.lang).problems[problem] });
	},

	score: async ({ params, request, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id, locals.lang);
		const fd = await request.formData();
		const m = msgs(locals.lang);
		const matchId = int(fd, 'match');
		if (matchId === null) return fail(400, { action: 'score', message: m.problems.unknownMatch });
		const parsed = parseSets(fd, t.bestOf, m.sets);
		const invalid = typeof parsed === 'string' ? parsed : validateSets(parsed, t.bestOf, m.sets);
		if (invalid) return fail(400, { action: 'score', matchId, message: invalid });
		const problem = setResult(t.id, matchId, parsed as SetScore[]);
		if (problem) return fail(400, { action: 'score', matchId, message: m.problems[problem] });
		return { action: 'score', matchId };
	},

	clear: async ({ params, request, locals }) => {
		requireAdmin(locals);
		const t = tournamentOr404(params.id, locals.lang);
		const matchId = int(await request.formData(), 'match');
		if (matchId !== null) clearResult(t.id, matchId);
	}
};
