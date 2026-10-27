/** "2026-10-27" → "Tue 27 Oct 2026" (en-GB style, no timezone shift). */
export function formatDate(iso: string): string {
	const [y, m, d] = iso.split('-').map(Number);
	return new Date(Date.UTC(y, m - 1, d)).toLocaleDateString('en-GB', {
		weekday: 'short',
		day: 'numeric',
		month: 'short',
		year: 'numeric',
		timeZone: 'UTC'
	});
}
