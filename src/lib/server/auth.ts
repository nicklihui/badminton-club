import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { error, redirect } from '@sveltejs/kit';
import { msgs, type Problem } from '$lib/i18n';
import { all, get, run } from './db';

export const SESSION_COOKIE = 'club_session';
export const SESSION_DAYS = 30;

export interface Admin {
	id: number;
	username: string;
}

export function hashPassword(password: string): string {
	const salt = randomBytes(16);
	const hash = scryptSync(password, salt, 64);
	return `scrypt$${salt.toString('hex')}$${hash.toString('hex')}`;
}

function verifyPassword(password: string, stored: string): boolean {
	const [alg, salt, hash] = stored.split('$');
	if (alg !== 'scrypt' || !salt || !hash) return false;
	const expected = Buffer.from(hash, 'hex');
	const actual = scryptSync(password, Buffer.from(salt, 'hex'), expected.length);
	return timingSafeEqual(actual, expected);
}

const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');

export function adminCount(): number {
	return get<{ n: number }>('SELECT COUNT(*) AS n FROM admins')!.n;
}

export function listAdmins() {
	return all<{ id: number; username: string; created_at: number }>(
		'SELECT id, username, created_at FROM admins ORDER BY username'
	);
}

/** Returns what's wrong, or null when the admin was created. */
export function createAdmin(username: string, password: string): Problem | null {
	username = username.trim();
	if (!/^[\w.-]{3,32}$/.test(username)) return 'badUsername';
	if (password.length < 10) return 'shortPassword';
	if (get('SELECT 1 FROM admins WHERE username = ?', username)) return 'usernameTaken';
	run('INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)', username, hashPassword(password), Date.now());
	return null;
}

export function checkLogin(username: string, password: string): Admin | null {
	const row = get<Admin & { password_hash: string }>(
		'SELECT id, username, password_hash FROM admins WHERE username = ?',
		username.trim()
	);
	if (!row) {
		hashPassword(password); // spend the same time as a real check
		return null;
	}
	return verifyPassword(password, row.password_hash) ? { id: row.id, username: row.username } : null;
}

export function changePassword(adminId: number, current: string, next: string): Problem | null {
	const row = get<{ password_hash: string }>('SELECT password_hash FROM admins WHERE id = ?', adminId);
	if (!row || !verifyPassword(current, row.password_hash)) return 'wrongPassword';
	if (next.length < 10) return 'shortNewPassword';
	run('UPDATE admins SET password_hash = ? WHERE id = ?', hashPassword(next), adminId);
	return null;
}

export function createSession(adminId: number): string {
	const token = randomBytes(32).toString('base64url');
	run(
		'INSERT INTO sessions (token_hash, admin_id, expires_at) VALUES (?, ?, ?)',
		sha256(token),
		adminId,
		Date.now() + SESSION_DAYS * 86_400_000
	);
	return token;
}

export function sessionAdmin(token: string): Admin | null {
	run('DELETE FROM sessions WHERE expires_at < ?', Date.now());
	return (
		get<Admin>(
			'SELECT a.id, a.username FROM sessions s JOIN admins a ON a.id = s.admin_id WHERE s.token_hash = ?',
			sha256(token)
		) ?? null
	);
}

export function deleteSession(token: string) {
	run('DELETE FROM sessions WHERE token_hash = ?', sha256(token));
}

/** For form actions: refuse unless an organiser is signed in. */
export function requireAdmin(locals: App.Locals): Admin {
	if (!locals.admin) error(401, msgs(locals.lang).problems.signInRequired);
	return locals.admin;
}

/** For page loads: send visitors to the sign-in page. */
export function requireAdminPage(locals: App.Locals, url: URL): Admin {
	if (!locals.admin) redirect(303, `/login?next=${encodeURIComponent(url.pathname + url.search)}`);
	return locals.admin;
}

// Simple in-memory throttle for sign-in attempts: 10 failures per 15 minutes per address.
const failures = new Map<string, { count: number; until: number }>();

export function loginBlocked(ip: string): boolean {
	const f = failures.get(ip);
	return !!f && f.until > Date.now() && f.count >= 10;
}

export function recordLoginFailure(ip: string) {
	const now = Date.now();
	const f = failures.get(ip);
	if (!f || f.until < now) failures.set(ip, { count: 1, until: now + 15 * 60_000 });
	else f.count++;
}
