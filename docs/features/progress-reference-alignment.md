# Progress reference alignment

The Progress screen now follows the compact mobile reference hierarchy: the period selector sits below the page heading, the weekly summary exposes its key metrics in a single card, and attention/strong habits use compact analytical rows with status badges and thin seven-day strips. The twelve-week history is a 12 by 7 calendar matrix with a separate current-week strip. The duplicate add-habit call to action was removed because mobile navigation already provides that action. Calculations, routes, and server contracts are unchanged.

Risk is limited to responsive presentation and the Progress E2E geometry assertions. Rollback is a revert of the Progress page/component and corresponding test changes; no data or configuration migration is required.
