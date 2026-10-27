<script lang="ts">
	import { formats } from '$lib/formats';
	import { formatDate } from '$lib/dates';
	import { bestOfLabel, bestOfOptions } from '$lib/types';

	let { data, form } = $props();

	const today = new Date().toISOString().slice(0, 10);
	let showCreate = $state(false);
	const open = $derived(data.tournaments.filter((t) => t.status === 'open'));
	const finished = $derived(data.tournaments.filter((t) => t.status === 'finished'));
</script>

<div class="stack">
	{#if data.needsSetup}
		<p class="notice">This site has no organiser yet. <a href="/setup">Create the first organiser account</a> to start running tournaments.</p>
	{/if}

	{#if data.admin && !showCreate}
		<div class="head">
			<button class="btn primary" onclick={() => (showCreate = true)}>New tournament</button>
		</div>
	{/if}

	{#if data.admin && (showCreate || form?.message)}
		<form method="POST" action="?/create" class="panel stack">
			<h3>New tournament</h3>
			<div class="form-grid">
				<label class="field"><span>Name</span><input name="name" required maxlength="80" placeholder="Thursday club night" /></label>
				<label class="field"><span>Date</span><input name="held_on" type="date" value={today} /></label>
				<label class="field">
					<span>Courts</span>
					<select name="courts">
						<option value="0">As many as needed</option>
						{#each Array.from({ length: 12 }, (_, i) => i + 1) as c (c)}<option value={c}>{c}</option>{/each}
					</select>
				</label>
				<label class="field">
					<span>Sets per match</span>
					<select name="best_of">
						{#each bestOfOptions as n (n)}<option value={n} selected={n === 3}>{bestOfLabel(n)}</option>{/each}
					</select>
				</label>
				<label class="field">
					<span>Format</span>
					<select name="format">
						{#each data.formats as f (f.id)}<option value={f.id}>{f.name}</option>{/each}
					</select>
				</label>
			</div>
			<p class="hint">{data.formats[0].description}</p>
			{#if form?.message}<p class="error">{form.message}</p>{/if}
			<div class="actions">
				<button class="btn primary">Create and add players</button>
				<button type="button" class="btn link" onclick={() => (showCreate = false)}>Cancel</button>
			</div>
		</form>
	{/if}

	{#if !data.tournaments.length}
		<div class="empty">
			<strong>No tournaments yet</strong>
			{data.admin ? 'Create one, add the players who turned up, and draw the first round.' : 'Tournaments appear here once an organiser creates one.'}
		</div>
	{/if}

	{#each [{ title: 'Current', list: open }, { title: 'Finished', list: finished }] as group (group.title)}
		{#if group.list.length}
			<section class="stack" style="gap: 10px">
				<h2>{group.title}</h2>
				<div class="list">
					{#each group.list as t (t.id)}
						<a class="row" href="/t/{t.id}">
							<div class="main">
								<span class="name">{t.name}</span>
								<span class="muted small">{t.heldOn ? formatDate(t.heldOn) : 'No date'} · {formats[t.format].name}</span>
							</div>
							<div class="figures num">
								<span><b>{t.players}</b> players</span>
								<span><b>{t.rounds}</b> rounds</span>
								<span><b>{t.scored}</b>/{t.matches} scored</span>
							</div>
							<span class="pill {t.status}">{t.status === 'open' ? 'In progress' : 'Finished'}</span>
						</a>
					{/each}
				</div>
			</section>
		{/if}
	{/each}
</div>

<style>
	.head {
		display: flex;
		justify-content: flex-end;
	}
	.actions {
		display: flex;
		gap: 8px;
		align-items: center;
	}
	.list {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		overflow: hidden;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 14px 18px;
		border-bottom: 1px solid var(--line);
		color: var(--ink);
		text-decoration: none;
		flex-wrap: wrap;
	}
	.row:last-child {
		border-bottom: 0;
	}
	.row:hover {
		background: var(--tint);
	}
	.main {
		display: grid;
		flex: 1 1 220px;
		min-width: 0;
	}
	.name {
		font-family: var(--display);
		font-size: 26px;
		font-weight: 800;
		text-transform: uppercase;
		line-height: 1.1;
	}
	.figures {
		display: flex;
		gap: 14px;
		color: var(--muted);
		font-size: 14px;
		flex-wrap: wrap;
	}
	.figures b {
		color: var(--ink);
	}
</style>
