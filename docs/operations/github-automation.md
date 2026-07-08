# GitHub Automation

<a name="top"></a>

## 📋 Table of Contents

- [Current state](#current-state)
- [Renovate](#renovate)
- [Security scanning](#security-scanning)

---

## 🧭 Current state <a name="current-state"></a>

The current checkout includes:
- `.github/renovate.json`
- `.github/workflows/quality.yml` with backend verify, frontend verify, and Trivy security scans

The current checkout now treats Trivy as an active CI gate rather than a manual-only check.

[↑ Back to top](#top)

---

## 🤖 Renovate <a name="renovate"></a>

Renovate configuration lives in `.github/renovate.json`.

Current behavior:
- extends `config:recommended`;
- uses timezone `Europe/Belgrade`;
- schedules updates after 06:00 on Monday;
- labels Renovate PRs with `dependencies`;
- groups npm patch/minor/digest updates together;
- groups Docker-related updates together.

Manual validation:

```bash
npx renovate --dry-run --token="$GITHUB_TOKEN"
```

Review expectation:
- validate frontend commands from `apps/web`;
- validate backend Maven commands from `apps/backend`;
- update docs when dependency changes alter commands, config names, or runtime behavior.

[↑ Back to top](#top)

---

## 🛡️ Security scanning <a name="security-scanning"></a>

Trivy now runs in GitHub Actions for both application trees.

Manual examples:

```bash
trivy fs --scanners vuln .
trivy image habbit-runner-web:latest
trivy image habbit-runner-api:latest
```

The workflow scans:
- `apps/web` for frontend code, lockfiles, and Dockerfile misconfigurations;
- `apps/backend` for backend code, Maven metadata, and Dockerfile misconfigurations.

If you extend the automated scanning later, update this doc together with:
- workflow files in `.github/workflows`;
- rollout or remediation instructions;
- any required secrets or SARIF upload steps.

[↑ Back to top](#top)
