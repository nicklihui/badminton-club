import { fail, redirect } from '@sveltejs/kit';
import type { Hero } from '$lib/hero';
import { adminCount, checkLogin, createAdmin, createSession, SESSION_COOKIE, SESSION_DAYS } from '$lib/server/auth';
import { text } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => {
	if (adminCount() > 0) redirect(303, '/login');
	return {
		hero: {
			eyebrow: 'First start',
			title: 'Create the first organiser',
			lead: 'Organisers sign in to create tournaments, draw rounds and enter scores. Everyone else can view results without an account.'
		} satisfies Hero
	};
};

export const actions: Actions = {
	default: async ({ request, cookies, url }) => {
		if (adminCount() > 0) redirect(303, '/login');
		const fd = await request.formData();
		const username = text(fd, 'username');
		const password = String(fd.get('password') ?? '');
		const problem = createAdmin(username, password);
		if (problem) return fail(400, { username, message: problem });

		const admin = checkLogin(username, password)!;
		cookies.set(SESSION_COOKIE, createSession(admin.id), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:', // plain http on a local network must still keep the sign-in
			maxAge: SESSION_DAYS * 86_400
		});
		redirect(303, '/');
	}
};
