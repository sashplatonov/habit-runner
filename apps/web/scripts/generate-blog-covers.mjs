import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(dirname, '..');
const contentDir = path.join(rootDir, 'src', 'content', 'blog');
const outputDir = path.join(rootDir, 'static', 'blog');

const SANS_STACK = "'Avenir Next', 'Segoe UI', 'Trebuchet MS', sans-serif";
const SERIF_STACK = "'Iowan Old Style', Georgia, 'Times New Roman', serif";

const palettes = {
  tide: {
    bgFrom: '#f6efe6',
    bgTo: '#ebf5ff',
    orb1: '#38bdf8',
    orb2: '#2dd4bf',
    orb3: '#f59e0b',
    panelFrom: '#081225',
    panelTo: '#162843',
    accent: '#0ea5e9',
    secondary: '#14b8a6',
    tertiary: '#fb7185',
    ink: '#0f172a',
  },
  ember: {
    bgFrom: '#fff3ec',
    bgTo: '#fff7d8',
    orb1: '#fb7185',
    orb2: '#f59e0b',
    orb3: '#f97316',
    panelFrom: '#231815',
    panelTo: '#4b2a20',
    accent: '#f97316',
    secondary: '#fb7185',
    tertiary: '#facc15',
    ink: '#1f2937',
  },
  moss: {
    bgFrom: '#edf8f0',
    bgTo: '#eefcf9',
    orb1: '#22c55e',
    orb2: '#14b8a6',
    orb3: '#84cc16',
    panelFrom: '#0d1f1b',
    panelTo: '#1b3b34',
    accent: '#22c55e',
    secondary: '#14b8a6',
    tertiary: '#f59e0b',
    ink: '#0f172a',
  },
  dusk: {
    bgFrom: '#f8f1ff',
    bgTo: '#eef3ff',
    orb1: '#8b5cf6',
    orb2: '#ec4899',
    orb3: '#22c55e',
    panelFrom: '#17122f',
    panelTo: '#2c1b52',
    accent: '#8b5cf6',
    secondary: '#ec4899',
    tertiary: '#34d399',
    ink: '#111827',
  },
  slate: {
    bgFrom: '#f4f7fb',
    bgTo: '#eef4ff',
    orb1: '#94a3b8',
    orb2: '#38bdf8',
    orb3: '#c084fc',
    panelFrom: '#0f172a',
    panelTo: '#1e293b',
    accent: '#38bdf8',
    secondary: '#a78bfa',
    tertiary: '#22c55e',
    ink: '#0f172a',
  },
  sunrise: {
    bgFrom: '#fff1e7',
    bgTo: '#fff9e9',
    orb1: '#fb923c',
    orb2: '#facc15',
    orb3: '#38bdf8',
    panelFrom: '#27170f',
    panelTo: '#4a2815',
    accent: '#fb923c',
    secondary: '#facc15',
    tertiary: '#38bdf8',
    ink: '#1f2937',
  },
};

