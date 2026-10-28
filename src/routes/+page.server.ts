import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Hero } from '$lib/hero';
import { msgs } from '$lib/i18n';
import { isBestOf } from '$lib/types';
import { formats, isFormat } from '$lib/formats';
import { requireAdmin } from '$lib/server/auth';
import { int, isoDate, text } from '$lib/server/forms';
import { createTournament, listTournaments } from '$lib/server/repo';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => ({
	hero: { eyebrow: env.CLUB_NAME || 'SG ULM DONAU/ILLER', title: msgs(locals.lang).home.title } satisfies Hero,
	tournaments: listTournaments(),
	formats: Object.keys(formats) as (keyof typeof formats)[]
});

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireAdmin(locals);
		const m = msgs(locals.lang).problems;
		const fd = await request.formData();
		const name = text(fd, 'name').slice(0, 80);
		const format = text(fd, 'format');
		if (!name) return fail(400, { message: m.tournamentName });
		if (!isFormat(format)) return fail(400, { message: m.chooseFormat });
		const bestOf = int(fd, 'best_of');
		const id = createTournament({
			name,
			format,
			courts: Math.min(int(fd, 'courts') ?? 0, 40),
			bestOf: isBestOf(bestOf) ? bestOf : 3,
			heldOn: isoDate(fd, 'held_on')
		});
		redirect(303, `/t/${id}?tab=lineup`);
	}
};
