import { networkInterfaces } from 'node:os';

// Virtual adapters (WSL, Hyper-V, VPNs, VMs) that phones on the Wi-Fi can't reach.
const VIRTUAL = /vEthernet|WSL|Hyper-V|VirtualBox|VMware|docker|Loopback|Tailscale|ZeroTier|vpn/i;

/** This computer's IPv4 addresses on the local network, the likeliest real one first. */
export function lanAddresses(): string[] {
	return Object.entries(networkInterfaces())
		.flatMap(([name, addrs]) => (addrs ?? []).map((a) => ({ name, ...a })))
		.filter((a) => a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.'))
		.sort((a, b) => Number(VIRTUAL.test(a.name)) - Number(VIRTUAL.test(b.name)))
		.map((a) => a.address);
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

/**
 * Addresses other devices can use to open the site. A visitor who already reached it
 * over the network shares the address they used; on the laptop itself (localhost) the
 * network addresses are offered instead (none when the laptop is offline).
 */
export function shareUrls(url: URL): string[] {
	if (!LOCAL_HOSTS.has(url.hostname)) return [url.origin + '/'];
	const port = url.port ? `:${url.port}` : '';
	return lanAddresses().map((ip) => `${url.protocol}//${ip}${port}/`);
}
