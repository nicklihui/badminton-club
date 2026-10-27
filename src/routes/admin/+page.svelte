<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();
</script>

<div class="stack">
	<div class="table-wrap">
		<table>
			<thead><tr><th class="l">Username</th><th>Added</th></tr></thead>
			<tbody>
				{#each data.admins as a (a.id)}
					<tr>
						<td class="l"><b>{a.username}</b>{#if a.id === data.admin?.id}<span class="muted"> · you</span>{/if}</td>
						<td>{new Date(a.created_at).toLocaleDateString('en-GB')}</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<div class="cols">
		<form method="POST" action="?/addOrganiser" class="panel stack" use:enhance>
			<h3>Add an organiser</h3>
			<label class="field"><span>Username</span><input name="username" required autocomplete="off" value={form?.form === 'add' ? (form?.username ?? '') : ''} /></label>
			<label class="field"><span>Password</span><input name="password" type="password" minlength="10" required autocomplete="new-password" /></label>
			<span class="hint">Share the password with them in person; they can change it after signing in.</span>
			{#if form?.form === 'add' && form?.message}<p class="error">{form.message}</p>{/if}
			{#if form?.form === 'add' && form?.done}<p class="notice">{form.done}</p>{/if}
			<button class="btn primary">Add organiser</button>
		</form>

		<form method="POST" action="?/password" class="panel stack" use:enhance>
			<h3>Change your password</h3>
			<label class="field"><span>Current password</span><input name="current" type="password" required autocomplete="current-password" /></label>
			<label class="field"><span>New password</span><input name="next" type="password" minlength="10" required autocomplete="new-password" /></label>
			{#if form?.form === 'password' && form?.message}<p class="error">{form.message}</p>{/if}
			{#if form?.form === 'password' && form?.done}<p class="notice">{form.done}</p>{/if}
			<button class="btn">Change password</button>
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
