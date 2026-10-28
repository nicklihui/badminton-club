<script lang="ts">
	import { enhance } from '$app/forms';
	import { msgs } from '$lib/i18n';

	let { data, form } = $props();

	const m = $derived(msgs(data.lang));
	const t = $derived(m.admin);
</script>

<div class="stack">
	<div class="table-wrap">
		<table>
			<thead><tr><th class="l">{m.field.username}</th><th>{t.added}</th></tr></thead>
			<tbody>
				{#each data.admins as a (a.id)}
					<tr>
						<td class="l"><b>{a.username}</b>{#if a.id === data.admin?.id}<span class="muted"> · {t.you}</span>{/if}</td>
						<td>{new Date(a.created_at).toLocaleDateString(m.locale)}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="cols">
		<form method="POST" action="?/addOrganiser" class="panel stack" use:enhance>
			<h3>{t.addTitle}</h3>
			<label class="field"><span>{m.field.username}</span><input name="username" required autocomplete="off" value={form?.form === 'add' ? (form?.username ?? '') : ''} /></label>
			<label class="field"><span>{m.field.password}</span><input name="password" type="password" minlength="10" required autocomplete="new-password" /></label>
			<span class="hint">{t.shareHint}</span>
			{#if form?.form === 'add' && form?.message}<p class="error">{form.message}</p>{/if}
			{#if form?.form === 'add' && form?.done}<p class="notice">{form.done}</p>{/if}
			<button class="btn primary">{t.addButton}</button>
		</form>

		<form method="POST" action="?/password" class="panel stack" use:enhance>
			<h3>{t.changeTitle}</h3>
			<label class="field"><span>{t.current}</span><input name="current" type="password" required autocomplete="current-password" /></label>
			<label class="field"><span>{t.next}</span><input name="next" type="password" minlength="10" required autocomplete="new-password" /></label>
			{#if form?.form === 'password' && form?.message}<p class="error">{form.message}</p>{/if}
			{#if form?.form === 'password' && form?.done}<p class="notice">{form.done}</p>{/if}
			<button class="btn">{t.changeButton}</button>
		</form>
	</div>
</div>

<style>
	.cols {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 16px;
		align-items: start;
	}
</style>
