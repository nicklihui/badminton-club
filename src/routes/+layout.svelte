<script lang="ts">
	import '@fontsource/barlow/400.css';
	import '@fontsource/barlow/500.css';
	import '@fontsource/barlow/600.css';
	import '@fontsource/big-shoulders-display/700';
	import '@fontsource/big-shoulders-display/800';
	import '@fontsource/big-shoulders-display/900';
	import '../app.css';
	import { page } from '$app/state';
	import type { Hero } from '$lib/hero';
	import { langs, msgs } from '$lib/i18n';

	let { data, children } = $props();

	const m = $derived(msgs(data.lang));
	const hero = $derived(page.data.hero as Hero | undefined);
	const nav = $derived([
		{ href: '/', label: m.nav.tournaments },
		{ href: '/players', label: m.nav.players },
		{ href: '/join', label: m.nav.join }
	]);
	const current = (href: string) =>
		href === '/' ? page.url.pathname === '/' || page.url.pathname.startsWith('/t/') : page.url.pathname.startsWith(href);
</script>

<svelte:head>
	<title>{hero ? `${hero.title} · ${data.clubName}` : data.clubName}</title>
</svelte:head>

<div class="band">
	<div class="art" aria-hidden="true">
		<svg viewBox="0 0 1200 420" preserveAspectRatio="xMidYMid slice">
			<!-- rough navy brush strokes, kept to the edges so titles stay clear -->
			<path d="M40 430 L118 300 L104 288 L170 190 L214 112 L268 58 L312 44 L296 92 L252 150 L276 158 L214 262 L168 334 L112 430 Z" />
			<path d="M150 120 L196 64 L238 30 L262 34 L232 78 L196 128 L170 150 Z" opacity=".85" />
			<path d="M936 352 L1004 246 L988 232 L1066 120 L1118 52 L1160 40 L1150 76 L1100 148 L1120 160 L1050 268 L992 362 Z" />
			<path d="M1040 430 L1112 316 L1172 222 L1212 196 L1212 262 L1160 334 L1102 430 Z" />
			<path d="M330 430 L372 372 L420 330 L446 330 L414 376 L384 430 Z" opacity=".9" />
			<path d="M812 430 L848 368 L900 310 L924 318 L886 376 L862 430 Z" opacity=".9" />
		</svg>
		<span class="dots d1"></span>
		<span class="dots d2"></span>
	</div>

	<header class="container bar">
		<a class="brand" href="/">
			<img src="/favicon.svg" alt="" width="30" height="30" />
			<span>{data.clubName}</span>
		</a>
		<nav>
			{#each nav as item (item.href)}
				<a href={item.href} aria-current={current(item.href) ? 'page' : undefined}>{item.label}</a>
			{/each}
			{#if data.admin}
				<a href="/admin" aria-current={current('/admin') ? 'page' : undefined}>{m.nav.organisers}</a>
				<form method="POST" action="/logout">
					<button class="signout">{m.nav.signOut}</button>
				</form>
			{:else if data.needsSetup}
				<a href="/setup">{m.nav.setUp}</a>
			{:else}
				<a href="/login" aria-current={current('/login') ? 'page' : undefined}>{m.nav.signIn}</a>
			{/if}
			<form method="POST" action="/lang" class="lang" aria-label={m.nav.language}>
				<input type="hidden" name="next" value={page.url.pathname + page.url.search} />
				{#each langs as l (l)}
					<button name="lang" value={l} aria-pressed={l === data.lang} lang={l}>{l.toUpperCase()}</button>
				{/each}
			</form>
		</nav>
	</header>

	{#if hero}
		<section class="container hero">
			{#if hero.back}<a class="back" href={hero.back.href}>← {hero.back.label}</a>{/if}
			{#if hero.eyebrow}<div class="kicker">{hero.eyebrow}</div>{/if}
			<h1><span class="plate">{hero.title}</span></h1>
			{#if hero.lead || hero.status}
				<p class="lead">
					{#if hero.lead}<span>{hero.lead}</span>{/if}
					{#if hero.status}<span class="status">{m.status[hero.status]}</span>{/if}
				</p>
			{/if}
		</section>
	{/if}
</div>

<main class="container page">
	{@render children()}
</main>

<footer class="foot">
	<div class="container">
		<span class="foot-name">{data.clubName}</span>
		{#if data.admin}<span> · {m.signedInAs(data.admin.username)}</span>{/if}
	</div>
</footer>

<style>
	.band {
		position: relative;
		background: var(--crimson);
		color: var(--on-dark);
		overflow: hidden;
		isolation: isolate;
	}
	.art {
		position: absolute;
		inset: 0;
		z-index: -1;
		pointer-events: none;
	}
	.art svg {
		width: 100%;
		height: 100%;
		fill: var(--navy);
	}
	.dots {
		position: absolute;
		background-image: radial-gradient(var(--navy) 1.7px, transparent 2px);
		background-size: 11px 11px;
		mask-image: radial-gradient(closest-side, #000 20%, transparent);
		-webkit-mask-image: radial-gradient(closest-side, #000 20%, transparent);
	}
	.d1 {
		width: 380px;
		height: 180px;
		right: 8%;
		top: -20px;
		transform: rotate(-14deg);
	}
	.d2 {
		width: 340px;
		height: 160px;
		left: -60px;
		bottom: -30px;
		transform: rotate(-14deg);
	}

	.bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		padding-block: 14px;
	}
	.brand {
		display: flex;
		align-items: center;
		gap: 10px;
		text-decoration: none;
		color: var(--on-dark);
		font-family: var(--display);
		font-weight: 800;
		font-size: 26px;
		text-transform: uppercase;
		letter-spacing: 0.02em;
	}
	nav {
		display: flex;
		align-items: center;
		gap: 2px;
		flex-wrap: wrap;
	}
	nav a,
	.signout {
		padding: 6px 10px;
		color: rgb(255 255 255 / 0.78);
		text-decoration: none;
		font-weight: 600;
		font-size: 13px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		border: 0;
		background: none;
		cursor: pointer;
		border-bottom: 2px solid transparent;
	}
	nav a:hover,
	.signout:hover {
		color: var(--on-dark);
	}
	nav a[aria-current='page'] {
		color: var(--on-dark);
		border-bottom-color: var(--on-dark);
	}
	.lang {
		display: flex;
		margin-left: 8px;
		border: 1px solid rgb(255 255 255 / 0.5);
	}
	.lang button {
		padding: 4px 8px;
		border: 0;
		background: none;
		color: rgb(255 255 255 / 0.78);
		font: inherit;
		font-weight: 600;
		font-size: 12px;
		letter-spacing: 0.1em;
		cursor: pointer;
	}
	.lang button:hover {
		color: var(--on-dark);
	}
	.lang button[aria-pressed='true'] {
		background: var(--on-dark);
		color: var(--navy);
	}
	nav :focus-visible,
	.brand:focus-visible,
	.back:focus-visible {
		outline-color: var(--on-dark);
	}

	.hero {
		display: grid;
		justify-items: center;
		text-align: center;
		gap: 14px;
		padding-block: 28px 52px;
	}
	.back {
		color: rgb(255 255 255 / 0.8);
		text-decoration: none;
		font-size: 14px;
	}
	.back:hover {
		color: var(--on-dark);
	}
	.kicker {
		font-size: 14px;
		font-weight: 500;
		letter-spacing: 0.34em;
		text-transform: uppercase;
		color: rgb(255 255 255 / 0.88);
	}
	h1 {
		max-width: 100%;
	}
	h1 .plate {
		padding: 0.1em 0.45em 0.04em;
		overflow-wrap: anywhere;
	}
	.lead {
		display: flex;
		gap: 10px;
		flex-wrap: wrap;
		justify-content: center;
		align-items: center;
		font-weight: 600;
		font-variant-numeric: tabular-nums;
		max-width: 60ch;
	}
	.status {
		font-size: 12px;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		border: 1px solid currentColor;
		padding: 1px 8px;
	}

	.page {
		padding-block: 32px 64px;
		flex: 1;
		width: 100%;
	}
	.foot {
		background: var(--navy);
		color: rgb(255 255 255 / 0.7);
		font-size: 14px;
		padding-block: 18px;
	}
	.foot-name {
		font-family: var(--display);
		font-weight: 800;
		font-size: 18px;
		text-transform: uppercase;
		color: var(--on-dark);
	}
</style>
