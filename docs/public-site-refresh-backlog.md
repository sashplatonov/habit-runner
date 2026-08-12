# Public Site Refresh - Implementation Backlog

## Goal

Make the public Habbit Runner website feel like a concise, credible product
experience on desktop and small touch screens. Visitors should quickly
understand what they can do, try the product without pressure, and read useful
editorial content. Public copy must sound human and specific, visual assets must
be clear editorial illustrations rather than generated-looking decoration, and
implementation details must stay in repository and operator documentation rather
than marketing pages.

## Architectural decisions

- The public site is a static SvelteKit surface. Its source of truth is the
  route/component copy in `apps/web/src/routes`, reusable public components in
  `apps/web/src/lib/components`, SEO configuration in
  `apps/web/src/lib/seo/publicPages.ts` and `apps/web/src/lib/seo/competitors.ts`,
  and Markdown posts in `apps/web/src/content/blog`. It must not introduce API,
  database, or authentication changes.
- Product claims must be checked against the current application behavior and
  the deployed public site before publication. Local code proves an intended
  capability, not that a third-party platform, browser version, deployment, or
  Telegram client currently provides it. The claims register records that
  distinction and assigns an owner for each promise.
- Keep the existing root-route split: a normal browser sees `PublicLanding`,
  while a Telegram launch enters `TelegramRootEntry`. Do not duplicate the Mini
  App authentication flow or make the marketing landing render inside that
  launch path. Public routes that can be opened in a Telegram webview still need
  the same compact, safe-area-aware geometry as mobile web.
- Reuse `PublicNav`, `PublicFooter`, `PublicCta`, `PublicFeatureCard`,
  `PublicSection`, `PublicSeoHead`, `JsonLdHead`, and `PublicSeoPage`. Avoid
  separate page-only navigation, CTA, typography, FAQ, or SEO implementations.
- Use one calm editorial visual system for landing, information pages, and the
  blog: real product screenshots where they explain the product, and a small
  category-based SVG illustration system for articles. Do not add stock-photo,
  AI-image, carousel, rating, QR-code, or app-store patterns that the product
  cannot substantiate.
- Keep legal disclosures meaningful in `/privacy-policy`, but express them in
  user language. Source-code, framework, API, token, storage, cache, and
  infrastructure explanations belong in `README.md` and `docs/`, not in the
  public UI, metadata, JSON-LD, or blog CTAs.
- Preserve existing canonical URLs, post slugs, `coverImage` URLs, structured
  data types, the Google sign-in action, and `/showcase` route behavior. Copy
  and layout changes are backwards-compatible; no migration or backend release
  is expected.

## Screen and content decisions

| Surface | Desktop decision | Compact/mobile and Telegram-webview decision | Keep / remove / redesign |
| --- | --- | --- | --- |
| `/` landing | One short promise, one primary demo CTA, a real product preview, and only the proof needed to decide. | Stack hero actions; keep the demo CTA first and full-width; menu and actions remain at least 44px; do not show the marketing landing during a Telegram root launch. | Redesign; remove duplicate feature-card walls and technical labels. |
| `PublicNav` and `PublicFooter` | Retain the concise primary navigation and legal/product links. | Keep the accessible disclosure menu; use one-column, touch-sized links and safe bottom spacing. | Keep, simplify, and unify. |
| `/features`, `/about`, SEO guides, `/vs/[slug]` | Use scannable benefit-led sections and honest comparison context. | Replace dense tables and repeated link pills with stacked summary cards/disclosures; no horizontal scroll. | Collapse repeated content; redesign information hierarchy. |
| `/showcase` | Keep the real interactive demo and reset action. | Keep the same app navigation and a clear reset affordance. | Keep; replace “in memory” and implementation explanations with a short visitor-facing reset notice. |
| `/blog` and `/blog/[slug]` | Make the list editorial, easier to scan, and led by useful articles rather than a long uniform card feed. | Use readable body text, reserved cover-image space, one-column cards, and a short metadata line. | Redesign the listing and article chrome; remove technical blog framing. |
| Blog articles and SEO metadata | Preserve helpful, evidence-based advice and transparent comparisons. | Same content hierarchy with no tiny body text or dense comparison table. | Rewrite stale, rhythmic, unsupported, and implementation-focused copy. |

