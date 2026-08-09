<script lang="ts">import { onMount } from 'svelte'; import { goto } from '$app/navigation'; import { resolve } from '$app/paths'; onMount(() => goto(resolve('/telegram', {}), { replaceState: true }));</script>
<p>Returning to Telegram…</p>
