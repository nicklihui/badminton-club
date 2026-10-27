declare global {
	namespace App {
		interface Locals {
			admin: { id: number; username: string } | null;
		}
	}
}

export {};
