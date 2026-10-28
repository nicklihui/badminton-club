<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import MatchCard from '$lib/components/MatchCard.svelte';
	import StandingsTable from '$lib/components/StandingsTable.svelte';
	import { playersPerCourt } from '$lib/formats';
	import { msgs } from '$lib/i18n';
	import { bestOfOptions, isScored } from '$lib/types';

	let { data, form } = $props();

	const m = $derived(msgs(data.lang));
	const tm = $derived(m.tournament);

	const tabs = ['rounds', 'standings', 'lineup'] as const;
	type Tab = (typeof tabs)[number];
	const tab = $derived.by((): Tab => {
		const t = page.url.searchParams.get('tab');
		if (t === 'players') return 'lineup'; // links from before the tab was renamed
		return tabs.includes(t as Tab) ? (t as Tab) : 'rounds';
	});

	const t = $derived(data.tournament);
	const admin = $derived(!!data.admin);
	const isOpen = $derived(t.status === 'open');
	const active = $derived(data.entries.filter((e) => e.active));
	const perCourt = $derived(playersPerCourt(t.format));
	const nCourts = $derived(Math.min(Math.floor(active.length / perCourt), t.courts > 0 ? t.courts : Infinity));
	const sitting = $derived(active.length - nCourts * perCourt);
	const latest = $derived(data.rounds.at(-1));
	const unscoredInLatest = $derived(latest ? latest.matches.filter((m) => !isScored(m)).length : 0);
	const nextNumber = $derived((latest?.number ?? 0) + 1);
	const name = (id: number) => data.names[id] ?? m.removedPlayer;
	const today = new Date().toISOString().slice(0, 10);

	// Keep the page current while people enter scores on other phones.
	$effect(() => {
		const timer = setInterval(() => {
			if (document.visibilityState !== 'visible') return;
			const el = document.activeElement;
			if (el && ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)) return;
			invalidateAll();
		}, 20_000);
		return () => clearInterval(timer);
	});

	function confirmDraw(e: MouseEvent) {
		if (unscoredInLatest && !confirm(tm.drawAnyway(latest!.number, unscoredInLatest, nextNumber)))
			e.preventDefault();
	}
	const pickAll = (checked: boolean) => (e: MouseEvent) => {
		const boxes = (e.currentTarget as HTMLElement).closest('fieldset')!.querySelectorAll<HTMLInputElement>('input[name="player"]');
		for (const box of boxes) box.checked = checked;
	};
	const ask = (message: string) => (e: MouseEvent) => {
		if (!confirm(message)) e.preventDefault();
	};
</script>