## Recommended implementation order

| Order | Task | Priority | Depends on | Reason |
| ---: | --- | --- | --- | --- |
| 1 | P1-1 | P1 | - | Establishes truthful product language and a regression guard before visual and editorial work. |
| 2 | P1-2 | P1 | P1-1 | Rebuilds the highest-traffic entry and shared shell around the approved message. |
| 3 | P1-3 | P1 | P1-1, P1-2 | Applies the same hierarchy and no-implementation-detail rule to all remaining public product pages. |
| 4 | P1-4 | P1 | P1-1 | Corrects stale and AI-like editorial content without changing article URLs. |
| 5 | P2-1 | P2 | P1-2, P1-3, P1-4 | Replaces the generated-looking visual language only after the copy and hierarchy determine what images need to communicate. |
| 6 | P2-2 | P2 | P1-2, P1-3, P1-4, P2-1 | Adds cross-browser public-surface coverage and completes release-quality checks. |

## P1-1: Establish the public claims and copy guard

**Status:** ✅ Completed

**Priority:** P1

**Depends on:** -

### Outcome

Every public promise has an accountable product source and wording suitable for
visitors. Unsupported, dated, contradictory, and implementation-facing claims
are identified before they are rewritten, and an automated guard prevents known
implementation vocabulary from returning to public copy.

### Architectural decision

The application behavior remains the product source of truth; the claims
register is a review artifact, not a second product configuration. Extend the
existing web validation scripts instead of adding a separate content build or
duplicating route data.

### Files

- Create `docs/public-site-claims-register.md`.
- Create `apps/web/scripts/check-public-content.mjs`.
- Modify `apps/web/package.json`.
- Modify `apps/web/src/lib/seo/publicPages.ts`.
- Modify `apps/web/src/lib/seo/competitors.ts`.
- Modify `apps/web/src/lib/components/PublicNav.svelte`.
- Modify `apps/web/src/routes/about/+page.svelte`.
- Modify `apps/web/src/routes/blog/+page.svelte`.
- Modify `apps/web/src/routes/features/+page.svelte`.
- Modify `apps/web/src/routes/showcase/+layout.svelte`.
- Modify `apps/web/src/routes/vs/[slug]/+page.svelte`.
- Modify the affected Markdown sources in `apps/web/src/content/blog/`.

### Work

1. Inventory every public claim in landing, Features, About, SEO metadata and
   JSON-LD, comparison data, showcase banner, blog metadata, article body, and
   article CTA. For each, record its public wording, product evidence, page
   owner, and whether live/deployed verification is still required.
2. Resolve known credibility defects: titles that still say `2025`; claims that
   describe Habbit Runner as an offline tracker while other pages say writes
   need a connection; `local-first` positioning that does not match the current
   server-owned habit data; and assumptions about browser/platform support that
   need a fresh release check.
3. Define a concise approved vocabulary for user outcomes (for example,
   habits, progress, reminders, sign-in, and demo) and a rejected vocabulary
   for implementation details (framework names, API/REST, JWT, database,
   server/storage/cache mechanics, and internal demo implementation). Allow
   plain-language privacy disclosures only where legally necessary.
4. Add the validation script to the normal frontend checks. It must scan the
   actual public sources and fail with file/line diagnostics for rejected terms,
   expired year labels, missing required blog metadata, or a post cover path
   that does not exist. It must not inspect repository/operator documentation.

### Acceptance criteria

- The register covers `/`, `/features`, `/about`, `/showcase`, the three SEO
  guides, all comparison slugs, `/blog`, all article slugs, public metadata,
  and JSON-LD; it distinguishes local code evidence from a live deployment
  check.
- No public product page, metadata, JSON-LD, or blog CTA names the product
  framework, API, token/session mechanism, database, cache, or internal demo
  storage approach.
- Every date-sensitive comparison/article claim is either refreshed with a
  verifiable publication/update date or removed; no public post title says
  `2025`.
