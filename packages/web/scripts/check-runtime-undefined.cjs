#!/usr/bin/env node

const path = require('path');
const ts = require('typescript');

const projectRoot = path.resolve(__dirname, '..');
const configPath = ts.findConfigFile(projectRoot, ts.sys.fileExists, 'tsconfig.json');
const HIGH_RISK_DIAGNOSTICS = new Set([2304, 2322, 2345, 2552, 2739, 2740, 2741]);

if (!configPath) {
  console.error('Unable to find packages/web/tsconfig.json');
  process.exit(1);
}

const configFile = ts.readConfigFile(configPath, ts.sys.readFile);

if (configFile.error) {
  reportDiagnostic(configFile.error);
  process.exit(1);
}

const parsedConfig = ts.parseJsonConfigFileContent(configFile.config, ts.sys, projectRoot);
const program = ts.createProgram({
  rootNames: parsedConfig.fileNames,
  options: parsedConfig.options,
});

const unresolvedDiagnostics = ts
  .getPreEmitDiagnostics(program)
  .filter((diagnostic) => diagnostic.file && diagnostic.start != null)
  .filter((diagnostic) => HIGH_RISK_DIAGNOSTICS.has(diagnostic.code))
  .filter((diagnostic) => isInWebSrc(diagnostic.file.fileName))
  .filter((diagnostic) => shouldReportDiagnostic(diagnostic));

if (unresolvedDiagnostics.length === 0) {
  process.exit(0);
}

console.error('High-risk web TypeScript check failed:');
for (const diagnostic of unresolvedDiagnostics) {
  reportDiagnostic(diagnostic);
}
process.exit(1);

function isInWebSrc(fileName) {
  const normalized = fileName.split(path.sep).join('/');
  return normalized.includes('/packages/web/src/') || normalized.startsWith('packages/web/src/');
}

function isTypeOnlyReference(sourceFile, position) {
  let current = sourceFile;

  while (current) {
    const next = ts.forEachChild(current, (node) => {
      if (position >= node.getFullStart() && position < node.getEnd()) {
        return node;
      }
      return undefined;
    });

    if (!next) {
      return false;
    }

    if (
      ts.isTypeNode(next) ||
      ts.isTypeAliasDeclaration(next) ||
      ts.isInterfaceDeclaration(next) ||
      ts.isTypeParameterDeclaration(next) ||
      ts.isExpressionWithTypeArguments(next) ||
      ts.isImportTypeNode(next)
    ) {
      return true;
    }

    current = next;
  }

  return false;
}

function shouldReportDiagnostic(diagnostic) {
  if (diagnostic.code === 2304 || diagnostic.code === 2552) {
    return !isTypeOnlyReference(diagnostic.file, diagnostic.start);
  }
  return true;
}

function reportDiagnostic(diagnostic) {
  if (!diagnostic.file || diagnostic.start == null) {
    console.error(ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
    return;
  }

  const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start);
  const relativePath = path.relative(process.cwd(), diagnostic.file.fileName);
  const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
  console.error(`${relativePath}:${line + 1}:${character + 1} TS${diagnostic.code} ${message}`);
}
