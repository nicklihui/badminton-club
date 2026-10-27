<script lang="ts">
	import { enhance } from '$app/forms';
	import { isScored, matchResult, setsToWin, type BestOf, type MatchView } from '$lib/types';

	let {
		match,
		names,
		admin,
		bestOf,
		error
	}: { match: MatchView; names: Record<number, string>; admin: boolean; bestOf: BestOf; error?: string } = $props();

	let editing = $state(false);
	const scored = $derived(isScored(match));
	const result = $derived(matchResult(match));
	const aWon = $derived(result.winner === 'a');
	const bWon = $derived(result.winner === 'b');
	const showForm = $derived(admin && (!scored || editing));
	// a one-set match shows the set's points on the plate; otherwise sets won, with each set listed below
	const singleSet = $derived(match.sets.length === 1);
	const setRows = $derived(Array.from({ length: Math.max(bestOf, match.sets.length) }, (_, i) => i + 1));
	const name = (id: number) => names[id] ?? 'Removed player';
	const teamLabel = (ids: number[]) => ids.map(name).join(' and ');
</script>

<article class="match">
	<div class="top">
		<span class="court-no">Court {match.court}</span>
		<span class="pill {scored ? 'open' : 'todo'}">{scored ? 'Final' : 'To play'}</span>
	</div>

	<div class="court">
		{#each [{ ids: match.a, side: 'a', won: aWon, lost: bWon }, { ids: match.b, side: 'b', won: bWon, lost: aWon }] as half (half.side)}
			<div class="half {half.side}" class:won={half.won} class:lost={half.lost}>
				{#if half.won}<span class="crown">Won</span>{/if}
				{#each half.ids as id (id)}<span class="pn">{name(id)}</span>{/each}
			</div>
		{/each}
		<div class="net" aria-hidden="true"></div>
	</div>

	<div class="scorebar">
		{#if showForm}
			<form
				method="POST"
				action="?/score"
				class="score-form"
				use:enhance={() =>
					async ({ result, update }) => {
						await update({ reset: false });
						if (result.type === 'success') editing = false;
					}}
			>
				<input type="hidden" name="match" value={match.id} />
				{#each setRows as n (n)}
					<div class="set-row">
						<span class="set-label">Set {n}{#if n > setsToWin(bestOf)}<span class="opt"> if needed</span>{/if}</span>
						<input class="score-in" name="set{n}a" inputmode="numeric" pattern="\d*" maxlength="2" placeholder="–" value={match.sets[n - 1]?.a ?? ''} aria-label="Set {n} points for {teamLabel(match.a)}" />
						<span class="dash">:</span>
						<input class="score-in" name="set{n}b" inputmode="numeric" pattern="\d*" maxlength="2" placeholder="–" value={match.sets[n - 1]?.b ?? ''} aria-label="Set {n} points for {teamLabel(match.b)}" />
					</div>
				{/each}
				<div class="form-actions">
					<button class="btn primary sm">Save result</button>
					{#if editing}<button type="button" class="btn link" onclick={() => (editing = false)}>Cancel</button>{/if}
				</div>
			</form>
			{#if editing}
				<form method="POST" action="?/clear" use:enhance={() => async ({ update }) => { await update(); editing = false; }}>
					<input type="hidden" name="match" value={match.id} />
					<button class="btn link" onclick={(e) => { if (!confirm('Clear this result? The match goes back to unplayed.')) e.preventDefault(); }}>Clear result</button>
				</form>
			{/if}
		{:else if scored}
			<div class="result">
				<span class="final plate num" aria-label={singleSet ? 'Final score' : 'Sets won'}>
					{#if singleSet}
						<span class={aWon ? 'w' : 'l'}>{match.sets[0].a}</span><span class="colon">:</span><span class={bWon ? 'w' : 'l'}>{match.sets[0].b}</span>
					{:else}
						<span class={aWon ? 'w' : 'l'}>{result.setsA}</span><span class="colon">:</span><span class={bWon ? 'w' : 'l'}>{result.setsB}</span>
					{/if}
				</span>
				{#if !singleSet}
					<ol class="sets num" aria-label="Set scores">
						{#each match.sets as s, i (i)}
							<li><span class:won={s.a > s.b}>{s.a}</span>:<span class:won={s.b > s.a}>{s.b}</span></li>
						{/each}
					</ol>
				{/if}
				{#if admin}<button class="btn link" onclick={() => (editing = true)}>Edit</button>{/if}
			</div>
		{:else}
			<span class="hint">Waiting for the result</span>
		{/if}
		{#if error}<p class="error full">{error}</p>{/if}
	</div>
</article>

<style>
	.match {
		background: var(--surface);
		border: 1px solid var(--line);
		border-radius: var(--radius);
		overflow: hidden;
		display: grid;
		min-width: 0;
	}
	.top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 8px 12px;
	}
	.court-no {
		font-family: var(--display);
		font-weight: 800;
		font-size: 18px;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}

	/* navy court: doubles side lines, short service lines, net down the middle */
	.court {
		margin: 0 12px;
		background: var(--plate);
		position: relative;
		display: grid;
		grid-template-columns: 1fr 1fr;
		min-height: 108px;
		box-shadow:
			inset 0 0 0 3px var(--plate),
			inset 0 0 0 5px rgb(255 255 255 / 0.85);
	}
	.court::before,
	.court::after {
		content: '';
		position: absolute;
		top: 5px;
		bottom: 5px;
		width: 2px;
		background: var(--on-dark);
		opacity: 0.35;
	}
	.court::before {
		left: 32%;
	}
	.court::after {
		right: 32%;
	}
	.net {
		position: absolute;
		left: 50%;
		top: -4px;
		bottom: -4px;
		width: 4px;
		transform: translateX(-50%);
		background: repeating-linear-gradient(to bottom, var(--on-dark) 0 4px, transparent 4px 7px);
		z-index: 1;
	}
	.half {
		display: grid;
		align-content: center;
		gap: 4px;
		padding: 14px 16px;
		color: var(--on-dark);
		position: relative;
		z-index: 2;
		min-width: 0;
	}
	.half.b {
		text-align: right;
	}
	.pn {
		font-family: var(--display);
		font-weight: 800;
		font-size: 20px;
		text-transform: uppercase;
		letter-spacing: 0.02em;
		line-height: 1.05;
		overflow-wrap: anywhere;
	}
	.half.lost .pn {
		opacity: 0.55;
	}
	.crown {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.16em;
		text-transform: uppercase;
		color: var(--on-dark);
		background: var(--crimson);
		padding: 1px 6px;
		width: fit-content;
	}
	.half.b .crown {
		justify-self: end;
	}

	.scorebar {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px 10px;
		padding: 10px 12px 12px;
		flex-wrap: wrap;
	}
	.score-form {
		display: grid;
		gap: 6px;
		justify-items: center;
	}
	.set-row {
		display: grid;
		grid-template-columns: 7.5em auto auto auto;
		align-items: center;
		gap: 6px;
	}
	.set-label {
		font-family: var(--display);
		font-weight: 800;
		font-size: 17px;
		text-transform: uppercase;
		text-align: right;
		padding-right: 4px;
	}
	.opt {
		font-family: var(--body);
		font-weight: 500;
		font-size: 12px;
		text-transform: none;
		color: var(--muted);
	}
	.form-actions {
		display: flex;
		gap: 8px;
		align-items: center;
		margin-top: 4px;
	}
	.result {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: center;
		gap: 8px 14px;
	}
	.sets {
		display: flex;
		gap: 10px;
		margin: 0;
		padding: 0;
		list-style: none;
		font-family: var(--display);
		font-size: 20px;
		font-weight: 700;
		color: var(--muted);
	}
	.sets .won {
		color: var(--ink);
		font-weight: 900;
	}
	.final {
		font-family: var(--display);
		font-size: 38px;
		font-weight: 900;
		line-height: 1;
		padding: 0.12em 0.7em 0.06em;
	}
	.final .l {
		opacity: 0.55;
	}
	.colon {
		margin: 0 0.08em;
	}
	.dash {
		font-family: var(--display);
		font-size: 24px;
		color: var(--muted);
		margin: 0 4px;
		font-weight: 500;
	}
	.score-in {
		width: 56px;
		text-align: center;
		font-family: var(--display);
		font-size: 26px;
		font-weight: 800;
		border: 1px solid var(--line);
		background: var(--bg);
		border-radius: var(--radius);
		padding: 2px 4px;
		font-variant-numeric: tabular-nums;
	}
	.score-in:focus {
		border-color: var(--accent-text);
		outline: none;
	}
	.full {
		flex-basis: 100%;
		text-align: center;
	}
</style>