const coverPresets = {
  'best-habit-tracker-for-privacy': {
    palette: 'slate',
    motif: 'vault',
    eyebrow: 'privacy systems',
    hero: ['Private', 'By Design'],
    tags: ['local data', 'no trackers'],
  },
  'habit-tracker-for-adhd': {
    palette: 'ember',
    motif: 'orbit',
    eyebrow: 'focus systems',
    hero: ['Focus', 'Without', 'Overwhelm'],
    tags: ['cue-based', 'one habit'],
  },
  'best-offline-habit-tracker': {
    palette: 'tide',
    motif: 'device',
    eyebrow: 'offline-first guide',
    hero: ['Offline', 'By Default'],
    tags: ['local-first', 'sync later'],
  },
  'habit-tracker-without-internet': {
    palette: 'tide',
    motif: 'signal',
    eyebrow: 'resilient tracking',
    hero: ['Airplane', 'Mode Ready'],
    tags: ['no wi-fi', 'always works'],
  },
  'how-to-recover-after-breaking-streak': {
    palette: 'moss',
    motif: 'bridge',
    eyebrow: 'streak recovery',
    hero: ['Start', 'Again', 'Today'],
    tags: ['gentle restart', 'keep going'],
  },
  'best-habit-tracker-pwa': {
    palette: 'slate',
    motif: 'device',
    eyebrow: 'installable apps',
    hero: ['Install', 'and Go'],
    tags: ['no app store', 'cross-device'],
  },
  'best-streak-tracker-apps': {
    palette: 'dusk',
    motif: 'chain',
    eyebrow: 'tool comparison',
    hero: ['Streaks', 'Worth', 'Keeping'],
    tags: ['compare tools', 'real momentum'],
  },
  'no-signup-habit-tracker': {
    palette: 'sunrise',
    motif: 'window',
    eyebrow: 'low-friction apps',
    hero: ['No Sign-Up', 'No Delay'],
    tags: ['open instantly', 'zero forms'],
  },
  'why-habit-tracking-stops-working': {
    palette: 'dusk',
    motif: 'plateau',
    eyebrow: 'system refresh',
    hero: ['When Systems', 'Go Flat'],
    tags: ['plateau', 'reset'],
  },
  'local-first-productivity-apps': {
    palette: 'slate',
    motif: 'vault',
    eyebrow: 'local-first software',
    hero: ['Your Data', 'Lives Here'],
    tags: ['on-device', 'ownership'],
  },
  'habit-tracker-for-students': {
    palette: 'moss',
    motif: 'window',
    eyebrow: 'student routines',
    hero: ['Routines', 'Between', 'Classes'],
    tags: ['flexible schedule', 'study load'],
  },
  'why-productivity-systems-fail': {
    palette: 'ember',
    motif: 'knot',
    eyebrow: 'productivity design',
    hero: ['Less', 'Actually', 'Works'],
    tags: ['reduce noise', 'stay durable'],
  },
  'why-streaks-break': {
    palette: 'sunrise',
    motif: 'breakpoint',
    eyebrow: 'streak design',
    hero: ['Why Chains', 'Snap'],
    tags: ['friction', 'interruption'],
  },
  'minimalist-habit-tracker': {
    palette: 'slate',
    motif: 'orbit',
    eyebrow: 'minimal systems',
    hero: ['Quiet', 'Progress'],
    tags: ['low noise', 'clear loop'],
  },
  'how-to-stop-abandoning-habits': {
    palette: 'ember',
    motif: 'route',
    eyebrow: 'habit design',
    hero: ['Design It', 'To Last'],
    tags: ['less friction', 'small steps'],
  },
  'how-to-build-habit-streak': {
    palette: 'dusk',
    motif: 'chain',
    eyebrow: 'long-term repetition',
    hero: ['Build', 'Momentum'],
    tags: ['repeatable', 'resilient'],
  },
  'how-to-stay-consistent-with-habits': {
    palette: 'moss',
    motif: 'route',
    eyebrow: 'consistency systems',
    hero: ['Consistency', 'In Motion'],
    tags: ['busy weeks', 'backup plan'],
  },
  'habit-tracker-for-busy-parents': {
    palette: 'sunrise',
    motif: 'window',
    eyebrow: 'family routines',
    hero: ['Small Wins', 'Still Count'],
    tags: ['low energy', 'realistic'],
  },
  'why-morning-routine-falls-apart': {
    palette: 'sunrise',
    motif: 'window',
    eyebrow: 'morning routines',
    hero: ['Morning', 'Friction'],
    tags: ['too much', 'too soon'],
  },
  'how-to-start-evening-routine': {
    palette: 'dusk',
    motif: 'window',
    eyebrow: 'evening routines',
    hero: ['Wind Down', 'With Intention'],
    tags: ['sleep cue', 'lighter pace'],
  },
  'habit-tracker-no-account': {
    palette: 'slate',
    motif: 'window',
    eyebrow: 'instant access',
    hero: ['Track', 'Without Setup'],
    tags: ['no login', 'just start'],
  },
  'what-to-do-when-motivation-disappears': {
    palette: 'ember',
    motif: 'ribbon',
    eyebrow: 'low-motivation days',
    hero: ['Keep Going', 'Anyway'],
    tags: ['minimum dose', 'keep the loop'],
  },
  'how-to-track-habits-without-obsessing': {
    palette: 'moss',
    motif: 'orbit',
    eyebrow: 'healthy tracking',
    hero: ['Track', 'Lightly'],
    tags: ['keep perspective', 'less noise'],
  },
  'how-to-track-habits-while-traveling': {
    palette: 'tide',
    motif: 'route',
    eyebrow: 'travel routines',
    hero: ['Keep The', 'Loop Alive'],
    tags: ['offline travel', 'minimal version'],
  },
  'offline-vs-cloud-habit-tracker': {
    palette: 'tide',
    motif: 'split',
    eyebrow: 'decision guide',
    hero: ['Local', 'or Cloud?'],
    tags: ['privacy', 'multi-device'],
  },
  'habit-tracker-inconsistent-schedule': {
    palette: 'moss',
    motif: 'route',
    eyebrow: 'flexible routines',
    hero: ['Flexible', 'Rhythms'],
    tags: ['shift work', 'variable days'],
  },
  'how-to-build-consistent-morning-routine': {
    palette: 'sunrise',
    motif: 'window',
    eyebrow: 'morning design',
    hero: ['Three Habits', 'Maximum'],
    tags: ['cue stack', 'realistic'],
  },
};

const motifBounds = {
  device: { minX: 110, maxX: 390, minY: 40, maxY: 426 },
  signal: { minX: 72, maxX: 390, minY: 84, maxY: 386 },
  bridge: { minX: 66, maxX: 652, minY: 154, maxY: 422 },
  chain: { minX: 60, maxX: 686, minY: 142, maxY: 330 },
  orbit: { minX: 96, maxX: 526, minY: 84, maxY: 414 },
  window: { minX: 92, maxX: 554, minY: 84, maxY: 354 },
  route: { minX: 92, maxX: 556, minY: 64, maxY: 360 },
  knot: { minX: 116, maxX: 592, minY: 84, maxY: 392 },
  split: { minX: 120, maxX: 512, minY: 94, maxY: 372 },
  plateau: { minX: 92, maxX: 558, minY: 92, maxY: 384 },
  ribbon: { minX: 86, maxX: 676, minY: 92, maxY: 352 },
  vault: { minX: 144, maxX: 556, minY: 94, maxY: 378 },
  breakpoint: { minX: 70, maxX: 850, minY: 98, maxY: 286 },
};

function hexToRgba(hex, alpha) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized;
  const red = Number.parseInt(value.slice(0, 2), 16);
  const green = Number.parseInt(value.slice(2, 4), 16);
  const blue = Number.parseInt(value.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

function escapeXml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function wrapText(value, maxChars, maxLines = Number.POSITIVE_INFINITY) {
  const words = value.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (!current || candidate.length <= maxChars) {
      current = candidate;
      continue;
    }

    lines.push(current);
    current = word;
  }

  if (current) {
    lines.push(current);
  }

  if (lines.length <= maxLines) {
    return lines;
  }

  const trimmed = lines.slice(0, maxLines);
  trimmed[maxLines - 1] = `${trimmed[maxLines - 1].replace(/\.*$/, '')}...`;
  return trimmed;
}

function parseFrontmatter(raw) {
  const lines = raw.split(/\r?\n/);

  if (lines[0]?.trim() !== '---') {
    throw new Error('Expected frontmatter block');
  }

  const values = {};

  for (let index = 1; index < lines.length; index += 1) {
    const line = lines[index];
    if (line.trim() === '---') {
      break;
    }

    const match = line.match(/^([A-Za-z0-9_]+):\s*(.*)$/);
    if (!match) {
      continue;
    }

    const [, key, rawValue] = match;
    values[key] = rawValue.replace(/^"|"$/g, '');
  }

  return values;
}

function renderTextLines(lines, x, y, lineHeight) {
  return lines
    .map((line, index) => `<tspan x="${x}" dy="${index === 0 ? 0 : lineHeight}">${escapeXml(line)}</tspan>`)
    .join('');
}

