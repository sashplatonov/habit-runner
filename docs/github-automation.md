# 🤖 GitHub Automation: Renovate + Trivy

This guide explains how dependency and security update automation works in this repository, and what to do when alerts arrive.

## What Is Enabled

- Renovate config: [`.github/renovate.json`](../.github/renovate.json)
- Trivy workflow: [`.github/workflows/trivy.yml`](../.github/workflows/trivy.yml)

## 1. Renovate Setup

Renovate is not active until the GitHub App is installed.

1. Open <https://github.com/apps/renovate>.
2. Click **Install** and select this repository.
3. Confirm the app has at least:
   - `Contents: Read and write`
   - `Pull requests: Read and write`
   - `Issues: Read and write` (for Dependency Dashboard)
4. Wait for the first Renovate run (or trigger via app controls if available).

## 2. Renovate Behavior in This Repo

Configured behavior:

- Runs weekly on Monday after 06:00 (`Europe/Belgrade`).
- Creates a Dependency Dashboard issue.
- Uses `dependencies` label on Renovate PRs.
- Separates major updates from minor/patch updates.
- Groups:
  - npm non-major updates
  - docker-related updates

## 3. Trivy Setup

No extra app installation is required. The workflow runs in GitHub Actions.

Triggers:

- on each pull request
- on push to `main`/`master`
- weekly schedule
- manual run via `workflow_dispatch`

What it does:

- scans repository filesystem (`scan-type: fs`)
- checks `HIGH` and `CRITICAL` vulnerabilities
- uploads SARIF report to **Security > Code scanning**
- fails CI if matching vulnerabilities are found

## 4. Notification Path

You will get GitHub notifications from:

- Renovate pull requests
- Dependency Dashboard updates
- Trivy workflow failures
- Code scanning alerts

To make sure notifications are visible:

1. Open repository **Watch** settings and include **Pull requests**, **Issues**, and **Security alerts**.
2. In personal GitHub notification settings, keep email/web notifications enabled for the repository.

## 5. Recommended Triage Flow

1. Start with Renovate PRs for patch/minor updates.
2. Run CI and merge safe updates quickly.
3. Handle major updates separately with focused testing.
4. For Trivy findings:
   - open the SARIF alert details
   - identify impacted package/image layer
   - upgrade or mitigate in a dedicated PR

## 6. Manual Operations

- Run Trivy manually: **Actions > Trivy Security Scan > Run workflow**
- Re-run failed Trivy job from the same workflow page.
- Rebase/update Renovate PR with GitHub UI controls.