- `npm run check:public-content` reports each violating path and line and exits
  non-zero; the current approved content exits zero.

### Verification

```bash
cd apps/web && npm run check:public-content
cd apps/web && npm run lint
cd apps/web && npm run check:types
git diff --check
```

### Commit

```bash
git add docs/public-site-claims-register.md apps/web/scripts/check-public-content.mjs apps/web/package.json apps/web/src/lib/seo/publicPages.ts apps/web/src/lib/seo/competitors.ts
git commit -m "chore(public): add public claims guard"
```

## P1-2: Redesign the landing and shared public shell for decisive, compact use

**Status:** ⬜ Not started

**Priority:** P1

**Depends on:** P1-1

### Outcome

The landing lets a first-time visitor understand the product and open the demo
in one screenful instead of scrolling through repeated cards. Navigation and
footer remain predictable on desktop and easily tappable on mobile.

### Architectural decision

`PublicLanding` owns landing composition; `PublicNav` and `PublicFooter` own
site-wide navigation. Reuse the existing Google sign-in and `/showcase` links;
do not add a new login, app-install, or Telegram launch state to the public
shell. The root route continues to select `TelegramRootEntry` for Telegram
launches.

### Files

- Modify `apps/web/src/lib/components/PublicLanding.svelte`.
- Modify `apps/web/src/lib/components/PublicNav.svelte`.
- Modify `apps/web/src/lib/components/PublicFooter.svelte`.
- Modify `apps/web/src/lib/components/public/PublicSection.svelte`.
- Modify `apps/web/src/lib/components/public/PublicFeatureCard.svelte`.
- Modify `apps/web/src/routes/showcase/+layout.svelte`.
- Modify `apps/web/src/routes/+page.svelte` only if markup needs an explicit,
  testable loading/redirect announcement; preserve its current route decision.
- Modify `apps/web/src/index.css` and/or `apps/web/src/lib/theme/theme.css`
  only for shared public visual tokens that cannot be expressed through the
  existing token system.

### Work

1. Replace the current hero’s competing CTAs, feature-card grid, duplicate
   “what you get” card, generic superlatives, and all implementation/product
   jargon with one outcome-led headline, one primary demo action, one secondary
   sign-in action, and a real interface preview with an explanatory caption.
2. Keep a short proof section only when it helps a visitor decide. Collapse or
   remove repeated “Best For”, keyword-list, and generic FAQ content rather
   than restyling the same long page.
3. Make `PublicNav` reflect a small information hierarchy: retain primary
   destinations, make the mobile menu keyboard-operable and dismissible, and
   ensure the primary action and menu button are at least 44 by 44 CSS pixels
   with at least 8px between adjacent touch targets.
4. Make the footer a compact way to continue or find legal information, not a
   second marketing panel. Retain canonical links and accessible landmark/nav
   labels.
5. Replace the showcase implementation explanation with a plain statement that
   visitors can experiment freely and reset the sample. Keep reset behavior and
   showcase isolation unchanged.
6. Apply shared responsive rules: no page-level horizontal overflow at 320px,
   readable 16px minimum body copy on compact layouts, visible focus, reduced
   motion support, and safe bottom spacing for webviews.

### Acceptance criteria

- At 1440px, the landing’s primary demo action, supporting sign-in action, and
  product preview are visible without a long sequence of generic feature cards.
- At 320px and 390px, hero actions stack without clipping; the primary demo
  action is first and has a 44px-or-larger target; opening, closing, and using
  the navigation requires no hover or horizontal scrolling.
- At 390px with the Telegram-webview user agent, `/` still selects the existing
  Telegram entry flow; public routes such as `/blog` use the compact public
  shell without unsafe bottom overlap or horizontal scrolling.
- Public nav, footer, landing, and showcase banner contain no rejected
  implementation terms from P1-1, while their existing sign-in, demo, reset,
  and canonical-route behavior still works.
- Keyboard focus remains visible and Escape returns focus from the open mobile
  navigation to its trigger.

### Verification

