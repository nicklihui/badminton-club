/** The crimson page banner. Each page's load returns one as `hero`. */
export interface Hero {
	eyebrow?: string;
	title: string;
	lead?: string;
	back?: { href: string; label: string };
	status?: 'open' | 'finished';
}
