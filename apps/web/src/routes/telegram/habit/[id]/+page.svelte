<script lang="ts">import { onMount } from 'svelte'; onMount(() => { window.location.replace('/app/habit/' + location.pathname.split('/')[3]); });</script><p>Opening habit…</p>
