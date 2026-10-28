import { env } from '$env/dynamic/private';
import { fail, redirect } from '@sveltejs/kit';
import type { Hero } from '$lib/hero';
import { isBestOf } from '$lib/types';
import { formats, isFormat } from '$lib/formats';
import { requireAdmin } from '$lib/server/auth';
import { int, isoDate, text } from '$lib/server/forms';
import { createTournament, listTournaments } from '$lib/server/repo';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => ({
	hero: { eyebrow: env.CLUB_NAME || 'SG ULM DONAU/ILLER', title: 'Tournaments' } satisfies Hero,
	tournaments: listTournaments(),
	formats: Object.entries(formats).map(([id, f]) => ({ id, name: f.name, description: f.description }))
});

export const actions: Actions = {
	create: async ({ request, locals }) => {
		requireAdmin(locals);
		const fd = await request.formData();
		const name = text(fd, 'name').slice(0, 80);
		const format = text(fd, 'format');
		if (!name) return fail(400, { message: 'Give the tournament a name.' });
		if (!isFormat(format)) return fail(400, { message: 'Choose a format.' });
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
