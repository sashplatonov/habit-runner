# ProductHunt Launch — Habbit Runner

## Tagline (< 60 chars)

> Server-backed habit tracker — no app store, focused anywhere

## Short Description (< 260 chars)

A free Progressive Web App for building daily habits. Tracks streaks, completion rates, and push reminders through a secure backend — all from your browser, no install from an app store required.

## Maker Comment (first comment on launch day)

Hi ProductHunt! 👋

I built Habbit Runner because every habit app I tried either:
- Made it hard to review progress across devices
- Locked data behind a subscription
- Needed a native app install from an app store

Habbit Runner stores account data in a Quarkus backend and keeps the PWA shell installable for fast repeat visits. Habit changes require a connection and are refreshed from the server.

**What makes it different:**
- ✅ Clear server-backed data model with predictable degraded behavior
- ✅ PWA — install directly from Chrome/Safari, no App Store
- ✅ Streak analytics with completion rate trends
- ✅ Web push notifications
- ✅ Free — no subscription required for core features

**Tech for the curious:** SvelteKit 5, Quarkus backend, PostgreSQL.

Would love feedback on the analytics dashboard and onboarding flow. Happy to answer questions below!

## Topics / Tags

- Productivity
- Health & Fitness
- Progressive Web Apps
- Open Source (if applicable)
- Habit Tracking

## Gallery / Screenshots Checklist

Take all screenshots at 1280×800 (desktop) and 390×844 (iPhone frame). Export as PNG, < 2 MB each.

- [ ] `01-dashboard.png` — Dashboard with 3–4 habits, streaks visible, at least one "completed today" state
- [ ] `02-habit-detail.png` — Single habit detail view with streak calendar and completion trend chart
- [ ] `03-add-habit.png` — Add habit form with emoji picker and frequency selector
- [ ] `04-degraded-state.png` — App showing the disconnected state without claiming offline writes
- [ ] `05-install-prompt.png` — PWA install prompt on Android Chrome or desktop Chrome
- [ ] `06-push-notification.png` — Push notification reminder on desktop or Android
- [ ] `07-stats-view.png` — Stats/analytics page with completion rate graph

## Video / GIF (optional but recommended)

A 15–30 second GIF showing:
1. Open app in browser (already installed)
2. Sign in and load the dashboard
3. Save a habit check-in while online
4. Switch Chrome DevTools to Offline and verify the degraded state
5. Switch back to Online and refresh the server-backed state

## Pricing Table (for PH listing)

| Plan   | Price | Features                                      |
|--------|-------|-----------------------------------------------|
| Free   | $0    | All core features — server-backed tracking, streaks, push notifications, analytics |

## Launch Day Checklist

- [ ] Schedule launch for Tuesday–Thursday 12:00 AM PST (peak PH traffic)
- [ ] Notify friends / community to upvote at launch time
- [ ] Post in relevant Slack/Discord communities (Indie Hackers, PWA developers)
- [ ] Respond to every comment within 2 hours on launch day
- [ ] Update README with PH badge after launch
- [ ] Submit to related collections: "PWA Tools", "Productivity Apps", "Free Tools"

## Follow-up Posts (within 30 days)

1. **Maker story post**: "How I built a server-backed habit tracker with SvelteKit and Quarkus"
2. **Dev.to cross-post** of the blog article at `/blog/building-offline-pwa-sveltekit-dexie`
3. **Indie Hackers milestone post**: First 100 users, what worked

---

*Last updated: April 2026*
