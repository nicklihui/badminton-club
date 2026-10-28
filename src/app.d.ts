import type { Lang } from '$lib/i18n';

declare global {
	namespace App {
		interface Locals {
			admin: { id: number; username: string } | null;
			lang: Lang;
		}
		interface PageData {
			lang: Lang;
		}
	}
}

export {};
