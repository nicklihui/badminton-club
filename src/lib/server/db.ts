import { DatabaseSync, type SQLInputValue } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { env } from '$env/dynamic/private';
import { migrations } from './migrations';

let conn: DatabaseSync | undefined;

/** Opened lazily so that `vite build` never touches the database. */
function db(): DatabaseSync {
	if (conn) return conn;
	const path = env.DATABASE_PATH || 'data/club.db';
	mkdirSync(dirname(path), { recursive: true });
	conn = new DatabaseSync(path);
	conn.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000;');
	migrate(conn);
	return conn;
}

function migrate(c: DatabaseSync) {
	const { user_version } = c.prepare('PRAGMA user_version').get() as { user_version: number };
	for (let v = user_version; v < migrations.length; v++) {
		c.exec('BEGIN');
		try {
			c.exec(migrations[v]);
			c.exec(`PRAGMA user_version = ${v + 1}`);
			c.exec('COMMIT');
		} catch (e) {
			c.exec('ROLLBACK');
			throw e;
		}
	}
}

export function all<T>(sql: string, ...params: SQLInputValue[]): T[] {
	return db().prepare(sql).all(...params) as T[];
}

export function get<T>(sql: string, ...params: SQLInputValue[]): T | undefined {
	return db().prepare(sql).get(...params) as T | undefined;
}

/** Runs a write and returns the new row id (for inserts) and changed-row count. */
export function run(sql: string, ...params: SQLInputValue[]) {
	const r = db().prepare(sql).run(...params);
	return { id: Number(r.lastInsertRowid), changes: Number(r.changes) };
}

/** Runs fn inside one write transaction; rolls back if it throws. */
export function tx<T>(fn: () => T): T {
	const c = db();
	c.exec('BEGIN IMMEDIATE');
	try {
		const result = fn();
		c.exec('COMMIT');
		return result;
	} catch (e) {
		c.exec('ROLLBACK');
		throw e;
	}
}
