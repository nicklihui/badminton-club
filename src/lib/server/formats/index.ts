import type { FormatId } from '$lib/formats';
import type { Drawer } from './history';
import { drawRandomDoubles } from './random-doubles';

export { buildHistory } from './history';

/** Draw logic for each format in $lib/formats. */
export const drawers: Record<FormatId, Drawer> = {
	random_doubles: drawRandomDoubles
};
