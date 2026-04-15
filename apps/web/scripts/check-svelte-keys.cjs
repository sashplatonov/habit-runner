#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const svelte = require('svelte/compiler');

const root = path.resolve(__dirname, '..');
const src = path.join(root, 'src');

function collectSvelteFiles(dir) {
  const results = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectSvelteFiles(full));
    } else if (stat.isFile() && full.endsWith('.svelte')) {
      results.push(full);
    }
  }
  return results;
}

function walk(node, cb) {
  if (!node || typeof node !== 'object') return;
  cb(node);
  for (const key of Object.keys(node)) {
    const value = node[key];
    if (Array.isArray(value)) {
      value.forEach((v) => walk(v, cb));
    } else if (value && typeof value === 'object' && value.type) {
      walk(value, cb);
    }
  }
}

function extractSnippet(code, node) {
  const start = node.start != null ? node.start : (node.expression && node.expression.start);
  const end = node.end != null ? node.end : (node.expression && node.expression.end);
  if (start == null || end == null) return '<unknown>';
  return code.slice(start, end);
}

function lineForPos(code, pos) {
  return code.slice(0, pos).split('\n').length;
}

function isUnsafeKeyNode(keyNode) {
  if (!keyNode || !keyNode.type) return false;
  const t = keyNode.type;
  if (t === 'Identifier') return true;
  if (t === 'MemberExpression') {
    const prop = keyNode.property;
    const propName = prop && (prop.name || (prop.value != null && String(prop.value)));
    if (propName === 'id' || propName === 'uid') return false;
    return true;
  }
  // Conservatively treat ObjectExpression / CallExpression as unsafe
  if (t === 'ObjectExpression' || t === 'CallExpression' || t === 'ArrayExpression') return true;
  return false;
}

function analyzeFile(file) {
  const code = fs.readFileSync(file, 'utf8');
  let ast;
  try {
    ast = svelte.parse(code, { filename: file });
  } catch (err) {
    console.error(`Failed to parse ${file}: ${err && err.message}`);
    return [];
  }

  const issues = [];
  const rootNode = ast && (ast.html || ast.instance || ast.module) ? (ast.html || ast.instance || ast.module) : ast;

  walk(rootNode, (node) => {
    if (node.type === 'EachBlock') {
      const keyNode = node.key || node.expression && node.expression.key || null;
      if (!keyNode) return;
      if (isUnsafeKeyNode(keyNode)) {
        const snippet = extractSnippet(code, keyNode);
        const line = keyNode.start != null ? lineForPos(code, keyNode.start) : 1;
        issues.push({ file, line, snippet: snippet.trim() });
      }
    }
  });

  return issues;
}

function main() {
  if (!fs.existsSync(src)) {
    console.error('Source directory not found:', src);
    process.exit(0);
  }

  const files = collectSvelteFiles(src);
  const all = [];
  for (const f of files) {
    const issues = analyzeFile(f);
    for (const it of issues) all.push(it);
  }

  if (all.length === 0) {
    console.log('check-svelte-keys: no issues found');
    process.exit(0);
  }

  console.error('\nFound potential non-unique Svelte each() keys:');
  for (const issue of all) {
    console.error(`- ${path.relative(process.cwd(), issue.file)}:${issue.line} -> ${issue.snippet}`);
    console.error(`  Suggestion: use a stable id or append the index, e.g. (item.id) or (item + '-' + i)`);
  }
  console.error(`\nTotal: ${all.length} issue(s). Treating as failure to enforce fixes.`);
  process.exit(1);
}

main();
