/**
 * Tournament formats the club can run. This file is safe to import in the
 * browser; each format's draw logic lives in $lib/server/formats.
 * To add a format: add an entry here, then a drawer in the server registry.
 */
export const formats = {
	random_doubles: {
		name: 'Random-partner doubles',
		description:
			'Every round shuffles all players into new doubles pairs, avoiding repeat partners and opponents where possible. Each player keeps the points their pair scores.',
		teamSize: 2
	}
} as const;

export type FormatId = keyof typeof formats;

export const isFormat = (s: string): s is FormatId => Object.hasOwn(formats, s);

export const playersPerCourt = (f: FormatId) => formats[f].teamSize * 2;
