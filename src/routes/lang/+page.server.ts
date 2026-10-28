import { redirect } from '@sveltejs/kit';
import { isLang, LANG_COOKIE } from '$lib/i18n';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = () => redirect(303, '/');

/** Only allow redirects back into this site. */
const safeNext = (next: string) => (next.startsWith('/') && !next.startsWith('//') ? next : '/');

export const actions: Actions = {
	default: async ({ request, cookies }) => {
		const fd = await request.formData();
		const lang = fd.get('lang');
		if (isLang(lang)) cookies.set(LANG_COOKIE, lang, { path: '/', httpOnly: true, sameSite: 'lax', secure: false, maxAge: 365 * 86_400 });
		redirect(303, safeNext(String(fd.get('next') ?? '/')));
	}
};