```bash
cd apps/web && npm run test -- PublicNav
cd apps/web && npm run check:public-content
cd apps/web && npm run lint
cd apps/web && npm run check:types
cd apps/web && npm run test:e2e -- --project=desktop --project=compact-mobile --project=mobile --project=telegram-webview public-site.spec.ts
git diff --check
```

### Commit

```bash
git add apps/web/src/lib/components/PublicLanding.svelte apps/web/src/lib/components/PublicNav.svelte apps/web/src/lib/components/PublicFooter.svelte apps/web/src/lib/components/public/PublicSection.svelte apps/web/src/lib/components/public/PublicFeatureCard.svelte apps/web/src/routes/showcase/+layout.svelte apps/web/src/routes/+page.svelte apps/web/src/index.css apps/web/src/lib/theme/theme.css apps/web/tests/unit/PublicNav.test.ts apps/web/tests/e2e/public-site.spec.ts
git commit -m "feat(public): simplify landing experience"
```

## P1-3: Rebuild public information pages around benefits and honest choices

**Status:** ⬜ Not started

**Priority:** P1

**Depends on:** P1-1, P1-2

### Outcome

Features, About, SEO guides, and comparison pages answer visitor questions in a
short, credible, consistent format without exposing implementation details,
repeating landing content, or forcing a mobile visitor through dense tables.

### Architectural decision

Extend `PublicSeoPage` and the existing SEO/competitor data contracts rather
than creating independent copies for each guide. `PublicSeoHead` and
`JsonLdHead` continue to derive structured data from these sources; do not
create route-local SEO schemas that drift from visible copy.

### Files

- Modify `apps/web/src/routes/features/+page.svelte`.
- Modify `apps/web/src/routes/about/+page.svelte`.
- Modify `apps/web/src/lib/components/PublicSeoPage.svelte`.
- Modify `apps/web/src/routes/vs/[slug]/+page.svelte`.
- Modify `apps/web/src/lib/seo/publicPages.ts`.
- Modify `apps/web/src/lib/seo/competitors.ts`.
- Modify `apps/web/src/routes/privacy-policy/+page.svelte` only where a
  plain-language disclosure needs to replace an implementation description.
- Modify `apps/web/src/routes/sitemap.xml/+server.ts` only if an intentionally
  removed public URL requires sitemap removal; preserve all retained URLs.

### Work

1. On Features, group real visitor benefits into a short priority order and
   remove cards describing architecture, transport, caching, framework, or
   app-store mechanics. State limitations only when they affect a visitor’s
   choice, in plain language approved by P1-1.
2. On About, replace the Technology grid with product purpose, principles,
   privacy commitment, and support/contact content. Keep privacy claims only if
   evidence in the claims register supports them.
3. Redesign the three SEO guides from repeated template blocks and large
   navigation-pill clusters into concise guide-specific answers, a compact FAQ,
   and one relevant next action. Remove self-referential “these pages” copy.
4. Rework comparison pages into an honest decision aid: retain source-checked
   competitor facts and a visible “better if” case for the competitor; turn the
   wide feature table into semantic stacked rows/disclosures below the mobile
   breakpoint while keeping the desktop comparison scannable.
5. Keep visible copy, meta descriptions, FAQ schema, software/organization
   schema, and canonical URLs aligned. Do not make unverified competitor price,
   platform, offline, privacy, or integration promises.

### Acceptance criteria

- `/features`, `/about`, `/habit-tracker`, `/streak-tracker`,
  `/daily-routine-planner`, and every existing `/vs/[slug]` route communicate
  user outcomes without framework, API, storage, or authentication-mechanism
  details.
- At 320px, every comparison can be read and all links/actions reached without
  a horizontal table scroll; at desktop width the same information remains
  scannable without duplicating source data.
- Each guide has one page-specific headline and next action; it no longer
  repeats the same generic product-team or placeholder-documentation section.
- Existing canonical URL, breadcrumb, FAQ, and organization/software schema
  remain valid and match the updated visible claim; removed URLs are absent
  from the sitemap only when intentionally retired.
