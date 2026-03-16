# GitHub Automation

<a name="top"></a>

## 📋 Table of Contents

- [Renovate](#renovate)
- [Trivy](#trivy)

---

## 🤖 Renovate <a name="renovate"></a>

Renovate automatically opens PRs for outdated dependencies.

**Config**: `.github/renovate.json`

Renovate groups minor/patch updates and opens individual PRs for major bumps. Review the generated PRs; run `npm run check` before merging.

To test Renovate config locally:
```bash
npx renovate --dry-run --token=$GITHUB_TOKEN
```

[↑ Back to top](#top)

---

## 🛡️ Trivy <a name="trivy"></a>

Trivy scans Docker images and the dependency tree for CVEs.

**Run manually:**
```bash
# Scan the built image
trivy image habbit-runner-web:latest

# Scan filesystem (deps)
trivy fs --scanners vuln .
```

⚠️ Set up a scheduled GitHub Actions workflow to run Trivy on a cron and post results as GitHub Security alerts (SARIF upload).

[↑ Back to top](#top)
