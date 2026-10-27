<script lang="ts">
	let { form } = $props();
</script>

<form method="POST" class="panel stack narrow">
	<label class="field"><span>Username</span><input name="username" autocomplete="username" required value={form?.username ?? ''} /></label>
	<label class="field"><span>Password</span><input name="password" type="password" autocomplete="current-password" required /></label>
	{#if form?.message}<p class="error">{form.message}</p>{/if}
	<button class="btn primary">Sign in</button>
</form>

<style>
	.narrow {
		max-width: 440px;
		margin-inline: auto;
		width: 100%;
	}
</style>
