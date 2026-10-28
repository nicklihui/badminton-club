import { fail } from '@sveltejs/kit';
import type { Hero } from '$lib/hero';
import { msgs } from '$lib/i18n';
import { requireAdmin } from '$lib/server/auth';
import { int, text } from '$lib/server/forms';
import { careerStats, findOrCreatePlayers, listPlayers, parseNames, renamePlayer, setPlayerArchived } from '$lib/server/repo';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	const m = msgs(locals.lang).players;
	const stats = new Map(careerStats().map((s) => [s.playerId, s]));
	return {
		hero: { eyebrow: m.eyebrow, title: m.title, lead: m.lead } satisfies Hero,
		players: listPlayers().map((p) => ({
			...p,
			stats: stats.get(p.id) ?? { playerId: p.id, tournaments: 0, played: 0, won: 0, setsWon: 0, setsLost: 0, pointsFor: 0, pointsAgainst: 0 }
		}))
	};
};

export const actions: Actions = {
	add: async ({ request, locals }) => {
		requireAdmin(locals);
		const names = parseNames(text(await request.formData(), 'names'));
		if (!names.length) return fail(400, { message: msgs(locals.lang).problems.enterNames, id: null });
		findOrCreatePlayers(names);
	},
	rename: async ({ request, locals }) => {
		requireAdmin(locals);
		const m = msgs(locals.lang).problems;
		const fd = await request.formData();
		const id = int(fd, 'id');
		if (id === null) return fail(400, { message: m.unknownPlayer, id: null });
		const problem = renamePlayer(id, text(fd, 'name'));
		if (problem) return fail(400, { message: m[problem], id });
	},
	archive: async ({ request, locals }) => {
		requireAdmin(locals);
		const fd = await request.formData();
		const id = int(fd, 'id');
		if (id !== null) setPlayerArchived(id, text(fd, 'archived') === '1');
	}
};
