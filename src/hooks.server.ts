import type { Handle } from '@sveltejs/kit';
import { isLang, LANG_COOKIE, pickLang } from '$lib/i18n';
import { SESSION_COOKIE, sessionAdmin } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);
	event.locals.admin = token ? sessionAdmin(token) : null;
	// a language picked with the EN/DE switch wins over the browser's preference
	const chosen = event.cookies.get(LANG_COOKIE);
	const lang = isLang(chosen) ? chosen : pickLang(event.request.headers.get('accept-language'));
	event.locals.lang = lang;
	return resolve(event, { transformPageChunk: ({ html }) => html.replace('%lang%', lang) });
};
