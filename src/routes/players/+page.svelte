<script lang="ts">
	import { enhance } from '$app/forms';
	import { msgs } from '$lib/i18n';

	let { data, form } = $props();

	const t = $derived(msgs(data.lang).players);

	let editing = $state<number | null>(null);
	let showArchived = $state(false);

	// Points depend on each tournament's sets per match, so the club table ranks by win rate instead.
	// Players who haven't played sort last.
	const winRate = (s: { won: number; played: number }) => (s.played ? s.won / s.played : -1);
	const rows = $derived(
		data.players
			.filter((p) => showArchived || !p.archived)
			.sort(
				(a, b) =>
					Number(a.archived) - Number(b.archived) ||
					winRate(b.stats) - winRate(a.stats) ||
					b.stats.won - a.stats.won ||
					a.name.localeCompare(b.name)
			)
	);
	const archivedCount = $derived(data.players.filter((p) => p.archived).length);
	const pct = (won: number, played: number) => (played ? Math.round((won / played) * 100) + '%' : '–');
</script>

<div class="stack">
	{#if data.admin}
		<form method="POST" action="?/add" class="panel add" use:enhance>
			<label class="field grow"
				><span>{t.addLabel}</span><textarea name="names" rows="1" placeholder="Anna, Ben, Chloe…"></textarea></label
			>
			<button class="btn primary">{t.add}</button>
			<span class="hint full">{t.addHint}</span>
			{#if form?.message && !form?.id}<p class="error full">{form.message}</p>{/if}
		</form>
	{/if}

	{#if !data.players.length}
		<div class="empty"><strong>{t.emptyTitle}</strong>{t.empty}</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th class="l">{t.player}</th>
						<th>{t.events}</th>
						<th>{t.played}</th>
						<th>{t.won}</th>
						<th>{t.winPct}</th>
						<th>{t.sets}</th>
						{#if data.admin}<th></th>{/if}
					</tr>
				</thead>
				<tbody>
					{#each rows as p (p.id)}
						<tr class:archived={p.archived}>
							<td class="l name">
								{#if editing === p.id}
									<form
										method="POST"
										action="?/rename"
										class="rename"
										use:enhance={() =>
											async ({ result, update }) => {
												await update({ reset: false });
												if (result.type === 'success') editing = null;
											}}
									>
										<input type="hidden" name="id" value={p.id} />
										<input class="input" name="name" value={p.name} maxlength="40" aria-label={t.newName} />
										<button class="btn sm primary">{t.save}</button>
										<button type="button" class="btn link" onclick={() => (editing = null)}>{msgs(data.lang).cancel}</button>
									</form>
									{#if form?.id === p.id && form?.message}<p class="error">{form.message}</p>{/if}
								{:else}
									{p.name}{#if p.archived}<span class="muted small"> · {t.archived}</span>{/if}
								{/if}
							</td>
							<td>{p.stats.tournaments}</td>
							<td>{p.stats.played}</td>
							<td>{p.stats.won}</td>
							<td class="key">{pct(p.stats.won, p.stats.played)}</td>
							<td>{p.stats.setsWon}–{p.stats.setsLost}</td>
							{#if data.admin}
								<td class="tools">
									<button class="btn link" onclick={() => (editing = p.id)}>{t.rename}</button>
									<form method="POST" action="?/archive" use:enhance style="display: inline">
										<input type="hidden" name="id" value={p.id} />
										<input type="hidden" name="archived" value={p.archived ? '0' : '1'} />
										<button class="btn link">{p.archived ? t.restore : t.archive}</button>
									</form>
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		<p class="hint">{t.rankHint}</p>
		{#if archivedCount}
			<label class="hint toggle"><input type="checkbox" bind:checked={showArchived} /> {t.showArchived(archivedCount)}</label>
		{/if}
	{/if}
</div>

<style>
	.add {
		display: flex;
		flex-wrap: wrap;
		gap: 8px 10px;
		align-items: end;
	}
	.grow {
		flex: 1 1 260px;
	}
	.full {
		flex-basis: 100%;
	}
	.name {
		font-weight: 600;
		white-space: normal;
		min-width: 140px;
	}
	.key {
		font-weight: 700;
		color: var(--accent-text);
	}
	tr.archived td {
		color: var(--muted);
	}
	.tools {
		white-space: nowrap;
	}
	.rename {
		display: flex;
		gap: 6px;
		align-items: center;
	}
	.rename .input {
		min-width: 120px;
		padding: 4px 8px;
	}
	.toggle {
		display: inline-flex;
		gap: 6px;
		align-items: center;
	}
</style>