<div class="stack">
	<nav class="tabs" aria-label={tm.sections}>
		<a href="?tab=rounds" data-sveltekit-noscroll aria-current={tab === 'rounds' ? 'page' : undefined}>{tm.tabRounds}<span class="count">{data.rounds.length || ''}</span></a>
		<a href="?tab=standings" data-sveltekit-noscroll aria-current={tab === 'standings' ? 'page' : undefined}>{tm.tabStandings}</a>
		<a href="?tab=lineup" data-sveltekit-noscroll aria-current={tab === 'lineup' ? 'page' : undefined}>{tm.tabLineup}<span class="count">{data.entries.length || ''}</span></a>
	</nav>

	{#if tab === 'rounds'}
		<section class="stack">
			{#if admin && isOpen}
				<div class="panel drawbar">
					<div class="info">
						<span class="big">{tm.round(nextNumber)}</span>
						<span class="muted small num">
							{#if active.length < perCourt}
								{tm.needPlayers(perCourt, active.length)}
							{:else}
								{tm.drawSummary(active.length, nCourts, sitting)}
							{/if}
						</span>
						<span class="muted small">
							{tm.matches}: {m.bestOfText(t.bestOf)} ·
							<a href="?tab=lineup#settings">{tm.change}</a>
						</span>
					</div>
					<div class="actions">
						{#if latest && latest.matches.every((x) => !isScored(x))}
							<form method="POST" action="?/undo" use:enhance>
								<button class="btn link" onclick={ask(tm.redrawAsk(latest.number))}>{tm.redraw(latest.number)}</button>
							</form>
						{/if}
						<form method="POST" action="?/draw" use:enhance>
							<button class="btn primary" disabled={active.length < perCourt} onclick={confirmDraw}>{tm.draw(nextNumber)}</button>
						</form>
					</div>
					{#if form?.action === 'draw' && form?.message}<p class="error full">{form.message}</p>{/if}
				</div>
			{/if}

			{#if !data.rounds.length}
				<div class="empty">
					<strong>{tm.noRoundsTitle}</strong>
					{tm.noRounds}
					{#if admin && data.entries.length < perCourt}<a class="btn" href="?tab=lineup">{tm.addPlayers}</a>{/if}
				</div>
			{/if}

			{#each data.rounds.toReversed() as r (r.id)}
				<section class="round">
					<div class="round-head">
						<h2><span class="plate">{tm.round(r.number)}</span></h2>
						<span class="muted small num">{tm.scoredOf(r.matches.filter(isScored).length, r.matches.length)}</span>
					</div>
					{#if r.byes.length}
						<div class="sitting muted small">{tm.sittingOut} {#each r.byes as id (id)}<span class="chip">{name(id)}</span>{/each}</div>
					{/if}
					<div class="matches">
						{#each r.matches as m (m.id)}
							<MatchCard match={m} names={data.names} {admin} bestOf={t.bestOf} error={form?.action === 'score' && form?.matchId === m.id ? form?.message : undefined} />
						{/each}
					</div>
				</section>
			{/each}
		</section>
	{:else if tab === 'standings'}
		<section class="stack">
			<StandingsTable rounds={data.rounds} playerIds={data.entries.map((e) => e.playerId)} names={data.names} />
		</section>
	{:else}
		<section class="stack">
			{#if admin}
				<form method="POST" action="?/addEntries" class="panel stack" use:enhance>
					<h3>{tm.addPlayers}</h3>
					{#if data.available.length}
						<fieldset class="pick">
							<legend class="hint">{tm.clubPlayers}</legend>
							{#if data.available.length > 1}
								<div class="pick-all">
									<button type="button" class="btn link" onclick={pickAll(true)}>{tm.selectAll}</button>
									<button type="button" class="btn link" onclick={pickAll(false)}>{tm.clear}</button>
								</div>
							{/if}
							{#each data.available as p (p.id)}
								<label class="pick-item"><input type="checkbox" name="player" value={p.id} /> {p.name}</label>
							{/each}
						</fieldset>
					{/if}
					<label class="field"
						><span>{tm.newPlayers}</span><textarea name="names" rows="2" placeholder={tm.namesPlaceholder}></textarea></label
					>
					<span class="hint">{tm.namesHint}</span>
					{#if form?.action === 'addEntries' && form?.message}<p class="error">{form.message}</p>{/if}
					<div><button class="btn primary">{tm.addToTournament}</button></div>
				</form>
			{/if}

			{#if !data.entries.length}
				<div class="empty"><strong>{tm.noPlayersTitle}</strong>{admin ? tm.noPlayersAdmin : tm.noPlayersViewer}</div>
			{:else}
				<div class="plist">
					{#each [...data.entries].sort((a, b) => Number(b.active) - Number(a.active)) as e (e.playerId)}
						{@const played = data.rounds.reduce((n, r) => n + r.matches.filter((m) => m.a.includes(e.playerId) || m.b.includes(e.playerId)).length, 0)}
						{@const byes = data.rounds.filter((r) => r.byes.includes(e.playerId)).length}
						<div class="prow" class:off={!e.active}>
							<span class="pname">{e.name}</span>
							<span class="muted small num">{tm.playedCount(played, byes)}</span>
							{#if admin}
								<form method="POST" action="?/setActive" use:enhance>
									<input type="hidden" name="player" value={e.playerId} />
									<input type="hidden" name="active" value={e.active ? '0' : '1'} />
									<button class="btn sm" class:primary={e.active} aria-pressed={e.active}>{e.active ? tm.active : tm.inactive}</button>
								</form>
								{#if !played && !byes}
									<form method="POST" action="?/removeEntry" use:enhance>
										<input type="hidden" name="player" value={e.playerId} />
										<button class="btn link">{tm.remove}</button>
									</form>
								{/if}
							{:else if !e.active}
								<span class="muted small">{tm.left}</span>
							{/if}
						</div>
					{/each}
				</div>
				{#if form?.action === 'removeEntry' && form?.message}<p class="error">{form.message}</p>{/if}
				{#if admin}<p class="hint">{tm.activeHint}</p>{/if}
			{/if}

			{#if admin}
				<form id="settings" method="POST" action="?/settings" class="panel stack" use:enhance={() => async ({ update }) => update({ reset: false })}>
					<h3>{tm.settings}</h3>
					<div class="form-grid">
						<label class="field"><span>{m.field.name}</span><input name="name" required maxlength="80" value={t.name} /></label>
						<label class="field"><span>{m.field.date}</span><input name="held_on" type="date" value={t.heldOn ?? today} /></label>
						<label class="field">
							<span>{m.field.courts}</span>
							<select name="courts" value={String(t.courts)}>
								<option value="0">{m.field.asManyAsNeeded}</option>
								{#each Array.from({ length: 12 }, (_, i) => i + 1) as c (c)}<option value={String(c)}>{c}</option>{/each}
							</select>
						</label>
						<label class="field">
							<span>{m.field.setsPerMatch}</span>
							<select name="best_of" value={String(t.bestOf)}>
								{#each bestOfOptions as n (n)}<option value={String(n)}>{m.bestOf(n)}</option>{/each}
							</select>
						</label>
					</div>
					<p class="hint">{tm.settingsHint}</p>
					{#if form?.action === 'settings' && form?.message}<p class="error">{form.message}</p>{/if}
					{#if form?.action === 'settings' && form?.done}<p class="hint">{form.done}</p>{/if}
					<div><button class="btn">{tm.saveSettings}</button></div>
				</form>

				<div class="panel stack">
					<h3>{isOpen ? tm.finishTitle : tm.reopenTitle}</h3>
					<p class="hint">{isOpen ? tm.finishHint : tm.reopenHint}</p>
					<form method="POST" action="?/status" use:enhance>
						<input type="hidden" name="status" value={isOpen ? 'finished' : 'open'} />
						<button class="btn">{isOpen ? tm.markFinished : tm.reopen}</button>
					</form>
				</div>

				<form method="POST" action="?/delete" class="panel stack danger-zone">
					<h3>{tm.deleteTitle}</h3>
					<p class="hint">{tm.deleteHint}</p>
					<label class="field"><span>{tm.deleteConfirm(t.name)}</span><input name="confirm" autocomplete="off" /></label>
					{#if form?.action === 'delete' && form?.message}<p class="error">{form.message}</p>{/if}
					<div><button class="btn danger">{tm.deleteTitle}</button></div>
				</form>
			{/if}
		</section>
	{/if}
</div>

<style>
	.drawbar {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}
	.info {
		display: grid;
		gap: 2px;
		min-width: 0;
	}
	.big {
		font-family: var(--display);
		font-size: 30px;
		font-weight: 800;
		text-transform: uppercase;
		line-height: 1;
	}
	.actions {
		display: flex;
		gap: 8px;
		align-items: center;
		flex-wrap: wrap;
	}
	.full {
		flex-basis: 100%;
	}
	.round {
		display: grid;
		gap: 12px;
	}
	.round-head {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 10px;
		flex-wrap: wrap;
	}
	.sitting {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
		align-items: center;
	}
	.sitting .chip {
		color: var(--ink);
	}
	.matches {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(min(300px, 100%), 1fr));
		gap: 12px;
	}
	.pick {
		border: 0;
		padding: 0;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.pick legend {
		margin-bottom: 6px;
	}
	.pick-all {
		flex-basis: 100%;
		display: flex;
		gap: 16px;
	}
	.pick-item {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		border: 1px solid var(--line);
		border-radius: var(--radius);
		padding: 4px 12px 4px 8px;
		cursor: pointer;
		font-size: 15px;
	}
	.pick-item:has(input:checked) {
		border-color: var(--accent-text);
		background: var(--tint);
	}
	.pick-item input {
		accent-color: var(--accent);
	}
	.plist {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		overflow: hidden;
	}
	.prow {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 14px;
		border-bottom: 1px solid var(--line);
		flex-wrap: wrap;
	}
	.prow:last-child {
		border-bottom: 0;
	}
	.pname {
		flex: 1 1 140px;
		min-width: 0;
		font-weight: 600;
		overflow-wrap: anywhere;
	}
	.prow.off .pname {
		color: var(--muted);
		font-weight: 500;
	}
	.danger-zone h3 {
		color: var(--warn);
	}
</style>
