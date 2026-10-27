import { fail } from '@sveltejs/kit';
import type { Hero } from '$lib/hero';
import { changePassword, createAdmin, listAdmins, requireAdmin, requireAdminPage } from '$lib/server/auth';
import { text } from '$lib/server/forms';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = ({ locals, url }) => {
	requireAdminPage(locals, url);
	return {
		hero: {
			eyebrow: 'Site access',
			title: 'Organisers',
			lead: 'Organisers can create tournaments, manage players, draw rounds and enter scores.'
		} satisfies Hero,
		admins: listAdmins()
	};
};

export const actions: Actions = {
	addOrganiser: async ({ request, locals }) => {
		requireAdmin(locals);
		const fd = await request.formData();
		const username = text(fd, 'username');
		const problem = createAdmin(username, String(fd.get('password') ?? ''));
		if (problem) return fail(400, { form: 'add', message: problem, username });
		return { form: 'add', done: `${username} can now sign in.` };
	},
	password: async ({ request, locals }) => {
		const admin = requireAdmin(locals);
		const fd = await request.formData();
		const problem = changePassword(admin.id, String(fd.get('current') ?? ''), String(fd.get('next') ?? ''));
		if (problem) return fail(400, { form: 'password', message: problem });
		return { form: 'password', done: 'Password changed.' };
	}
};
