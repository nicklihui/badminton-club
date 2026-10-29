import QRCode from 'qrcode';
import type { Hero } from '$lib/hero';
import { msgs } from '$lib/i18n';
import { shareUrls } from '$lib/server/lan';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const m = msgs(locals.lang).join;
	const [main, ...other] = shareUrls(url);
	return {
		hero: { eyebrow: m.eyebrow, title: m.title, lead: m.lead } satisfies Hero,
		main: main && { url: main, svg: await QRCode.toString(main, { type: 'svg', margin: 0, errorCorrectionLevel: 'M' }) },
		other
	};
};