function renderTags(tags, palette) {
  let cursor = 88;

  return tags.map((tag) => {
    const width = 28 + tag.length * 9;
    const chip = `
      <g transform="translate(${cursor} 430)">
        <rect width="${width}" height="34" rx="17" fill="${hexToRgba(palette.ink, 0.05)}" stroke="${hexToRgba(palette.ink, 0.08)}" />
        <circle cx="18" cy="17" r="4" fill="${palette.accent}" />
        <text x="30" y="22" fill="${palette.ink}" font-family="${SANS_STACK}" font-size="14" font-weight="600">${escapeXml(tag)}</text>
      </g>`;
    cursor += width + 12;
    return chip;
  }).join('');
}

function renderDeviceMotif(palette) {
  return `
    <circle cx="334" cy="120" r="68" fill="${hexToRgba(palette.secondary, 0.16)}" />
    <circle cx="120" cy="380" r="58" fill="${hexToRgba(palette.tertiary, 0.18)}" />
    <rect x="110" y="40" width="220" height="386" rx="34" fill="${hexToRgba('#06111f', 0.88)}" stroke="${hexToRgba('#ffffff', 0.22)}" />
    <rect x="126" y="58" width="188" height="348" rx="26" fill="${hexToRgba('#030712', 0.88)}" />
    <rect x="174" y="68" width="92" height="10" rx="5" fill="${hexToRgba('#ffffff', 0.18)}" />
    <rect x="146" y="96" width="76" height="28" rx="14" fill="${hexToRgba(palette.accent, 0.18)}" stroke="${hexToRgba(palette.accent, 0.42)}" />
    <circle cx="164" cy="110" r="5" fill="${palette.accent}" />
    <text x="178" y="115" fill="#dbeafe" font-family="${SANS_STACK}" font-size="12" font-weight="700">today</text>
    <rect x="146" y="146" width="148" height="44" rx="18" fill="${hexToRgba(palette.accent, 0.22)}" />
    <rect x="162" y="160" width="78" height="8" rx="4" fill="#eff6ff" opacity="0.9" />
    <rect x="162" y="174" width="102" height="6" rx="3" fill="#dbeafe" opacity="0.65" />
    <circle cx="276" cy="168" r="11" fill="${palette.secondary}" />
    <rect x="146" y="204" width="148" height="44" rx="18" fill="${hexToRgba(palette.secondary, 0.2)}" />
    <rect x="162" y="218" width="68" height="8" rx="4" fill="#ecfeff" opacity="0.92" />
    <rect x="162" y="232" width="108" height="6" rx="3" fill="#d1fae5" opacity="0.65" />
    <circle cx="276" cy="226" r="11" fill="${palette.tertiary}" />
    <rect x="146" y="274" width="148" height="88" rx="24" fill="${hexToRgba('#ffffff', 0.06)}" stroke="${hexToRgba('#ffffff', 0.16)}" />
    <path d="M176 338 C192 296 228 282 252 252 C278 286 300 306 314 338" fill="none" stroke="${hexToRgba(palette.tertiary, 0.88)}" stroke-width="16" stroke-linecap="round" />
    <circle cx="252" cy="252" r="24" fill="${hexToRgba(palette.accent, 0.2)}" stroke="${hexToRgba(palette.accent, 0.5)}" stroke-width="2" />
    <circle cx="252" cy="252" r="9" fill="${palette.accent}" />
  `;
}

function renderSignalMotif(palette) {
  return `
    <path d="M72 334 C116 266 166 218 224 198 C280 178 326 134 360 84" fill="none" stroke="${hexToRgba(palette.accent, 0.82)}" stroke-width="16" stroke-linecap="round" />
    <path d="M84 362 C132 294 188 246 244 228 C294 212 338 176 388 108" fill="none" stroke="${hexToRgba(palette.secondary, 0.72)}" stroke-width="8" stroke-dasharray="10 18" stroke-linecap="round" />
    <circle cx="84" cy="362" r="24" fill="${hexToRgba(palette.tertiary, 0.18)}" stroke="${hexToRgba(palette.tertiary, 0.55)}" stroke-width="2" />
    <circle cx="84" cy="362" r="8" fill="${palette.tertiary}" />
    <circle cx="214" cy="212" r="22" fill="${hexToRgba(palette.secondary, 0.18)}" stroke="${hexToRgba(palette.secondary, 0.48)}" stroke-width="2" />
    <circle cx="214" cy="212" r="8" fill="${palette.secondary}" />
    <circle cx="360" cy="84" r="26" fill="${hexToRgba(palette.accent, 0.18)}" stroke="${hexToRgba(palette.accent, 0.48)}" stroke-width="2" />
    <circle cx="360" cy="84" r="8" fill="${palette.accent}" />
    <path d="M309 300 a58 58 0 0 1 82 0" fill="none" stroke="${hexToRgba('#ffffff', 0.28)}" stroke-width="8" stroke-linecap="round" />
    <path d="M320 326 a42 42 0 0 1 60 0" fill="none" stroke="${hexToRgba('#ffffff', 0.34)}" stroke-width="8" stroke-linecap="round" />
    <path d="M332 350 a26 26 0 0 1 36 0" fill="none" stroke="${hexToRgba('#ffffff', 0.4)}" stroke-width="8" stroke-linecap="round" />
    <line x1="312" y1="284" x2="390" y2="366" stroke="${hexToRgba(palette.tertiary, 0.8)}" stroke-width="8" stroke-linecap="round" />
    <rect x="80" y="84" width="108" height="64" rx="20" fill="${hexToRgba('#ffffff', 0.08)}" stroke="${hexToRgba('#ffffff', 0.18)}" />
    <text x="104" y="118" fill="#eff6ff" font-family="${SANS_STACK}" font-size="14" font-weight="700">signal</text>
  `;
}

