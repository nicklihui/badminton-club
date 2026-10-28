import { env } from '$env/dynamic/private';
import { adminCount } from '$lib/server/auth';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals }) => ({
	admin: locals.admin,
	clubName: env.CLUB_NAME || 'SG ULM DONAU/ILLER',
	needsSetup: adminCount() === 0
});
