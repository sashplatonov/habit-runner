These PNGs are reproducible captures of the anonymous `/showcase` fixture.

Regenerate them from a local production preview:

```bash
cd apps/web
npm run build
npm run preview -- --host 127.0.0.1 --port 4173
SCREENSHOT_BASE_URL=http://127.0.0.1:4173 node scripts/capture-showcase-screenshots.mjs
```

`desktop.png` (1440×900) and `mobile.png` (390×844) are declared in the web-app manifest. The
remaining images document the habit detail and progress screens for README and
repository social previews.
