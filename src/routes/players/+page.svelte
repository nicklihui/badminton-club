<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let editing = $state<number | null>(null);
	let showArchived = $state(false);

	const rows = $derived(
		data.players
			.filter((p) => showArchived || !p.archived)
			.sort(
				(a, b) =>
					Number(a.archived) - Number(b.archived) ||
					b.stats.won - a.stats.won ||
					b.stats.setsWon - a.stats.setsWon ||
					b.stats.pointsFor - a.stats.pointsFor ||
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
				><span>Add club players</span><textarea name="names" rows="1" placeholder="Anna, Ben, Chloe…"></textarea></label
			>
			<button class="btn primary">Add</button>
			<span class="hint full">Separate several names with commas or new lines. You can also add players straight from a tournament.</span>
			{#if form?.message && !form?.id}<p class="error full">{form.message}</p>{/if}
		</form>
	{/if}

	{#if !data.players.length}
		<div class="empty"><strong>No players yet</strong>Players appear here once they are added to the club or a tournament.</div>
	{:else}
		<div class="table-wrap">
			<table>
				<thead>
					<tr>
						<th class="l">Player</th>
						<th>Events</th>
						<th>Played</th>
						<th>Won</th>
						<th>Win %</th>
						<th>Sets</th>
						<th>Points</th>
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
										<input class="input" name="name" value={p.name} maxlength="40" aria-label="New name" />
										<button class="btn sm primary">Save</button>
										<button type="button" class="btn link" onclick={() => (editing = null)}>Cancel</button>
									</form>
									{#if form?.id === p.id && form?.message}<p class="error">{form.message}</p>{/if}
								{:else}
									{p.name}{#if p.archived}<span class="muted small"> · archived</span>{/if}
								{/if}
							</td>
							<td>{p.stats.tournaments}</td>
							<td>{p.stats.played}</td>
							<td class="key">{p.stats.won}</td>
							<td>{pct(p.stats.won, p.stats.played)}</td>
							<td>{p.stats.setsWon}–{p.stats.setsLost}</td>
							<td>{p.stats.pointsFor}</td>
							{#if data.admin}
								<td class="tools">
									<button class="btn link" onclick={() => (editing = p.id)}>Rename</button>
									<form method="POST" action="?/archive" use:enhance style="display: inline">
										<input type="hidden" name="id" value={p.id} />
										<input type="hidden" name="archived" value={p.archived ? '0' : '1'} />
										<button class="btn link">{p.archived ? 'Restore' : 'Archive'}</button>
									</form>
								</td>
							{/if}
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if archivedCount}
			<label class="hint toggle"
				><input type="checkbox" bind:checked={showArchived} /> Show {archivedCount} archived player{archivedCount === 1 ? '' : 's'}</label
			>
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