function renderBridgeMotif(palette) {
  return `
    <ellipse cx="110" cy="250" rx="44" ry="28" fill="none" stroke="${hexToRgba('#ffffff', 0.34)}" stroke-width="16" />
    <line x1="154" y1="250" x2="208" y2="250" stroke="${hexToRgba('#ffffff', 0.32)}" stroke-width="10" stroke-linecap="round" />
    <ellipse cx="248" cy="250" rx="44" ry="28" fill="none" stroke="${hexToRgba('#ffffff', 0.22)}" stroke-width="16" />
    <circle cx="288" cy="250" r="22" fill="${hexToRgba(palette.tertiary, 0.16)}" />
    <path d="M282 244 L294 256 M294 244 L282 256" stroke="${palette.tertiary}" stroke-width="4" stroke-linecap="round" />
    <path d="M322 218 C356 162 390 154 422 198" fill="none" stroke="${hexToRgba(palette.tertiary, 0.86)}" stroke-width="10" stroke-linecap="round" />
    <ellipse cx="362" cy="218" rx="44" ry="28" fill="none" stroke="${hexToRgba(palette.accent, 0.82)}" stroke-width="16" />
    <line x1="406" y1="218" x2="444" y2="218" stroke="${hexToRgba(palette.accent, 0.86)}" stroke-width="10" stroke-linecap="round" />
    <ellipse cx="486" cy="218" rx="44" ry="28" fill="none" stroke="${hexToRgba(palette.secondary, 0.8)}" stroke-width="16" />
    <line x1="530" y1="218" x2="566" y2="218" stroke="${hexToRgba(palette.secondary, 0.74)}" stroke-width="10" stroke-linecap="round" />
    <ellipse cx="608" cy="218" rx="44" ry="28" fill="none" stroke="${hexToRgba(palette.secondary, 0.74)}" stroke-width="16" />
    <rect x="188" y="328" width="248" height="94" rx="26" fill="${hexToRgba('#ffffff', 0.08)}" stroke="${hexToRgba('#ffffff', 0.18)}" />
    <text x="218" y="362" fill="#ecfeff" font-family="${SANS_STACK}" font-size="16" font-weight="700">recovery rules</text>
    <rect x="218" y="378" width="146" height="8" rx="4" fill="${hexToRgba('#ffffff', 0.5)}" />
    <rect x="218" y="396" width="124" height="8" rx="4" fill="${hexToRgba('#ffffff', 0.36)}" />
  `;
}

function renderChainMotif(palette) {
  return `
    <ellipse cx="108" cy="250" rx="48" ry="30" fill="none" stroke="${hexToRgba('#ffffff', 0.24)}" stroke-width="18" />
    <line x1="154" y1="250" x2="212" y2="250" stroke="${hexToRgba('#ffffff', 0.22)}" stroke-width="10" stroke-linecap="round" />
    <ellipse cx="264" cy="250" rx="52" ry="32" fill="none" stroke="${hexToRgba(palette.accent, 0.72)}" stroke-width="18" />
    <line x1="314" y1="250" x2="374" y2="250" stroke="${hexToRgba(palette.accent, 0.74)}" stroke-width="10" stroke-linecap="round" />
    <ellipse cx="432" cy="250" rx="60" ry="36" fill="none" stroke="${hexToRgba(palette.secondary, 0.82)}" stroke-width="20" />
    <line x1="490" y1="250" x2="552" y2="250" stroke="${hexToRgba(palette.secondary, 0.78)}" stroke-width="12" stroke-linecap="round" />
    <ellipse cx="620" cy="250" rx="72" ry="44" fill="none" stroke="${hexToRgba(palette.tertiary, 0.84)}" stroke-width="24" />
    <circle cx="656" cy="172" r="30" fill="${hexToRgba(palette.tertiary, 0.18)}" />
    <path d="M656 154 C650 168 640 178 646 192 C650 200 654 204 656 210 C658 204 662 200 666 192 C672 178 662 168 656 154Z" fill="${palette.tertiary}" />
    <text x="108" y="316" fill="${hexToRgba('#ffffff', 0.48)}" font-family="${SANS_STACK}" font-size="18" font-weight="700" text-anchor="middle">day 1</text>
    <text x="264" y="316" fill="${hexToRgba(palette.accent, 0.76)}" font-family="${SANS_STACK}" font-size="18" font-weight="700" text-anchor="middle">day 7</text>
    <text x="432" y="320" fill="${hexToRgba(palette.secondary, 0.86)}" font-family="${SANS_STACK}" font-size="18" font-weight="700" text-anchor="middle">day 21</text>
    <text x="620" y="330" fill="${hexToRgba(palette.tertiary, 0.86)}" font-family="${SANS_STACK}" font-size="20" font-weight="700" text-anchor="middle">day 100</text>
  `;
}

function renderOrbitMotif(palette) {
  return `
    <circle cx="350" cy="236" r="152" fill="none" stroke="${hexToRgba(palette.secondary, 0.22)}" stroke-width="2" />
    <circle cx="350" cy="236" r="122" fill="none" stroke="${hexToRgba(palette.secondary, 0.34)}" stroke-width="3" />
    <circle cx="350" cy="236" r="92" fill="none" stroke="${hexToRgba(palette.accent, 0.48)}" stroke-width="4" />
    <circle cx="350" cy="236" r="62" fill="${hexToRgba(palette.accent, 0.18)}" stroke="${hexToRgba(palette.accent, 0.72)}" stroke-width="6" />
    <circle cx="350" cy="236" r="44" fill="${palette.accent}" />
    <text x="350" y="228" fill="#ffffff" font-family="${SANS_STACK}" font-size="14" font-weight="700" text-anchor="middle">ONE</text>
    <text x="350" y="248" fill="#ffffff" font-family="${SANS_STACK}" font-size="14" font-weight="700" text-anchor="middle">THING</text>
    <g fill="${hexToRgba('#ffffff', 0.42)}" font-family="${SANS_STACK}" font-size="14" font-weight="600">
      <text x="118" y="120">email</text>
      <text x="510" y="120">alerts</text>
      <text x="96" y="356">noise</text>
      <text x="514" y="356">scrolling</text>
      <text x="196" y="410">too much</text>
      <text x="442" y="414">clutter</text>
    </g>
    <circle cx="248" cy="120" r="11" fill="${hexToRgba(palette.tertiary, 0.68)}" />
    <circle cx="492" cy="288" r="12" fill="${hexToRgba(palette.secondary, 0.72)}" />
    <circle cx="238" cy="348" r="10" fill="${hexToRgba(palette.accent, 0.8)}" />
  `;
}

