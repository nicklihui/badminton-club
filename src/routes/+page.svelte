<script lang="ts">
	import { formatDate } from '$lib/dates';
	import { msgs } from '$lib/i18n';
	import { bestOfOptions } from '$lib/types';

	let { data, form } = $props();

	const m = $derived(msgs(data.lang));
	const today = new Date().toISOString().slice(0, 10);
	let showCreate = $state(false);
	const open = $derived(data.tournaments.filter((t) => t.status === 'open'));
	const finished = $derived(data.tournaments.filter((t) => t.status === 'finished'));
</script>

<div class="stack">
	{#if data.needsSetup}
		<p class="notice">{m.home.needsSetup} <a href="/setup">{m.home.setupLink}</a>{m.home.needsSetupEnd}</p>
	{/if}

	{#if data.admin && !showCreate}
		<div class="head">
			<button class="btn primary" onclick={() => (showCreate = true)}>{m.home.newTournament}</button>
		</div>
	{/if}

	{#if data.admin && (showCreate || form?.message)}
		<form method="POST" action="?/create" class="panel stack">
			<h3>{m.home.newTournament}</h3>
			<div class="form-grid">
				<label class="field"><span>{m.field.name}</span><input name="name" required maxlength="80" placeholder={m.home.namePlaceholder} /></label>
				<label class="field"><span>{m.field.date}</span><input name="held_on" type="date" value={today} /></label>
				<label class="field">
					<span>{m.field.courts}</span>
					<select name="courts">
						<option value="0">{m.field.asManyAsNeeded}</option>
						{#each Array.from({ length: 12 }, (_, i) => i + 1) as c (c)}<option value={c}>{c}</option>{/each}
					</select>
				</label>
				<label class="field">
					<span>{m.field.setsPerMatch}</span>
					<select name="best_of">
						{#each bestOfOptions as n (n)}<option value={n} selected={n === 3}>{m.bestOf(n)}</option>{/each}
					</select>
				</label>
				<label class="field">
					<span>{m.field.format}</span>
					<select name="format">
						{#each data.formats as f (f)}<option value={f}>{m.formats[f].name}</option>{/each}
					</select>
				</label>
			</div>
			<p class="hint">{m.formats[data.formats[0]].description}</p>
			{#if form?.message}<p class="error">{form.message}</p>{/if}
			<div class="actions">
				<button class="btn primary">{m.home.create}</button>
				<button type="button" class="btn link" onclick={() => (showCreate = false)}>{m.cancel}</button>
			</div>
		</form>
	{/if}

	{#if !data.tournaments.length}
		<div class="empty">
			<strong>{m.home.emptyTitle}</strong>
			{data.admin ? m.home.emptyAdmin : m.home.emptyViewer}
		</div>
	{/if}

	{#each [{ title: m.home.current, list: open }, { title: m.home.finished, list: finished }] as group (group.title)}
		{#if group.list.length}
			<section class="stack" style="gap: 10px">
				<h2>{group.title}</h2>
				<div class="list">
					{#each group.list as t (t.id)}
						<a class="row" href="/t/{t.id}">
							<div class="main">
								<span class="name">{t.name}</span>
								<span class="muted small">{t.heldOn ? formatDate(t.heldOn, data.lang) : m.noDate} · {m.formats[t.format].name}</span>
							</div>
							<div class="figures num">
								<span><b>{t.players}</b> {m.home.players}</span>
								<span><b>{t.rounds}</b> {m.home.rounds}</span>
								<span><b>{t.scored}</b>/{t.matches} {m.home.scored}</span>
							</div>
							<span class="pill {t.status}">{m.status[t.status]}</span>
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
