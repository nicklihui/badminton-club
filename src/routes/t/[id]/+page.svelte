<script lang="ts">
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';
	import MatchCard from '$lib/components/MatchCard.svelte';
	import StandingsTable from '$lib/components/StandingsTable.svelte';
	import { playersPerCourt } from '$lib/formats';
	import { bestOfLabel, bestOfOptions, isScored } from '$lib/types';

	let { data, form } = $props();

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
	const name = (id: number) => data.names[id] ?? 'Removed player';
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
		if (unscoredInLatest && !confirm(`Round ${latest!.number} still has ${unscoredInLatest} match${unscoredInLatest > 1 ? 'es' : ''} without a score. Draw round ${nextNumber} anyway?`))
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
	<nav class="tabs" aria-label="Tournament sections">
		<a href="?tab=rounds" data-sveltekit-noscroll aria-current={tab === 'rounds' ? 'page' : undefined}>Rounds<span class="count">{data.rounds.length || ''}</span></a>
		<a href="?tab=standings" data-sveltekit-noscroll aria-current={tab === 'standings' ? 'page' : undefined}>Standings</a>
		<a href="?tab=lineup" data-sveltekit-noscroll aria-current={tab === 'lineup' ? 'page' : undefined}>Line-up<span class="count">{data.entries.length || ''}</span></a>
	</nav>

	{#if tab === 'rounds'}
		<section class="stack">
			{#if admin && isOpen}
				<div class="panel drawbar">
					<div class="info">
						<span class="big">Round {nextNumber}</span>
						<span class="muted small num">
							{#if active.length < perCourt}
								Add at least {perCourt} players to draw a round ({active.length} playing).
							{:else}
								{active.length} playing · {nCourts} court{nCourts === 1 ? '' : 's'} · {sitting} sitting out
							{/if}
						</span>
						<span class="muted small">
							Matches: {bestOfLabel(t.bestOf).toLowerCase()}{t.bestOf === 1 ? '' : ' sets'} ·
							<a href="?tab=lineup#settings">change</a>
						</span>
					</div>
					<div class="actions">
						{#if latest && latest.matches.every((m) => !isScored(m))}
							<form method="POST" action="?/undo" use:enhance>
								<button class="btn link" onclick={ask(`Remove round ${latest.number} so you can draw it again?`)}>Redraw round {latest.number}</button>
							</form>
						{/if}
						<form method="POST" action="?/draw" use:enhance>
							<button class="btn primary" disabled={active.length < perCourt} onclick={confirmDraw}>Draw round {nextNumber}</button>
						</form>
					</div>
					{#if form?.action === 'draw' && form?.message}<p class="error full">{form.message}</p>{/if}
				</div>
			{/if}

			{#if !data.rounds.length}
				<div class="empty">
					<strong>No rounds yet</strong>
					Each round shuffles everyone into new doubles pairs, avoiding repeat partners where possible.
					{#if admin && data.entries.length < perCourt}<a class="btn" href="?tab=lineup">Add players</a>{/if}
				</div>
			{/if}

			{#each data.rounds.toReversed() as r (r.id)}
				<section class="round">
					<div class="round-head">
						<h2><span class="plate">Round {r.number}</span></h2>
						<span class="muted small num">{r.matches.filter(isScored).length} of {r.matches.length} scored</span>
					</div>
					{#if r.byes.length}
						<div class="sitting muted small">Sitting out: {#each r.byes as id (id)}<span class="chip">{name(id)}</span>{/each}</div>
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
					<h3>Add players</h3>
					{#if data.available.length}
						<fieldset class="pick">
							<legend class="hint">Club players</legend>
							{#if data.available.length > 1}
								<div class="pick-all">
									<button type="button" class="btn link" onclick={pickAll(true)}>Select all</button>
									<button type="button" class="btn link" onclick={pickAll(false)}>Clear</button>
								</div>
							{/if}
							{#each data.available as p (p.id)}
								<label class="pick-item"><input type="checkbox" name="player" value={p.id} /> {p.name}</label>
							{/each}
						</fieldset>
					{/if}
					<label class="field"
						><span>New players</span><textarea name="names" rows="2" placeholder="Anna, Ben, Chloe…"></textarea></label
					>
					<span class="hint">Separate names with commas or new lines. New names are added to the club list too.</span>
					{#if form?.action === 'addEntries' && form?.message}<p class="error">{form.message}</p>{/if}
					<div><button class="btn primary">Add to tournament</button></div>
				</form>
			{/if}

			{#if !data.entries.length}
				<div class="empty"><strong>No players yet</strong>{admin ? 'Add everyone who is playing. You need at least 4 for one court.' : 'The organiser hasn’t added players yet.'}</div>
			{:else}
				<div class="plist">
					{#each [...data.entries].sort((a, b) => Number(b.active) - Number(a.active)) as e (e.playerId)}
						{@const played = data.rounds.reduce((n, r) => n + r.matches.filter((m) => m.a.includes(e.playerId) || m.b.includes(e.playerId)).length, 0)}
						{@const byes = data.rounds.filter((r) => r.byes.includes(e.playerId)).length}
						<div class="prow" class:off={!e.active}>
							<span class="pname">{e.name}</span>
							<span class="muted small num">{played} played{byes ? ` · ${byes} sat out` : ''}</span>
							{#if admin}
								<form method="POST" action="?/setActive" use:enhance>
									<input type="hidden" name="player" value={e.playerId} />
									<input type="hidden" name="active" value={e.active ? '0' : '1'} />
									<button class="btn sm" class:primary={e.active} aria-pressed={e.active}>{e.active ? 'Playing' : 'Not playing'}</button>
								</form>
								{#if !played && !byes}
									<form method="POST" action="?/removeEntry" use:enhance>
										<input type="hidden" name="player" value={e.playerId} />
										<button class="btn link">Remove</button>
									</form>
								{/if}
							{:else if !e.active}
								<span class="muted small">Left</span>
							{/if}
						</div>
					{/each}
				</div>
				{#if form?.action === 'removeEntry' && form?.message}<p class="error">{form.message}</p>{/if}
				{#if admin}<p class="hint">Switch someone to “Not playing” if they leave early. They keep their results and aren’t drawn into new rounds.</p>{/if}
			{/if}

			{#if admin}
				<form id="settings" method="POST" action="?/settings" class="panel stack" use:enhance={() => async ({ update }) => update({ reset: false })}>
					<h3>Tournament settings</h3>
					<div class="form-grid">
						<label class="field"><span>Name</span><input name="name" required maxlength="80" value={t.name} /></label>
						<label class="field"><span>Date</span><input name="held_on" type="date" value={t.heldOn ?? today} /></label>
						<label class="field">
							<span>Courts</span>
							<select name="courts" value={String(t.courts)}>
								<option value="0">As many as needed</option>
								{#each Array.from({ length: 12 }, (_, i) => i + 1) as c (c)}<option value={String(c)}>{c}</option>{/each}
							</select>
						</label>
						<label class="field">
							<span>Sets per match</span>
							<select name="best_of" value={String(t.bestOf)}>
								{#each bestOfOptions as n (n)}<option value={String(n)}>{bestOfLabel(n)}</option>{/each}
							</select>
						</label>
					</div>
					<p class="hint">Changing sets per match applies to results entered from now on. Results already saved keep their sets.</p>
					{#if form?.action === 'settings' && form?.message}<p class="error">{form.message}</p>{/if}
					{#if form?.action === 'settings' && form?.done}<p class="hint">{form.done}</p>{/if}
					<div><button class="btn">Save settings</button></div>
				</form>

				<div class="panel stack">
					<h3>{isOpen ? 'Finish tournament' : 'Reopen tournament'}</h3>
					<p class="hint">
						{isOpen ? 'Finishing stops new rounds being drawn. Results stay visible and you can reopen it later.' : 'Reopen to draw more rounds.'}
					</p>
					<form method="POST" action="?/status" use:enhance>
						<input type="hidden" name="status" value={isOpen ? 'finished' : 'open'} />
						<button class="btn">{isOpen ? 'Mark as finished' : 'Reopen'}</button>
					</form>
				</div>

				<form method="POST" action="?/delete" class="panel stack danger-zone">
					<h3>Delete tournament</h3>
					<p class="hint">Deletes every round and result in this tournament. Players stay in the club list. This can’t be undone.</p>
					<label class="field"><span>Type “{t.name}” to confirm</span><input name="confirm" autocomplete="off" /></label>
					{#if form?.action === 'delete' && form?.message}<p class="error">{form.message}</p>{/if}
					<div><button class="btn danger">Delete tournament</button></div>
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