- Privacy text remains discoverable from the footer and contains the necessary
  user-facing disclosure without source-code or infrastructure exposition.

### Verification

```bash
cd apps/web && npm run check:public-content
cd apps/web && npm run test
cd apps/web && npm run check
cd apps/web && npm run test:e2e -- --project=desktop --project=compact-mobile --project=mobile public-site.spec.ts
git diff --check
```

### Commit

```bash
git add apps/web/src/routes/features/+page.svelte apps/web/src/routes/about/+page.svelte apps/web/src/lib/components/PublicSeoPage.svelte apps/web/src/routes/vs/'[slug]'/+page.svelte apps/web/src/lib/seo/publicPages.ts apps/web/src/lib/seo/competitors.ts apps/web/src/routes/privacy-policy/+page.svelte apps/web/src/routes/sitemap.xml/+server.ts apps/web/tests/e2e/public-site.spec.ts
git commit -m "feat(public): clarify product information pages"
```

## P1-4: Refresh the blog as useful, current editorial content

**Status:** ⬜ Not started

**Priority:** P1

**Depends on:** P1-1

### Outcome

The blog becomes a compact, useful reading surface. Articles use varied,
concrete language, current facts, and transparent recommendations instead of
keyword-heavy, rhythmic paragraphs or product implementation explanations.

### Architectural decision

Markdown remains the single article source, parsed by `posts.server.ts`; retain
every existing slug and `coverImage` URL so external links and sitemap entries
do not break. Improve the renderer/listing only through their existing routes,
not through a parallel CMS or client-side article store.

### Files

- Modify `apps/web/src/routes/blog/+page.svelte`.
- Modify `apps/web/src/routes/blog/[slug]/+page.svelte`.
- Modify `apps/web/src/lib/blog/posts.server.ts` only if required to expose
  existing front-matter data for the redesigned listing; do not add duplicate
  article metadata.
- Modify all existing Markdown sources in `apps/web/src/content/blog/`, with
  special factual review of `best-habit-tracker-pwa.md`,
  `best-offline-habit-tracker.md`, `best-habit-tracker-for-privacy.md`,
  `habit-tracker-without-internet.md`, `local-first-productivity-apps.md`, and
  `habit-tracker-no-account.md`.

### Work

1. Rewrite titles, descriptions, introductions, headings, conclusions, and
   CTAs so each article opens with a real reader situation, makes a specific
   point, uses varied sentence length, and ends with a relevant next step.
   Remove formulaic phrases, inflated certainty, keyword repetition, and
   repeated “no X, no Y” rhythms.
2. Bring every article and comparison to the claims register: correct stale
   year labels; remove statements that Habbit Runner offers offline data entry,
   local-first storage, automatic sync-after-offline, or unsupported browser
   behavior; and label opinions/comparisons as editorial judgments where
   evidence is not a product fact.
3. Remove implementation-stack explanations from article bodies and CTAs.
   Retain useful product concepts only in visitor language, such as whether a
   feature needs a connection or sign-in when that changes the reader’s choice.
4. Redesign `/blog` from a long uniform vertical card list into an editorial
   hierarchy with a latest/featured lead and compact article rows or category
   groups. Keep all posts discoverable and dates/reading time/author readable.
5. Improve `/blog/[slug]` reading rhythm: reserve image dimensions, use a
   comfortable text measure and body size, remove the low-contrast CTA text,
   and make the breadcrumb/title/metadata usable on 320px screens.
6. Preserve Markdown safety: article HTML continues to originate only from
   repository-controlled Markdown, and the existing narrowly justified static
   rendering exception is not broadened to user-provided content.

### Acceptance criteria

- All 27 current article slugs resolve, retain their canonical URL and cover
  reference, and have non-empty title, description, author, publication date,
  keywords, reading time, and body.
- No blog title says `2025`; stale/contradictory Habbit Runner claims identified
  by P1-1 are corrected or removed in every article, not only in the six named
  high-risk posts.
- A reader can distinguish advice, a product fact, and an editorial comparison;
  no article presents an unsupported product capability as fact.
