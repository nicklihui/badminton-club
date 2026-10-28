import { msgs, type Lang } from './i18n';

/** "2026-10-27" → "Tue 27 Oct 2026" / "Di., 27. Okt. 2026" (no timezone shift). */
export function formatDate(iso: string, lang: Lang): string {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString(msgs(lang).locale, {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC'
	});
}