function renderWindowMotif(palette) {
  return `
    <rect x="92" y="84" width="168" height="270" rx="30" fill="${hexToRgba('#ffffff', 0.08)}" stroke="${hexToRgba('#ffffff', 0.18)}" />
    <rect x="278" y="114" width="142" height="220" rx="28" fill="${hexToRgba('#ffffff', 0.08)}" stroke="${hexToRgba('#ffffff', 0.18)}" />
    <rect x="434" y="160" width="120" height="176" rx="26" fill="${hexToRgba('#ffffff', 0.08)}" stroke="${hexToRgba('#ffffff', 0.18)}" />
    <circle cx="146" cy="136" r="22" fill="${hexToRgba(palette.accent, 0.2)}" />
    <path d="M132 136 h28 M146 122 v28" stroke="${palette.accent}" stroke-width="5" stroke-linecap="round" />
    <rect x="122" y="180" width="108" height="12" rx="6" fill="${hexToRgba('#ffffff', 0.68)}" />
    <rect x="122" y="206" width="88" height="10" rx="5" fill="${hexToRgba('#ffffff', 0.38)}" />
    <rect x="122" y="230" width="112" height="10" rx="5" fill="${hexToRgba('#ffffff', 0.38)}" />
    <rect x="122" y="260" width="86" height="52" rx="18" fill="${hexToRgba(palette.secondary, 0.18)}" />
    <path d="M320 158 a32 32 0 0 1 64 0" fill="none" stroke="${hexToRgba(palette.secondary, 0.82)}" stroke-width="8" stroke-linecap="round" />
    <circle cx="352" cy="188" r="10" fill="${palette.secondary}" />
    <rect x="306" y="226" width="86" height="10" rx="5" fill="${hexToRgba('#ffffff', 0.64)}" />
    <rect x="306" y="248" width="102" height="10" rx="5" fill="${hexToRgba('#ffffff', 0.36)}" />
    <rect x="306" y="272" width="76" height="10" rx="5" fill="${hexToRgba('#ffffff', 0.36)}" />
    <circle cx="492" cy="206" r="18" fill="${hexToRgba(palette.tertiary, 0.22)}" />
    <path d="M482 206 L490 214 L504 198" fill="none" stroke="${palette.tertiary}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
    <rect x="462" y="246" width="66" height="8" rx="4" fill="${hexToRgba('#ffffff', 0.62)}" />
    <rect x="462" y="264" width="54" height="8" rx="4" fill="${hexToRgba('#ffffff', 0.34)}" />
  `;
}

function renderRouteMotif(palette) {
  return `
    <path d="M92 342 C142 252 226 270 254 214 C286 152 348 168 382 112 C412 64 504 96 556 160" fill="none" stroke="${hexToRgba(palette.accent, 0.86)}" stroke-width="14" stroke-linecap="round" />
    <path d="M92 342 C142 252 226 270 254 214 C286 152 348 168 382 112 C412 64 504 96 556 160" fill="none" stroke="${hexToRgba('#ffffff', 0.42)}" stroke-width="4" stroke-linecap="round" stroke-dasharray="2 18" />
    <circle cx="92" cy="342" r="18" fill="${hexToRgba(palette.tertiary, 0.2)}" stroke="${hexToRgba(palette.tertiary, 0.6)}" stroke-width="2" />
    <circle cx="92" cy="342" r="6" fill="${palette.tertiary}" />
    <circle cx="254" cy="214" r="18" fill="${hexToRgba(palette.secondary, 0.2)}" stroke="${hexToRgba(palette.secondary, 0.56)}" stroke-width="2" />
    <circle cx="254" cy="214" r="6" fill="${palette.secondary}" />
    <circle cx="382" cy="112" r="18" fill="${hexToRgba(palette.accent, 0.2)}" stroke="${hexToRgba(palette.accent, 0.58)}" stroke-width="2" />
    <circle cx="382" cy="112" r="6" fill="${palette.accent}" />
    <rect x="128" y="112" width="118" height="58" rx="20" fill="${hexToRgba('#ffffff', 0.08)}" stroke="${hexToRgba('#ffffff', 0.18)}" />
    <rect x="144" y="130" width="72" height="10" rx="5" fill="${hexToRgba('#ffffff', 0.68)}" />
    <rect x="144" y="148" width="58" height="8" rx="4" fill="${hexToRgba('#ffffff', 0.36)}" />
    <rect x="420" y="252" width="124" height="74" rx="22" fill="${hexToRgba('#ffffff', 0.08)}" stroke="${hexToRgba('#ffffff', 0.18)}" />
    <circle cx="454" cy="290" r="12" fill="${hexToRgba(palette.tertiary, 0.28)}" />
    <path d="M450 290 h8 M454 286 v8" stroke="${palette.tertiary}" stroke-width="3" stroke-linecap="round" />
    <rect x="476" y="278" width="42" height="10" rx="5" fill="${hexToRgba('#ffffff', 0.62)}" />
    <rect x="476" y="296" width="56" height="8" rx="4" fill="${hexToRgba('#ffffff', 0.34)}" />
  `;
}

