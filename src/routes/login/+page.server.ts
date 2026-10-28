import { fail, redirect } from '@sveltejs/kit';
import type { Hero } from '$lib/hero';
import { msgs } from '$lib/i18n';
import {
	adminCount,
	checkLogin,
	createSession,
	loginBlocked,
	recordLoginFailure,
	SESSION_COOKIE,
	SESSION_DAYS
} from '$lib/server/auth';
import { text } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

/** Only allow redirects back into this site. */
const safeNext = (next: string | null) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/');

export const load: PageServerLoad = ({ locals, url }) => {
	if (adminCount() === 0) redirect(303, '/setup');
	if (locals.admin) redirect(303, safeNext(url.searchParams.get('next')));
	const m = msgs(locals.lang).login;
	return { hero: { eyebrow: m.eyebrow, title: m.title, lead: m.lead } satisfies Hero };
};

export const actions: Actions = {
	default: async ({ request, cookies, url, locals, getClientAddress }) => {
		const m = msgs(locals.lang).login;
		const ip = getClientAddress();
		const fd = await request.formData();
		const username = text(fd, 'username');
		if (loginBlocked(ip)) return fail(429, { username, message: m.tooMany });

		const admin = checkLogin(username, String(fd.get('password') ?? ''));
		if (!admin) {
			recordLoginFailure(ip);
			return fail(400, { username, message: m.mismatch });
		}
		cookies.set(SESSION_COOKIE, createSession(admin.id), {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: url.protocol === 'https:', // plain http on a local network must still keep the sign-in
			maxAge: SESSION_DAYS * 86_400
		});
		redirect(303, safeNext(url.searchParams.get('next')));
	}
};
