<script lang="ts">
	import { msgs } from '$lib/i18n';

	let { data, form } = $props();

	const m = $derived(msgs(data.lang));
</script>

<form method="POST" class="panel stack narrow">
	<label class="field"><span>{m.field.username}</span><input name="username" autocomplete="username" required value={form?.username ?? ''} /></label>
	<label class="field"><span>{m.field.password}</span><input name="password" type="password" autocomplete="current-password" required /></label>
	{#if form?.message}<p class="error">{form.message}</p>{/if}
	<button class="btn primary">{m.login.button}</button>
</form>

<style>
	.narrow {
		max-width: 440px;
		margin-inline: auto;
		width: 100%;
	}
</style>
