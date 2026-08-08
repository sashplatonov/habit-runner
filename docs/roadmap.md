# Roadmap

The roadmap is intentionally short and evidence-driven.

## Near term

- Add a real authenticated browser environment for E2E coverage against
  PostgreSQL, alongside the current deterministic stub suite.
- Add export/import only after a documented data-protection contract and tests.
- Verify PWA update and push subscription behavior in a deployed staging origin.

## Later

- Evaluate an explicit OTLP receiver and distributed tracing only when there is
  an operational owner and a measurable debugging benefit.
- Add product analytics dashboards only after privacy, retention, and cardinality
  limits are documented.

Every roadmap item needs an acceptance contract, a rollback path, and a local or
remote verification command before implementation.
