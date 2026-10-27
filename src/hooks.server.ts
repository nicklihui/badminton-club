import type { Handle } from '@sveltejs/kit';
import { SESSION_COOKIE, sessionAdmin } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	const token = event.cookies.get(SESSION_COOKIE);
	event.locals.admin = token ? sessionAdmin(token) : null;
	return resolve(event);
};
