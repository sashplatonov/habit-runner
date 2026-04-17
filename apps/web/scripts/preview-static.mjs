import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(dirname, '..');
const buildDir = path.join(rootDir, 'build');

const args = process.argv.slice(2);

function readArg(name, fallback) {
  const longIndex = args.indexOf(`--${name}`);
  if (longIndex !== -1 && args[longIndex + 1]) {
    return args[longIndex + 1];
  }

  const prefixed = args.find((arg) => arg.startsWith(`--${name}=`));
  if (prefixed) {
    return prefixed.slice(name.length + 3);
  }

  return fallback;
}

const host = readArg('host', '127.0.0.1');
const port = Number(readArg('port', '4173'));

const mimeTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.gif', 'image/gif'],
  ['.html', 'text/html; charset=utf-8'],
  ['.ico', 'image/x-icon'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.map', 'application/json; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.txt', 'text/plain; charset=utf-8'],
  ['.webmanifest', 'application/manifest+json; charset=utf-8'],
  ['.webp', 'image/webp'],
  ['.xml', 'application/xml; charset=utf-8'],
]);

function toBuildPath(urlPath) {
  const normalized = decodeURIComponent(urlPath.split('?')[0]).replace(/\/+/g, '/');
  const cleanPath = normalized === '/' ? '/index.html' : normalized;

  const directFile = path.join(buildDir, cleanPath.replace(/^\//, ''));
  if (existsSync(directFile) && path.extname(directFile)) {
    return directFile;
  }

  const htmlFile = path.join(buildDir, `${cleanPath.replace(/^\//, '')}.html`);
  if (existsSync(htmlFile)) {
    return htmlFile;
  }

  const nestedIndex = path.join(buildDir, cleanPath.replace(/^\//, ''), 'index.html');
  if (existsSync(nestedIndex)) {
    return nestedIndex;
  }

  const fallback = path.join(buildDir, 'index.html');
  return fallback;
}

async function handleRequest(req, res) {
  try {
    const filePath = toBuildPath(req.url ?? '/');
    const ext = path.extname(filePath);
    const body = await fs.readFile(filePath);

    res.writeHead(200, {
      'Content-Type': mimeTypes.get(ext) ?? 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=600',
    });
    res.end(body);
  } catch (error) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Not found');
  }
}

if (!existsSync(buildDir)) {
  console.error('Missing build directory. Run `npm run build` first.');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  void handleRequest(req, res);
});

server.listen(port, host, () => {
  console.log(`Static preview running at http://${host}:${port}`);
});
