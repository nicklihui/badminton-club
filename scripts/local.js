// Runs the built site on this computer for a club night: plain http on the local
// network, no proxy, no HTTPS. Phones on the same Wi-Fi open one of the printed addresses.
import { existsSync } from 'node:fs';
import http from 'node:http';
import { networkInterfaces } from 'node:os';
import QRCode from 'qrcode';

// Settings such as CLUB_NAME and PORT from .env (the built server doesn't read it by itself).
if (existsSync('.env')) process.loadEnvFile('.env');

// Without a proxy the adapter would assume https and reject form posts as cross-site,
// so tell it every request arrives over plain http (overwriting anything a client sends).
process.env.PROTOCOL_HEADER = 'x-forwarded-proto';
const { handler } = await import('../build/handler.js');

const port = Number(process.env.PORT) || 3000;

http
	.createServer((req, res) => {
		req.headers['x-forwarded-proto'] = 'http';
		handler(req, res);
	})
	.listen(port, '0.0.0.0', async () => {
		// Same order as the site's QR code page: real adapters before virtual ones (WSL, VPN, VMs).
		const virtual = /vEthernet|WSL|Hyper-V|VirtualBox|VMware|docker|Loopback|Tailscale|ZeroTier|vpn/i;
		const lan = Object.entries(networkInterfaces())
			.flatMap(([name, addrs]) => (addrs ?? []).map((a) => ({ name, ...a })))
			.filter((a) => a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.'))
			.sort((a, b) => Number(virtual.test(a.name)) - Number(virtual.test(b.name)))
			.map((a) => `http://${a.address}:${port}`);
		console.log(`Badminton club site is running.`);
		console.log(`  On this computer:  http://localhost:${port}`);
		for (const url of lan) console.log(`  On phones (Wi-Fi): ${url}`);
		if (lan.length) {
			console.log(`\nScan with a phone on the same Wi-Fi to open ${lan[0]}`);
			console.log(await QRCode.toString(lan[0], { type: 'terminal', small: true }));
			console.log(`To print the code: open http://localhost:${port}/join`);
		}
		console.log('Press Ctrl+C to stop.');
	});
