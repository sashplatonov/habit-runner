# Today layout update

The Today screen now uses the available content width and a single column of habit rows. At desktop widths (1024px and above), the sidebar is 205px wide, completion controls sit on the left, and the streak and 30-day history sit on the right. Comfortable and compact density settings, tag groups, existing content, actions, and saved preferences remain available. Smaller viewports retain the stacked history layout.

Validation: frontend build (including lint), Svelte type checks, and the dashboard compact heatmap, controls, and filter unit suites. Browser checks use the public showcase, which renders the same dashboard component; they do not prove an authenticated production session.

Risk: layout changes can affect unusually long names and tags. The flexible title column and the stacked layout below 1024px limit this risk. No API, database, or environment settings changed.

Rollback: revert the layout changes in AppLayout.svelte, HabitTile.svelte, DashboardToolbar.svelte, ScheduledCompletionSummary.svelte, and the dashboard route.
