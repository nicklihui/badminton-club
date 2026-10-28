<script lang="ts">
	import { page } from '$app/state';
	import { msgs } from '$lib/i18n';
	import { computeStandings, rankRows } from '$lib/standings';
	import type { RoundView } from '$lib/types';

	let { rounds, playerIds, names }: { rounds: RoundView[]; playerIds: number[]; names: Record<number, string> } = $props();

	const m = $derived(msgs(page.data.lang));
	const t = $derived(m.standings);
	const nameOf = (id: number) => names[id] ?? m.removedPlayer;
	const rows = $derived(rankRows(computeStandings(rounds, playerIds), nameOf));
	const anyPlayed = $derived(rows.some((r) => r.played > 0));
	const signed = (n: number) => (n > 0 ? `+${n}` : String(n));
</script>

{#if !anyPlayed}
	<div class="empty"><strong>{t.emptyTitle}</strong>{t.empty}</div>
{:else}
	<div class="table-wrap">
		<table>
			<thead>
				<tr>
					<th class="l">#</th>
					<th class="l">{t.player}</th>
					<th title={t.pTitle}>{t.p}</th>
					<th class="key-h" title={t.wTitle}>{t.w}</th>
					<th title={t.lTitle}>{t.l}</th>
					<th class="key-h" title={t.setsTitle}>{t.sets}</th>
					<th class="key-h" title={t.ptsTitle}>{t.pts}</th>
					<th title={t.agstTitle}>{t.agst}</th>
					<th title={t.diffTitle}>+/−</th>
				</tr>
			</thead>
			<tbody>
				{#each rows as r (r.playerId)}
					<tr class:top={r.rank === 1}>
						<td class="l rank">{r.rank ?? '–'}</td>
						<td class="l name">{nameOf(r.playerId)}</td>
						<td>{r.played}</td>
						<td class="key">{r.won}</td>
						<td>{r.lost}</td>
						<td class="key">{r.setsWon}–{r.setsLost}</td>
						<td class="key">{r.pointsFor}</td>
						<td>{r.pointsAgainst}</td>
						<td>{signed(r.pointsFor - r.pointsAgainst)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
	<p class="hint">{t.hint}</p>
{/if}

<style>
	.rank {
		font-family: var(--display);
		font-size: 24px;
		font-weight: 900;
		color: var(--muted);
		width: 1%;
	}
	tr.top .rank {
		color: var(--accent-text);
	}
	.name {
		font-weight: 600;
		white-space: normal;
		min-width: 120px;
	}
	.key {
		font-weight: 700;
	}
	td.key:nth-child(4) {
		color: var(--accent-text);
	}
	th.key-h {
		text-decoration: underline;
		text-decoration-color: var(--crimson);
		text-decoration-thickness: 3px;
		text-underline-offset: 5px;
	}
</style>
