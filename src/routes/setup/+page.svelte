<script lang="ts">
	let { form } = $props();
</script>

<form method="POST" class="panel stack narrow">
	<label class="field"><span>Username</span><input name="username" autocomplete="username" required value={form?.username ?? ''} /></label>
	<label class="field"><span>Password</span><input name="password" type="password" autocomplete="new-password" minlength="10" required /></label>
	<span class="hint">At least 10 characters. You can add more organisers afterwards.</span>
	{#if form?.message}<p class="error">{form.message}</p>{/if}
	<button class="btn primary">Create organiser</button>
</form>

<style>
	.narrow {
		max-width: 440px;
		margin-inline: auto;
		width: 100%;
	}
</style>
