# Public Site Claims Register

This register is the review contract for public product promises. It covers the
public SvelteKit routes, SEO data, comparison data, showcase notice, and blog
content. It does not govern `README.md`, architecture notes, setup runbooks, or
privacy-policy implementation disclosures.

## Claim policy

| Claim class | Public wording allowed | Evidence required |
| --- | --- | --- |
| Product outcome | Habits, check-ins, streaks, progress review, reminders, routine planning, sign-in, installable web experience | Current route/component behavior and focused automated test |
| Limitation | A save needs a connection; account access needs sign-in; a comparison has a stated trade-off | Current behavior plus a focused regression test or source inspection |
| Privacy | Plain-language statement about collection, advertising, sharing, and account use | Current privacy policy and backend contract; legal review before release |
| Platform/deployment | Browser or Telegram availability, supported OS/browser, live URL, or release readiness | Fresh deployed/manual verification; local build is not sufficient |
| Implementation | Frameworks, API/REST, JWT, database, migrations, service workers, browser storage, internal demo persistence | Never place in public marketing copy, metadata, JSON-LD, or editorial CTAs |

## Inventory and ownership

| Surface | Source of truth | Current review state | Required proof before release |
| --- | --- | --- | --- |
| `/` and root Telegram split | `apps/web/src/routes/+page.svelte`, `apps/web/src/lib/components/PublicLanding.svelte`, `TelegramRootEntry.svelte` | Local route behavior is covered; normal browser and Telegram launch intentionally remain separate | Desktop/mobile browser check and official Telegram client check on deployed HTTPS |
| Shared public shell | `PublicNav.svelte`, `PublicFooter.svelte`, public primitives | Copy must describe visitor outcomes, not architecture | Responsive browser checks at 320/390/768/1440px |
| `/features` | `apps/web/src/routes/features/+page.svelte`, `PUBLIC_FEATURES_SEO` | Capability wording must match current feature behavior | Focused route E2E and current product verification |
| `/about` | `apps/web/src/routes/about/+page.svelte`, `PUBLIC_ABOUT_SEO` | Mission/privacy language is public; implementation stack is not | Privacy-policy cross-check and content guard |
| `/habit-tracker`, `/streak-tracker`, `/daily-routine-planner` | `PublicSeoPage.svelte`, `PUBLIC_SEO_PAGES` | Guide-specific benefits and limitations | Route E2E plus SEO/FAQ alignment check |
| `/vs/[slug]` | `apps/web/src/lib/seo/competitors.ts`, route renderer | Competitor facts and prices are editorial claims and can drift | Re-check each competitor’s current public product page before publication |
| `/showcase` | `apps/web/src/routes/showcase/+layout.svelte`, showcase store | The visitor-facing reset notice is allowed; storage implementation is not | Existing showcase journey plus mobile browser check |
| `/blog` and `/blog/[slug]` | Route renderers and `apps/web/src/content/blog/*.md` | Every post requires complete front matter and a valid local cover | Content guard, route E2E, and editorial review |
| Blog graphics | `apps/web/static/blog/*.svg`, `coverImage` front matter | URLs are stable; visual refresh is a later backlog task | Asset existence and visual review at public breakpoints |
| Public metadata and JSON-LD | `PublicSeoHead.svelte`, route head blocks, SEO data | Must match visible copy and avoid implementation claims | Built HTML inspection and content guard |

## Known claim decisions

- Habbit Runner supports account-based habit tracking and progress review. Do
  not describe it as local-first or as an offline habit-logging product.
- The interface may reopen without a connection, but authenticated habit saves
  require reconnecting. Do not promise automatic offline logging or catch-up
  synchronization.
- The public product can be installed as a web app where the browser supports
  it. Exact browser-version and push-notification promises require a fresh
  platform check before publication.
- The anonymous showcase is for trying the interface. Its reset behavior is a
  visitor affordance; its persistence mechanism is an implementation detail.
- Competitor comparisons must distinguish sourced facts from Habbit Runner’s
  editorial recommendation. Prices, platform support, integrations, and
  offline behavior must be rechecked before a release.

## Verification evidence

Local evidence for this change:

```bash
cd apps/web && npm run check:public-content
cd apps/web && npm run lint
cd apps/web && npm run check:types
```

These commands validate the checkout only. They do not prove a deployed public
URL, current search-engine metadata, official Telegram-client behavior, or
third-party platform support. Those checks remain release tasks and must be
recorded here with the deployed URL, release commit, device/browser, and date.
