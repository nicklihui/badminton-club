import { fail, redirect } from '@sveltejs/kit';
import type { Hero } from '$lib/hero';
import { msgs } from '$lib/i18n';
import { adminCount, checkLogin, createAdmin, createSession, SESSION_COOKIE, SESSION_DAYS } from '$lib/server/auth';
import { text } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals }) => {
	if (adminCount() > 0) redirect(303, '/login');
	const m = msgs(locals.lang).setup;
	return { hero: { eyebrow: m.eyebrow, title: m.title, lead: m.lead } satisfies Hero };
};

export const actions: Actions = {
	default: async ({ request, cookies, url, locals }) => {
		if (adminCount() > 0) redirect(303, '/login');
		const fd = await request.formData();
		const username = text(fd, 'username');
		const password = String(fd.get('password') ?? '');
		const problem = createAdmin(username, password);
		if (problem) return fail(400, { username, message: msgs(locals.lang).problems[problem] });

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
