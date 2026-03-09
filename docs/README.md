# 📚 Habbit Runner Documentation

Welcome to the project documentation hub.  
Use this page as your entry point and navigate deeper by topic.

## 📑 Table of Contents

1. [🚀 Getting Started](./getting-started.md)
2. [🏗️ Architecture Overview](./architecture.md)
3. [🔄 Offline Sync Plan](./offline-sync-plan.md)
4. [🛡️ Reliability and Rollout](./reliability-rollout.md)
5. [🤖 GitHub Automation (Renovate + Trivy)](./github-automation.md)
6. [🧹 Project Health Review](./project-health.md)

## 🧭 Suggested Reading Path

1. Start with [🚀 Getting Started](./getting-started.md)
2. Continue with [🏗️ Architecture Overview](./architecture.md)
3. Dive into [🔄 Offline Sync Plan](./offline-sync-plan.md)
4. Finish with [🛡️ Reliability and Rollout](./reliability-rollout.md)
5. Configure [🤖 GitHub Automation (Renovate + Trivy)](./github-automation.md)
6. Review [🧹 Project Health Review](./project-health.md) for cleanup decisions

## ✅ Daily Quality Workflow

1. Run `npm run lint`
2. Run `npm run test --workspace=@habbit-runner/web`
3. Run `npm run build`
4. Before backend schema-related changes, run `cd packages/server && npx prisma generate`

## ↕️ Navigation

- Deep dive first topic: [🚀 Getting Started](./getting-started.md)
- Back to repository root: [⬅️ Root README](../README.md)
