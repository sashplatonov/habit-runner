import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(scriptDir, '..');
const repoRoot = path.resolve(webRoot, '..', '..');

const publicRoots = [
  path.join(webRoot, 'src', 'routes'),
  path.join(webRoot, 'src', 'lib', 'components'),
  path.join(webRoot, 'src', 'lib', 'seo'),
  path.join(webRoot, 'src', 'content', 'blog'),
  path.join(webRoot, 'static', 'blog')
];

const ignoredRouteFragments = [
  `${path.sep}routes${path.sep}app${path.sep}`,
  `${path.sep}routes${path.sep}auth${path.sep}`,
  `${path.sep}routes${path.sep}privacy-policy${path.sep}`
];

const forbiddenClaims = [
  /\b(?:rest\s*api|api\s+endpoints?|api\s+writes?|through\s+the\s+api|via\s+api)\b/i,
  /\bJWT\b/i,
  /\b(?:quarkus|postgres(?:ql)?|flyway|sveltekit|typescript|tailwind)\b/i,
  /\bservice worker\b/i,
  /cached application shell/i,
  /\b(?:indexeddb|sqlite)\b/i,
  /\bchanges stay in memory\b/i,
  /\btechnical articles\b/i
];

const datedClaim = /\b2025\b/;
const productImplementationClaim = /\b(?:Habbit Runner.{0,100}\b(?:api|backend|server|cache|storage|pwa|progressive web app|service worker)|(?:api|backend|server|cache|storage|pwa|progressive web app|service worker).{0,100}\bHabbit Runner)\b/i;
const requiredFrontMatter = ['title', 'description', 'publishedAt', 'author', 'keywords', 'coverImage'];
const errors = [];

function collectFiles(root) {
  const entries = fs.readdirSync(root, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const absolute = path.join(root, entry.name);
    if (entry.isDirectory()) return collectFiles(absolute);
    if (!/\.(?:svelte|ts|md|svg)$/.test(entry.name)) return [];
    if (ignoredRouteFragments.some((fragment) => absolute.includes(fragment))) return [];
    return [absolute];
  });
}

function addLineErrors(absolute, content) {
  const relative = path.relative(repoRoot, absolute);
  content.split('\n').forEach((line, index) => {
    if (datedClaim.test(line)) errors.push(`${relative}:${index + 1}: expired year claim 2025`);
    if (productImplementationClaim.test(line)) {
      errors.push(`${relative}:${index + 1}: product implementation detail in public copy`);
    }
    for (const pattern of forbiddenClaims) {
      if (pattern.test(line)) {
        errors.push(`${relative}:${index + 1}: implementation-facing public claim matches ${pattern}`);
      }
    }
  });
}

for (const root of publicRoots) {
  for (const absolute of collectFiles(root)) {
    const content = fs.readFileSync(absolute, 'utf8');
    addLineErrors(absolute, content);
    if (absolute.endsWith('.md')) {
      const frontMatter = content.split(/^---$/m)[1] ?? '';
      for (const key of requiredFrontMatter) {
        if (!new RegExp(`^${key}:\\s*.+$`, 'm').test(frontMatter)) {
          errors.push(`${path.relative(repoRoot, absolute)}: missing required front matter ${key}`);
        }
      }
      const coverMatch = frontMatter.match(/^coverImage:\s*['"]?([^'"\n]+)['"]?\s*$/m);
      if (coverMatch) {
        const coverPath = path.join(webRoot, 'static', coverMatch[1].replace(/^\//, ''));
        if (!fs.existsSync(coverPath)) errors.push(`${path.relative(repoRoot, absolute)}: missing cover asset ${coverMatch[1]}`);
      }
    }
  }
}

if (errors.length > 0) {
  console.error(`Public content check failed with ${errors.length} issue(s):`);
  for (const error of errors) console.error(`- ${error}`);
  process.exitCode = 1;
} else {
  console.log('Public content check passed.');
}
