/** Small helpers for reading FormData in actions. */

export const text = (fd: FormData, key: string) => String(fd.get(key) ?? '').trim();

export function int(fd: FormData, key: string): number | null {
	const raw = text(fd, key);
	if (!/^\d{1,9}$/.test(raw)) return null;
	return Number(raw);
}

export function ints(fd: FormData, key: string): number[] {
	return fd
		.getAll(key)
		.map((v) => String(v))
		.filter((v) => /^\d{1,9}$/.test(v))
		.map(Number);
}

/** "2026-10-27" or null. */
export function isoDate(fd: FormData, key: string): string | null {
	const raw = text(fd, key);
	return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : null;
}
