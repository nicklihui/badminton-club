import { fail } from '@sveltejs/kit';
import type { Hero } from '$lib/hero';
import { msgs } from '$lib/i18n';
import { changePassword, createAdmin, listAdmins, requireAdmin, requireAdminPage } from '$lib/server/auth';
import { text } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	requireAdminPage(locals, url);
	const m = msgs(locals.lang).admin;
	return {
		hero: { eyebrow: m.eyebrow, title: m.title, lead: m.lead } satisfies Hero,
		admins: listAdmins()
	};
};

export const actions: Actions = {
	addOrganiser: async ({ request, locals }) => {
		requireAdmin(locals);
		const m = msgs(locals.lang);
		const fd = await request.formData();
		const username = text(fd, 'username');
		const problem = createAdmin(username, String(fd.get('password') ?? ''));
		if (problem) return fail(400, { form: 'add', message: m.problems[problem], username });
		return { form: 'add', done: m.admin.canSignIn(username) };
	},
	password: async ({ request, locals }) => {
		const admin = requireAdmin(locals);
		const m = msgs(locals.lang);
		const fd = await request.formData();
		const problem = changePassword(admin.id, String(fd.get('current') ?? ''), String(fd.get('next') ?? ''));
		if (problem) return fail(400, { form: 'password', message: m.problems[problem] });
		return { form: 'password', done: m.admin.changed };
	}
};