- At 320px and 390px, blog cards, headline, metadata, cover, prose, links, and
  CTA fit without horizontal scrolling; body copy is at least 16px and link
  targets are reachable by keyboard and touch.
- Blog index and article metadata/structured data describe editorial guidance,
  not technical implementation, and remain consistent with front matter.

### Verification

```bash
cd apps/web && npm run check:public-content
cd apps/web && npm run test
cd apps/web && npm run check
cd apps/web && npm run test:e2e -- --project=desktop --project=compact-mobile --project=mobile public-site.spec.ts
git diff --check
```

### Commit

```bash
git add apps/web/src/routes/blog/+page.svelte apps/web/src/routes/blog/'[slug]'/+page.svelte apps/web/src/lib/blog/posts.server.ts apps/web/src/content/blog apps/web/tests/e2e/public-site.spec.ts
git commit -m "docs(blog): refresh public editorial content"
```

## P2-1: Replace generated-looking public graphics with a purposeful editorial system

**Status:** ⬜ Not started

**Priority:** P2

**Depends on:** P1-2, P1-3, P1-4

### Outcome

Landing and blog imagery explain the product or article topic at a glance,
while staying restrained, accessible, fast, and recognisably part of one visual
language rather than looking like generic AI decoration.

### Architectural decision

Keep existing SVG cover URLs and the current generation entry point. Replace
the abstract glow/orb/card formula with a deliberately limited set of
category-based, hand-authored SVG motifs and real UI captures where a product
screen is the clearest visual explanation. Do not add a runtime image service,
remote image dependency, or a second cover registry.

### Files

- Modify `apps/web/scripts/generate-blog-covers.mjs`.
- Modify all existing SVG covers in `apps/web/static/blog/`.
- Modify `apps/web/static/og-image.svg` if it shares the obsolete public visual
  language.
- Modify `apps/web/src/lib/components/PublicLanding.svelte`.
- Modify `apps/web/src/routes/blog/+page.svelte`.
- Modify `apps/web/src/routes/blog/[slug]/+page.svelte`.
- Modify `apps/web/src/app.css` and/or `apps/web/src/index.css` only for shared
  public illustration/layout tokens.

### Work

1. Define a compact editorial art direction that matches the approved public
   palette and typography: high-contrast paper-like surfaces, intentional
   geometry, consistent stroke/shape weights, and one clear metaphor per
   article category (routine, recovery, focus, privacy, travel, comparison).
2. Redraw each of the 27 generated covers through the existing script so the
   asset names and front-matter references stay stable. No cover may contain a
   synthetic person, pseudo-photographic object, decorative text wall, or a
   different visual style from the rest of the collection.
3. Use a real product UI preview in the landing only where it makes the demo
   action clearer. Provide meaningful alt text for explanatory imagery and
   empty alt text only for purely decorative SVGs.
4. Preserve the 1200x630 cover contract, declare image dimensions to avoid
   layout shift, lazy-load non-critical listing images, and confirm every
   rendered SVG has a readable foreground/background contrast.
5. Regenerate checked-in assets deterministically; review the resulting desktop
   and mobile captures before accepting the visual direction.

### Acceptance criteria

- Every `coverImage` in the 27 existing post files resolves to its existing
  `/blog/<slug>.svg` URL; the blog index and article page render it without a
  broken image or layout shift.
- Each cover communicates its article category using the shared editorial
  system, with no generated-looking gradients/orbs, pseudo-photography, or
  text-heavy poster treatment.
- Landing/product graphics and blog covers have appropriate alt treatment,
  load without remote image requests, and preserve readable contrast in the
  public light theme.
- At 320px, 390px, 768px, and 1440px, images remain within their containers and
  do not create horizontal overflow; non-critical images remain lazy-loaded.

### Verification

```bash
cd apps/web && node scripts/generate-blog-covers.mjs
cd apps/web && npm run check:public-content
cd apps/web && npm run check
cd apps/web && npm run test:e2e -- --project=desktop --project=compact-mobile --project=mobile public-site.spec.ts
git diff --check
```

### Commit