function renderKnotMotif(palette) {
  return `
    <path d="M116 164 C168 94 262 112 248 190 C236 258 146 254 158 322 C170 384 270 390 314 318" fill="none" stroke="${hexToRgba(palette.secondary, 0.82)}" stroke-width="18" stroke-linecap="round" />
    <path d="M162 138 C220 84 332 110 338 202 C344 292 216 316 234 392" fill="none" stroke="${hexToRgba(palette.accent, 0.78)}" stroke-width="12" stroke-linecap="round" />
    <path d="M366 316 C414 296 452 270 484 238 C514 208 548 184 592 172" fill="none" stroke="${hexToRgba('#ffffff', 0.58)}" stroke-width="12" stroke-linecap="round" />
    <rect x="416" y="250" width="164" height="112" rx="30" fill="${hexToRgba('#ffffff', 0.08)}" stroke="${hexToRgba('#ffffff', 0.18)}" />
    <rect x="446" y="284" width="84" height="12" rx="6" fill="${hexToRgba('#ffffff', 0.72)}" />
    <rect x="446" y="306" width="112" height="10" rx="5" fill="${hexToRgba('#ffffff', 0.38)}" />
    <rect x="446" y="328" width="96" height="10" rx="5" fill="${hexToRgba('#ffffff', 0.38)}" />
    <circle cx="562" cy="286" r="14" fill="${hexToRgba(palette.tertiary, 0.24)}" />
    <path d="M554 286 L560 292 L570 280" fill="none" stroke="${palette.tertiary}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
  `;
}

function renderSplitMotif(palette) {
  return `
    <rect x="120" y="94" width="178" height="278" rx="30" fill="${hexToRgba('#08111f', 0.72)}" stroke="${hexToRgba('#ffffff', 0.18)}" />
    <rect x="314" y="94" width="198" height="278" rx="30" fill="${hexToRgba('#ffffff', 0.08)}" stroke="${hexToRgba('#ffffff', 0.18)}" />
    <path d="M306 104 v258" stroke="${hexToRgba('#ffffff', 0.18)}" stroke-width="3" stroke-dasharray="3 12" />
    <circle cx="210" cy="176" r="56" fill="${hexToRgba(palette.accent, 0.18)}" stroke="${hexToRgba(palette.accent, 0.5)}" stroke-width="2" />
    <rect x="174" y="150" width="72" height="52" rx="16" fill="${hexToRgba('#0f172a', 0.8)}" stroke="${hexToRgba('#ffffff', 0.16)}" />
    <rect x="188" y="166" width="44" height="6" rx="3" fill="#dbeafe" />
    <rect x="188" y="180" width="30" height="6" rx="3" fill="#bfdbfe" opacity="0.72" />
    <text x="210" y="250" fill="#dbeafe" font-family="${SANS_STACK}" font-size="18" font-weight="700" text-anchor="middle">local</text>
    <path d="M386 150 C406 126 454 126 472 154 C494 156 510 170 510 192 C510 216 490 230 468 230 H390 C360 230 338 212 338 188 C338 166 356 150 380 150Z" fill="${hexToRgba('#ffffff', 0.12)}" stroke="${hexToRgba('#ffffff', 0.22)}" />
    <circle cx="382" cy="286" r="12" fill="${hexToRgba(palette.secondary, 0.22)}" />
    <circle cx="432" cy="330" r="12" fill="${hexToRgba(palette.accent, 0.22)}" />
    <circle cx="482" cy="286" r="12" fill="${hexToRgba(palette.tertiary, 0.22)}" />
    <path d="M382 286 L432 330 L482 286" fill="none" stroke="${hexToRgba('#ffffff', 0.5)}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
    <text x="424" y="250" fill="#f8fafc" font-family="${SANS_STACK}" font-size="18" font-weight="700" text-anchor="middle">cloud</text>
  `;
}

function renderPlateauMotif(palette) {
  return `
    <rect x="92" y="92" width="466" height="292" rx="30" fill="${hexToRgba('#ffffff', 0.06)}" stroke="${hexToRgba('#ffffff', 0.18)}" />
    <path d="M132 314 L132 126" stroke="${hexToRgba('#ffffff', 0.2)}" stroke-width="2" />
    <path d="M132 314 H526" stroke="${hexToRgba('#ffffff', 0.2)}" stroke-width="2" />
    <path d="M156 286 C206 254 240 220 280 178 C318 138 356 146 392 190 C428 234 462 236 516 236" fill="none" stroke="${hexToRgba(palette.accent, 0.86)}" stroke-width="12" stroke-linecap="round" />
    <path d="M392 190 C428 234 462 236 516 236" fill="none" stroke="${hexToRgba(palette.tertiary, 0.78)}" stroke-width="12" stroke-linecap="round" />
    <circle cx="280" cy="178" r="14" fill="${hexToRgba(palette.secondary, 0.28)}" />
    <circle cx="280" cy="178" r="6" fill="${palette.secondary}" />
    <circle cx="516" cy="236" r="14" fill="${hexToRgba(palette.tertiary, 0.28)}" />
    <circle cx="516" cy="236" r="6" fill="${palette.tertiary}" />
    <rect x="166" y="128" width="98" height="44" rx="18" fill="${hexToRgba(palette.secondary, 0.18)}" />
    <text x="194" y="156" fill="#ecfeff" font-family="${SANS_STACK}" font-size="14" font-weight="700">lift-off</text>
    <rect x="410" y="144" width="100" height="44" rx="18" fill="${hexToRgba(palette.tertiary, 0.18)}" />
    <text x="438" y="172" fill="#fef3c7" font-family="${SANS_STACK}" font-size="14" font-weight="700">flatline</text>
  `;
}

function renderRibbonMotif(palette) {
  return `
    <path d="M86 320 C132 212 196 154 284 138 C354 126 420 150 500 220 C560 274 620 290 676 258" fill="none" stroke="${hexToRgba(palette.secondary, 0.9)}" stroke-width="42" stroke-linecap="round" />
    <path d="M104 332 C154 244 214 198 286 188 C366 176 426 202 496 260 C546 300 602 314 652 292" fill="none" stroke="${hexToRgba(palette.accent, 0.9)}" stroke-width="18" stroke-linecap="round" />
    <circle cx="180" cy="194" r="20" fill="${hexToRgba('#ffffff', 0.18)}" stroke="${hexToRgba('#ffffff', 0.3)}" stroke-width="2" />
    <path d="M172 194 h16 M180 186 v16" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
    <circle cx="566" cy="302" r="20" fill="${hexToRgba('#ffffff', 0.18)}" stroke="${hexToRgba('#ffffff', 0.3)}" stroke-width="2" />
    <path d="M558 302 h16" stroke="#ffffff" stroke-width="4" stroke-linecap="round" />
    <rect x="394" y="92" width="158" height="62" rx="22" fill="${hexToRgba('#ffffff', 0.08)}" stroke="${hexToRgba('#ffffff', 0.18)}" />
    <text x="426" y="130" fill="#fff7ed" font-family="${SANS_STACK}" font-size="18" font-weight="700">minimum viable effort</text>
  `;
}

