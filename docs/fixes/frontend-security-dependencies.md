# Frontend security dependency patches

CI Release run [38371732153](https://github.com/sashplatonov/habit-runner/actions/runs/38371732153) failed in the frontend Trivy scan. The Git history secret scan and backend scan passed. The frontend report identified four HIGH advisories in devalue 5.9.0 and one in source-map-js 1.2.1.

The web lock file now resolves:
- devalue 5.9.4, above the reported fixed version 5.9.3;
- source-map-js 1.2.2;
- brace-expansion 2.1.7 and 5.0.12;
- fast-uri 3.1.8.

The additional brace-expansion and fast-uri patches address HIGH advisories found by npm audit while validating the CI fix. All updates stay within existing dependency ranges. No direct dependency, security gate, ignore list, environment variable, or database schema changes are required.

Risk: these transitive patches affect serialization, source maps, build tooling, and lint tooling. Validate frontend checks, build, and unit tests before release. Rollback by reverting this commit and reinstalling with npm ci; doing so restores the vulnerable versions.


Verification also exposed a timing-sensitive callback test: it required an exact URL without a query string, although restoring saved sort and density correctly adds query parameters. The assertion now checks the dashboard pathname and retains the explicit sort/density control assertions.

Local validation:
- Trivy 0.70.0, with the frontend CI scanner settings and a current vulnerability database: no HIGH/CRITICAL vulnerability, secret, or misconfiguration findings.
- npm audit --audit-level=high: passed; 15 lower-severity findings remain (five low, ten moderate).
- npm run check:web: passed, including lint, shared-package checks, type checks, and production build.
- npm run test: 310 tests passed.
- Five session/workspace Playwright scenarios passed with the mocked API; the updated test also passed ESLint.

The remote workflow must run again after this change is pushed; a local scanner result is not a new GitHub Actions result.