```bash
git add apps/web/scripts/generate-blog-covers.mjs apps/web/static/blog apps/web/static/og-image.svg apps/web/src/lib/components/PublicLanding.svelte apps/web/src/routes/blog/+page.svelte apps/web/src/routes/blog/'[slug]'/+page.svelte apps/web/src/app.css apps/web/src/index.css apps/web/tests/e2e/public-site.spec.ts
git commit -m "feat(public): refresh editorial graphics"
```

## P2-2: Add public-surface browser coverage and complete release checks

**Status:** ⬜ Not started

**Priority:** P2

**Depends on:** P1-2, P1-3, P1-4, P2-1

### Outcome

The refreshed public experience has automated proof for its key routes,
responsive geometry, accessibility-critical controls, content integrity, and
build output. Manual production checks are explicitly separated from local
evidence.

### Architectural decision

Use the existing Playwright projects (`desktop`, `compact-mobile`, `mobile`, and
`telegram-webview`), existing unit-test tooling, and existing `npm run check`
gate. Add a focused public suite rather than overloading authenticated habit or
showcase journeys; retain the existing Telegram Mini App tests as the source
for root-entry authentication behavior.

### Files

- Create `apps/web/tests/e2e/public-site.spec.ts`.
- Modify `apps/web/tests/unit/PublicNav.test.ts`.
- Modify `apps/web/tests/unit/previewStaticConfig.test.ts` only if static asset
  assertions have an existing home there.
- Modify `apps/web/playwright.config.ts` only if no current project can express
  the required public-route viewport; do not replace the existing projects.
- Modify `docs/public-site-claims-register.md` with final local and manual
  verification evidence.

### Work

1. Cover the public landing, nav disclosure/focus restoration, demo CTA,
   Features, About, each SEO guide, each comparison route, blog index, and one
   representative article. Assert title/primary action/landmark visibility and
   no horizontal overflow rather than brittle pixel-perfect marketing copy.
2. Add viewport assertions at 320px/390px/768px/1440px for targets, readable
   navigation, cards/tables, images, breadcrumbs, and footer. Test a public
   route under the Telegram-webview project, while keeping the existing root
   test that verifies Telegram chooses `TelegramRootEntry`.
3. Add static content tests for valid front matter, unchanged slugs and cover
   files, current-year policy, rejected implementation terms, and visible/SEO
   claim alignment. Do not add linter or test suppressions.
4. Run the full web quality gate and record its exact result. After deployment,
   manually verify the public HTTPS site on desktop, a 320–390px phone, and the
   official Telegram client; record those as deployment/client proof rather
   than presenting mocked Playwright evidence as a production result.

### Acceptance criteria

- The new public suite passes on desktop, compact mobile, mobile, and Telegram
  webview projects; it catches horizontal overflow and inaccessible menu/CTA
  regressions on the routes named above.
- All public routes build, their known static blog assets resolve, and the
  content guard passes without exclusions or suppressions.
- `npm run check` and `npm run test` pass; a passing build is documented only
  as static/local evidence, not as proof of deployed browser or Telegram
  behavior.
- The claims register has a final section separating local test evidence from
  the required post-deploy desktop/mobile/official-Telegram manual checks.

### Verification

```bash
cd apps/web && npm run check:public-content
cd apps/web && npm run test
cd apps/web && npm run check
cd apps/web && npm run test:e2e -- --project=desktop --project=compact-mobile --project=mobile --project=telegram-webview public-site.spec.ts telegram-mini-app.spec.ts
git diff --check
```

### Commit

```bash
git add apps/web/tests/e2e/public-site.spec.ts apps/web/tests/unit/PublicNav.test.ts apps/web/tests/unit/previewStaticConfig.test.ts apps/web/playwright.config.ts docs/public-site-claims-register.md
git commit -m "test(public): cover responsive public routes"
```

## Final release evidence

Local checks validate the checkout only. Before declaring the refresh released,
confirm the deployed HTTPS public site at desktop and 320–390px widths, open a
public route in the official Telegram client, verify the active release commit
in remote CI, and visually inspect the final landing/blog assets. Record the
URL, release commit, browser/device, and result in the claims register.