function renderVaultMotif(palette) {
  return `
    <circle cx="350" cy="226" r="132" fill="${hexToRgba(palette.accent, 0.12)}" stroke="${hexToRgba(palette.accent, 0.2)}" stroke-width="2" />
    <circle cx="350" cy="226" r="94" fill="${hexToRgba('#08111f', 0.6)}" stroke="${hexToRgba('#ffffff', 0.22)}" stroke-width="3" />
    <circle cx="350" cy="226" r="58" fill="${hexToRgba('#ffffff', 0.08)}" stroke="${hexToRgba('#ffffff', 0.22)}" stroke-width="2" />
    <path d="M350 184 a30 30 0 0 1 30 30 v24 h-60 v-24 a30 30 0 0 1 30 -30Z" fill="${hexToRgba(palette.secondary, 0.18)}" stroke="${hexToRgba(palette.secondary, 0.56)}" stroke-width="2" />
    <rect x="318" y="214" width="64" height="54" rx="18" fill="${hexToRgba('#0f172a', 0.88)}" stroke="${hexToRgba('#ffffff', 0.16)}" />
    <circle cx="350" cy="240" r="8" fill="${palette.secondary}" />
    <rect x="346" y="240" width="8" height="16" rx="4" fill="${palette.secondary}" />
    <rect x="144" y="112" width="124" height="72" rx="24" fill="${hexToRgba('#ffffff', 0.08)}" stroke="${hexToRgba('#ffffff', 0.18)}" />
    <text x="176" y="144" fill="#eff6ff" font-family="${SANS_STACK}" font-size="16" font-weight="700">stored on device</text>
    <rect x="432" y="306" width="124" height="72" rx="24" fill="${hexToRgba('#ffffff', 0.08)}" stroke="${hexToRgba('#ffffff', 0.18)}" />
    <text x="464" y="338" fill="#eff6ff" font-family="${SANS_STACK}" font-size="16" font-weight="700">private by default</text>
  `;
}

function renderBreakpointMotif(palette) {
  return `
    <ellipse cx="120" cy="220" rx="50" ry="30" fill="none" stroke="${hexToRgba('#ffffff', 0.34)}" stroke-width="18" />
    <line x1="168" y1="220" x2="232" y2="220" stroke="${hexToRgba('#ffffff', 0.32)}" stroke-width="10" stroke-linecap="round" />
    <ellipse cx="286" cy="220" rx="52" ry="32" fill="none" stroke="${hexToRgba('#ffffff', 0.34)}" stroke-width="18" />
    <line x1="334" y1="220" x2="398" y2="220" stroke="${hexToRgba('#ffffff', 0.2)}" stroke-width="10" stroke-linecap="round" />
    <ellipse cx="452" cy="220" rx="52" ry="32" fill="none" stroke="${hexToRgba('#ffffff', 0.2)}" stroke-width="18" />
    <circle cx="516" cy="220" r="26" fill="${hexToRgba(palette.tertiary, 0.18)}" />
    <path d="M508 212 L524 228 M524 212 L508 228" stroke="${palette.tertiary}" stroke-width="4" stroke-linecap="round" />
    <path d="M584 156 C620 110 670 110 704 156" fill="none" stroke="${hexToRgba(palette.secondary, 0.82)}" stroke-width="12" stroke-linecap="round" />
    <ellipse cx="622" cy="220" rx="60" ry="36" fill="none" stroke="${hexToRgba(palette.secondary, 0.86)}" stroke-width="20" />
    <line x1="678" y1="220" x2="734" y2="220" stroke="${hexToRgba(palette.secondary, 0.76)}" stroke-width="12" stroke-linecap="round" />
    <ellipse cx="790" cy="220" rx="60" ry="36" fill="none" stroke="${hexToRgba(palette.secondary, 0.72)}" stroke-width="20" />
    <text x="286" y="286" fill="${hexToRgba('#ffffff', 0.54)}" font-family="${SANS_STACK}" font-size="18" font-weight="700" text-anchor="middle">missed</text>
    <text x="706" y="110" fill="${hexToRgba(palette.secondary, 0.84)}" font-family="${SANS_STACK}" font-size="18" font-weight="700" text-anchor="middle">start again</text>
  `;
}

function renderMotif(preset, palette) {
  switch (preset.motif) {
    case 'device':
      return renderDeviceMotif(palette);
    case 'signal':
      return renderSignalMotif(palette);
    case 'bridge':
      return renderBridgeMotif(palette);
    case 'chain':
      return renderChainMotif(palette);
    case 'orbit':
      return renderOrbitMotif(palette);
    case 'window':
      return renderWindowMotif(palette);
    case 'route':
      return renderRouteMotif(palette);
    case 'knot':
      return renderKnotMotif(palette);
    case 'split':
      return renderSplitMotif(palette);
    case 'plateau':
      return renderPlateauMotif(palette);
    case 'ribbon':
      return renderRibbonMotif(palette);
    case 'vault':
      return renderVaultMotif(palette);
    case 'breakpoint':
      return renderBreakpointMotif(palette);
    default:
      throw new Error(`Unknown motif: ${preset.motif}`);
  }
}

