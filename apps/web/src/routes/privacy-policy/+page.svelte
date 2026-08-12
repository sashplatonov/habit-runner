<script lang="ts">
  // import { resolve } from '$app/paths';
  import PublicSeoHead from '$lib/components/PublicSeoHead.svelte';
  import PublicNav from '$lib/components/PublicNav.svelte';
  import PublicFooter from '$lib/components/PublicFooter.svelte';
  import { PUBLIC_PRIVACY_SEO } from '$lib/seo/publicPages';

  const lastUpdated = 'April 16, 2026';
</script>

<PublicSeoHead
  title={PUBLIC_PRIVACY_SEO.title}
  description={PUBLIC_PRIVACY_SEO.description}
  keywords={PUBLIC_PRIVACY_SEO.keywords}
  pathname={PUBLIC_PRIVACY_SEO.pathname}
/>

<div class="min-h-screen bg-[linear-gradient(180deg,#f8fbff_0%,#eef4fb_52%,#f7fbff_100%)] text-slate-900">
  <PublicNav maxWidth="max-w-5xl" />

  <main class="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6">
    <section class="overflow-hidden rounded-[2rem] border border-slate-200/80 bg-white/92 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.1)] sm:p-8">
      <h1 class="text-3xl font-semibold leading-tight text-slate-900">Privacy Policy</h1>
      <p class="mt-2 text-xs text-slate-500">Last updated: {lastUpdated}</p>
    </section>

    <div class="prose prose-slate mt-8 max-w-none rounded-[1.75rem] border border-slate-200/80 bg-white/92 p-6 text-sm shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
      <section class="mt-6">
        <h2 class="text-lg font-semibold text-slate-900">1. Introduction</h2>
        <p class="mt-2 text-slate-600">
          Habit Runner ("we", "our", or "us") operates the Habit Runner habit tracker application
          available at <a href="https://habit-runner.freeddns.org" class="text-cyan-700 underline">habit-runner.freeddns.org</a>.
          This Privacy Policy explains how we collect, use, and protect your information when you
          use our service.
        </p>
      </section>

      <section class="mt-6">
        <h2 class="text-lg font-semibold text-slate-900">2. Data We Collect</h2>
        <h3 class="mt-3 text-base font-semibold text-slate-800">2.1 Application Storage</h3>
        <p class="mt-2 text-slate-600">
          The PWA may cache its application shell on your device so repeat visits can load quickly.
          Habit data and check-in history are stored on our servers for your signed-in account and
          require a network connection to read or change.
        </p>
        <h3 class="mt-3 text-base font-semibold text-slate-800">2.2 Google OAuth</h3>
        <p class="mt-2 text-slate-600">
          When you sign in with Google, we receive your Google Account ID, email address, and
          display name. We use this to identify your account for authenticated API access. We do not access
          your Google Drive, Gmail, contacts, or any other Google service data.
        </p>
        <h3 class="mt-3 text-base font-semibold text-slate-800">2.3 Account Data</h3>
        <p class="mt-2 text-slate-600">
          When you sign in, your habit records and check-in history are transmitted to and stored
          on our servers over HTTPS using JWT authentication so they can be loaded on your signed-in
          devices. No financial information is collected or stored.
        </p>
        <h3 class="mt-3 text-base font-semibold text-slate-800">2.4 Telegram Mini App</h3>
        <p class="mt-2 text-slate-600">
          If you open Habit Runner in Telegram, we receive the Telegram user identifier and the
          public profile fields Telegram includes in Mini App initialization data. The server
          verifies Telegram's signed data before creating a session. If you link Telegram and email
          sign-in, these identifiers are associated with the same account so your habits and
          check-ins remain available from both entry points. We do not receive your Telegram chats,
          contacts, or messages.
        </p>
        <h3 class="mt-3 text-base font-semibold text-slate-800">2.5 Push Notifications</h3>
        <p class="mt-2 text-slate-600">
          If you enable push notifications, we store a browser push subscription endpoint. This is
          used only to deliver habit reminders you configure. You can revoke this permission at any
          time from your browser settings.
        </p>
      </section>

      <section class="mt-6">
        <h2 class="text-lg font-semibold text-slate-900">3. How We Use Your Data</h2>
        <ul class="mt-2 space-y-1 text-slate-600">
          <li>To provide the habit tracking and streak analytics service.</li>
          <li>To sync your data across devices when you sign in.</li>
          <li>To send push notification reminders you configure.</li>
          <li>To maintain your session via JWT access and refresh tokens.</li>
        </ul>
        <p class="mt-3 text-slate-600">
          We do <strong>not</strong> sell your data. We do <strong>not</strong> use your data for
          advertising. We do <strong>not</strong> share your data with third parties except as
          required to operate the service (e.g., our hosting provider).
        </p>
      </section>

      <section class="mt-6">
        <h2 class="text-lg font-semibold text-slate-900">4. Data Retention</h2>
        <p class="mt-2 text-slate-600">
          Cached application assets persist on your device until you clear your browser data or
          uninstall the app. Account data on our servers is retained while your account is active.
          You may request deletion of your account and associated server-side data by contacting us.
        </p>
      </section>

      <section class="mt-6">
        <h2 class="text-lg font-semibold text-slate-900">5. Cookies and Tokens</h2>
        <p class="mt-2 text-slate-600">
          Habit Runner uses browser <code>localStorage</code> to store authentication tokens (JWT
          access token and refresh token). We do not use third-party tracking cookies or advertising
          cookies.
        </p>
      </section>

      <section class="mt-6">
        <h2 class="text-lg font-semibold text-slate-900">6. Your Rights (GDPR / CCPA)</h2>
        <p class="mt-2 text-slate-600">
          Depending on your jurisdiction, you may have the right to:
        </p>
        <ul class="mt-2 space-y-1 text-slate-600">
          <li>Access the personal data we hold about you.</li>
          <li>Request correction of inaccurate data.</li>
          <li>Request deletion of your data ("right to be forgotten").</li>
          <li>Object to processing or request restriction of processing.</li>
          <li>Data portability.</li>
        </ul>
        <p class="mt-3 text-slate-600">
          To exercise any of these rights, contact us through our
          <a href="https://github.com/sashplatonov" class="text-cyan-700 underline">GitHub profile</a>.
        </p>
      </section>

      <section class="mt-6">
        <h2 class="text-lg font-semibold text-slate-900">7. Security</h2>
        <p class="mt-2 text-slate-600">
          We use HTTPS for all data transmission. Authentication uses short-lived JWT access tokens
          and longer-lived refresh tokens. We do not store plaintext passwords.
        </p>
      </section>

      <section class="mt-6">
        <h2 class="text-lg font-semibold text-slate-900">8. Changes to This Policy</h2>
        <p class="mt-2 text-slate-600">
          We may update this Privacy Policy. Changes will be posted on this page with an updated
          date. Continued use of the service constitutes acceptance of the updated policy.
        </p>
      </section>

      <section class="mt-6">
        <h2 class="text-lg font-semibold text-slate-900">9. Contact</h2>
        <p class="mt-2 text-slate-600">
          For privacy-related questions or requests, contact us through our
          <a href="https://github.com/sashplatonov" class="text-cyan-700 underline">GitHub profile</a>.
        </p>
      </section>
    </div>
  </main>

  <PublicFooter maxWidth="max-w-5xl" />
</div>
