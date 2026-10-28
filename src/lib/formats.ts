/**
 * Tournament formats the club can run. This file is safe to import in the
 * browser; each format's draw logic lives in $lib/server/formats.
 * To add a format: add an entry here, its name and description in $lib/i18n,
 * then a drawer in the server registry.
 */
export const formats = {
	random_doubles: { teamSize: 2 }
} as const;

export type FormatId = keyof typeof formats;

export const isFormat = (s: string): s is FormatId => Object.hasOwn(formats, s);

export const playersPerCourt = (f: FormatId) => formats[f].teamSize * 2;
