# ProductHunt Launch — Habbit Runner

## Tagline (< 60 chars)

> Offline-first habit tracker — no app store, works anywhere

## Short Description (< 260 chars)

A free, offline-first Progressive Web App for building daily habits. Tracks streaks, completion rates, and push reminders — all from your browser, no install from an app store required. Your data stays on your device first.

## Maker Comment (first comment on launch day)

Hi ProductHunt! 👋

I built Habbit Runner because every habit app I tried either:
- Required an internet connection to log a simple check-in
- Locked data behind a subscription
- Needed a native app install from an app store

Habbit Runner stores everything locally in IndexedDB first, then syncs in the background when you're online. If you never connect, your streaks still work.

**What makes it different:**
- ✅ Full offline support — works on the subway, in a cabin, anywhere
- ✅ PWA — install directly from Chrome/Safari, no App Store
- ✅ Streak analytics with completion rate trends
- ✅ Web push notifications
- ✅ Free — no subscription required for core features

**Tech for the curious:** SvelteKit 5, Dexie (IndexedDB), Quarkus backend, PostgreSQL.

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
- [ ] `04-offline-badge.png` — App running in Chrome with DevTools showing "Offline" mode — data still visible
- [ ] `05-install-prompt.png` — PWA install prompt on Android Chrome or desktop Chrome
- [ ] `06-push-notification.png` — Push notification reminder on desktop or Android
- [ ] `07-stats-view.png` — Stats/analytics page with completion rate graph

## Video / GIF (optional but recommended)

A 15–30 second GIF showing:
1. Open app in browser (already installed)
2. Switch Chrome DevTools to Offline
3. Log a habit check-in
4. Show streak counter update
5. Switch back to Online — sync indicator appears briefly

## Pricing Table (for PH listing)

| Plan   | Price | Features                                      |
|--------|-------|-----------------------------------------------|
| Free   | $0    | All core features — offline tracking, streaks, push notifications, analytics |

## Launch Day Checklist

- [ ] Schedule launch for Tuesday–Thursday 12:00 AM PST (peak PH traffic)
- [ ] Notify friends / community to upvote at launch time
- [ ] Post in relevant Slack/Discord communities (Indie Hackers, PWA developers)
- [ ] Respond to every comment within 2 hours on launch day
- [ ] Update README with PH badge after launch
- [ ] Submit to related collections: "PWA Tools", "Productivity Apps", "Free Tools"

## Follow-up Posts (within 30 days)

1. **Maker story post**: "How I built an offline-first habit tracker with SvelteKit and IndexedDB"
2. **Dev.to cross-post** of the blog article at `/blog/building-offline-pwa-sveltekit-dexie`
3. **Indie Hackers milestone post**: First 100 users, what worked

---

*Last updated: April 2026*
