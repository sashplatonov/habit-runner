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
- `.github/workflows/quality.yml` with backend verify, PostgreSQL integration,
  frontend verification, Trivy security scans, and a bounded Compose smoke job

The current checkout now treats Trivy as an active CI gate rather than a manual-only check.

The quality workflow first classifies changed paths. Frontend and shared-package changes run
frontend checks; backend, migration, and OpenAPI changes run backend and PostgreSQL checks;
security-sensitive application and workflow changes run Trivy. Compose smoke remains reserved
for backend, runtime, Docker/Compose, CI-script, workflow, and OpenAPI changes. Documentation-only
changes continue to be ignored by the workflow trigger. Workflow changes themselves select every
dependent lane so the classifier cannot hide a broken gate.

All jobs keep the existing cancellation, timeout, Maven/npm caches, and three-day failure-artifact
retention. Local checks validate the decision table, but actual GitHub-hosted minute savings must
be measured from fresh pushed workflow runs.

The Compose smoke job runs [`scripts/ci/smoke-stack.sh`](../../scripts/ci/smoke-stack.sh)
after the build and test jobs. The script uses `.env.example`, builds both images,
waits for PostgreSQL/Flyway and container health, checks API liveness/readiness,
checks the web container and its `/api` proxy, and always removes the stack and
database volume with a shell trap. The OpenAPI snapshot drift check remains in
the backend verification job and is a prerequisite of the smoke job.

Local smoke verification:

```bash
./scripts/ci/smoke-stack.sh
```

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
- `apps/backend` for backend code, secrets, and Dockerfile misconfigurations while skipping `pom.xml` to avoid network-dependent Maven resolution.

If you extend the automated scanning later, update this doc together with:
- workflow files in `.github/workflows`;
- rollout or remediation instructions;
- any required secrets or SARIF upload steps.

[↑ Back to top](#top)