function getMotifPlacement(motifName) {
  const bounds = motifBounds[motifName];

  if (!bounds) {
    throw new Error(`Missing motif bounds for: ${motifName}`);
  }

  const artArea = {
    x: 700,
    y: 154,
    width: 404,
    height: 322,
  };
  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;
  const scale = Math.min(artArea.width / width, artArea.height / height, 1);
  const offsetX = artArea.x + (artArea.width - width * scale) / 2 - bounds.minX * scale;
  const offsetY = artArea.y + (artArea.height - height * scale) / 2 - bounds.minY * scale;

  return {
    scale,
    x: offsetX,
    y: offsetY,
  };
}

function renderCover(post, preset) {
  const palette = palettes[preset.palette];

  if (!palette) {
    throw new Error(`Unknown palette: ${preset.palette}`);
  }

  const heroLines = preset.hero;
  const heroSize = heroLines.length >= 3 ? 62 : 74;
  const heroLineHeight = heroLines.length >= 3 ? 64 : 72;
  const titleLines = wrapText(post.title, 30, 3);
  const titleFontSize = titleLines.length >= 3 ? 18 : 20;
  const titleLineHeight = titleLines.length >= 3 ? 24 : 26;
  const titleY = 526 - (titleLines.length - 1) * 28;
  const footerY = 572;
  const motif = renderMotif(preset, palette);
  const motifPlacement = getMotifPlacement(preset.motif);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-label="${escapeXml(post.title)}">
  <defs>
    <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
      <path d="M48 0H0V48" fill="none" stroke="${hexToRgba(palette.ink, 0.07)}" stroke-width="1" />
    </pattern>
    <filter id="shadowSoft" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="20" stdDeviation="24" flood-color="#0f172a" flood-opacity="0.12" />
    </filter>
    <filter id="shadowBoard" x="-20%" y="-20%" width="140%" height="150%">
      <feDropShadow dx="0" dy="24" stdDeviation="28" flood-color="#0f172a" flood-opacity="0.16" />
    </filter>
    <clipPath id="boardClip">
      <rect x="664" y="74" width="476" height="482" rx="42" />
    </clipPath>
  </defs>

  <rect width="1200" height="630" fill="${palette.bgFrom}" />
  <path d="M0 500 H1200" stroke="${hexToRgba(palette.ink, 0.1)}" stroke-width="2" />
  <path d="M620 0 V630" stroke="${hexToRgba(palette.ink, 0.08)}" stroke-width="2" />

  <rect x="56" y="56" width="560" height="518" rx="40" fill="${hexToRgba('#ffffff', 0.74)}" stroke="${hexToRgba(palette.ink, 0.08)}" filter="url(#shadowSoft)" />

  <rect x="88" y="84" width="190" height="38" rx="19" fill="${hexToRgba('#ffffff', 0.88)}" stroke="${hexToRgba(palette.ink, 0.08)}" />
  <circle cx="112" cy="103" r="8" fill="${palette.accent}" />
  <text x="130" y="109" fill="${palette.ink}" font-family="${SANS_STACK}" font-size="13" font-weight="700" letter-spacing="0.18em">HABBIT RUNNER BLOG</text>

  <text x="88" y="152" fill="${hexToRgba(palette.ink, 0.56)}" font-family="${SANS_STACK}" font-size="14" font-weight="700" letter-spacing="0.24em">${escapeXml(preset.eyebrow.toUpperCase())}</text>

  <text x="88" y="226" fill="${palette.ink}" font-family="${SERIF_STACK}" font-size="${heroSize}" font-weight="700">${renderTextLines(heroLines, 88, 226, heroLineHeight)}</text>

  ${renderTags(preset.tags, palette)}

  <text x="88" y="${titleY}" fill="${hexToRgba(palette.ink, 0.72)}" font-family="${SANS_STACK}" font-size="${titleFontSize}" font-weight="600">${renderTextLines(titleLines, 88, titleY, titleLineHeight)}</text>
  <text x="88" y="${footerY}" fill="${hexToRgba(palette.ink, 0.4)}" font-family="${SANS_STACK}" font-size="14" font-weight="700" letter-spacing="0.08em">EDITORIAL COVER / ${escapeXml(post.slug.toUpperCase())}</text>

  <g filter="url(#shadowBoard)">
    <rect x="664" y="74" width="476" height="482" rx="42" fill="${palette.panelFrom}" stroke="${hexToRgba('#ffffff', 0.22)}" />
  </g>
  <rect x="694" y="104" width="132" height="34" rx="17" fill="${hexToRgba('#ffffff', 0.08)}" stroke="${hexToRgba('#ffffff', 0.14)}" />
  <text x="720" y="126" fill="#f8fafc" font-family="${SANS_STACK}" font-size="13" font-weight="700" letter-spacing="0.1em">${escapeXml(preset.eyebrow)}</text>
  <g clip-path="url(#boardClip)">
    <g transform="translate(${motifPlacement.x} ${motifPlacement.y}) scale(${motifPlacement.scale})">${motif}</g>
  </g>
</svg>`;
}

async function loadPosts() {
  const fileNames = await fs.readdir(contentDir);

  return Promise.all(
    fileNames
      .filter((fileName) => fileName.endsWith('.md'))
      .sort((left, right) => left.localeCompare(right))
      .map(async (fileName) => {
        const slug = fileName.replace(/\.md$/, '');
        const raw = await fs.readFile(path.join(contentDir, fileName), 'utf8');
        const frontmatter = parseFrontmatter(raw);

        if (!frontmatter.title) {
          throw new Error(`Missing title in ${fileName}`);
        }

        return {
          slug,
          title: frontmatter.title,
        };
      })
  );
}

async function main() {
  const posts = await loadPosts();
  const missingPresets = posts.filter((post) => !coverPresets[post.slug]).map((post) => post.slug);

  if (missingPresets.length > 0) {
    throw new Error(`Missing cover presets for: ${missingPresets.join(', ')}`);
  }

  await fs.mkdir(outputDir, { recursive: true });

  await Promise.all(posts.map(async (post) => {
    const svg = renderCover(post, coverPresets[post.slug]);
    await fs.writeFile(path.join(outputDir, `${post.slug}.svg`), `${svg}\n`, 'utf8');
  }));

  console.log(`Generated ${posts.length} blog covers in ${outputDir}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
