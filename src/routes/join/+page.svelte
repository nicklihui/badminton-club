<script lang="ts">
	import { msgs } from '$lib/i18n';

	let { data } = $props();

	const m = $derived(msgs(data.lang).join);
</script>

<section class="panel stack sheet">
	{#if data.main}
		<!-- generated on the server from the address, no user text inside -->
		<div class="qr" role="img" aria-label={data.main.url}>{@html data.main.svg}</div>
		<a class="address" href={data.main.url}>{data.main.url.replace(/\/$/, '')}</a>
		<p class="hint">{m.sameWifi}</p>
		{#if data.other.length}
			<p class="hint">
				{m.other}
				{#each data.other as url (url)}<a href={url}>{url.replace(/\/$/, '')}</a>{' '}{/each}
			</p>
		{/if}
		<button class="btn primary no-print" type="button" onclick={() => print()}>{m.print}</button>
	{:else}
		<p class="error">{m.offline}</p>
	{/if}
</section>

<style>
	.sheet {
		max-width: 440px;
		margin-inline: auto;
		width: 100%;
		text-align: center;
	}
	.qr {
		width: min(100%, 320px);
		margin-inline: auto;
		padding: 16px;
		background: #fff;
	}
	.qr :global(svg) {
		display: block;
		width: 100%;
		height: auto;
	}
	.address {
		font-weight: 600;
		font-size: 22px;
		font-variant-numeric: tabular-nums;
		overflow-wrap: anywhere;
	}

	@media print {
		:global(.band nav),
		:global(.foot),
		.no-print {
			display: none;
		}
		.sheet {
			max-width: none;
			border: 0;
			box-shadow: none;
		}
		.qr {
			width: 12cm;
			max-width: 100%;
		}
	}
</style>
