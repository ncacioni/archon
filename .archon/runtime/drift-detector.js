#!/usr/bin/env node
/**
 * Drift Detector — detects spec-to-code divergence in Archon projects.
 * Runs before QA phase to catch drift early rather than at the end.
 *
 * Usage:
 *   node drift-detector.js check [--spec <path>] [--src <path>] [--threshold 0.2]
 *   node drift-detector.js check --json
 *
 * Signals detected:
 *   missing_ref    — endpoint/operation in spec but not found in source code
 *   orphaned_spec  — schema/type in spec with no corresponding code definition
 *   scope_creep    — route handlers in code with no corresponding spec entry
 *   naming         — identifiers in spec and code that differ only in casing/format
 *
 * Reads: .claude/scratchpad/spec-*.md, openapi.yml, openapi.yaml, src/**
 * Config: .archon/config.yml drift.threshold (default 0.2 = 20%)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, '..', '..');
const CONFIG_PATH = path.join(__dirname, '..', 'config.yml');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return {};
  try {
    return yaml.load(fs.readFileSync(CONFIG_PATH, 'utf-8').replace(/\r\n/g, '\n')) ?? {};
  } catch { return {}; }
}

// ── Spec reading ──────────────────────────────────────────────────────────────

function findSpecFiles(root) {
  const candidates = [];

  // Scratchpad specs
  const scratchpad = path.join(root, '.claude', 'scratchpad');
  if (fs.existsSync(scratchpad)) {
    for (const f of fs.readdirSync(scratchpad)) {
      if (f.startsWith('spec') && f.endsWith('.md')) {
        candidates.push(path.join(scratchpad, f));
      }
    }
  }

  // OpenAPI files at project root
  for (const name of ['openapi.yml', 'openapi.yaml', 'api.yml', 'api.yaml']) {
    const p = path.join(root, name);
    if (fs.existsSync(p)) candidates.push(p);
  }

  // OpenAPI in common dirs
  for (const dir of ['docs', 'api', 'spec', 'specs']) {
    const d = path.join(root, dir);
    if (fs.existsSync(d)) {
      for (const f of fs.readdirSync(d)) {
        if (/openapi|swagger/.test(f) && /\.(ya?ml|json)$/.test(f)) {
          candidates.push(path.join(d, f));
        }
      }
    }
  }

  return candidates;
}

function extractRoutesFromSpec(specFiles) {
  const routes = new Set();
  const schemas = new Set();

  for (const f of specFiles) {
    const content = fs.readFileSync(f, 'utf-8');

    // OpenAPI paths
    const pathMatches = content.matchAll(/^\s{2}(\/[\w\/{}\-]+):/gm);
    for (const m of pathMatches) routes.add(m[1].toLowerCase());

    // Markdown: code blocks with paths like "GET /users"
    const mdRouteMatches = content.matchAll(/\b(GET|POST|PUT|PATCH|DELETE|HEAD)\s+(\/[\w\/{}\-]+)/gi);
    for (const m of mdRouteMatches) routes.add(m[2].toLowerCase());

    // Schema names from OpenAPI components
    const schemaMatches = content.matchAll(/^\s{4}(\w+):\s*$/gm);
    for (const m of schemaMatches) {
      if (m[1].length > 2 && /^[A-Z]/.test(m[1])) schemas.add(m[1]);
    }

    // TypeScript-style type names from markdown
    const typeMatches = content.matchAll(/\b(interface|type|class|schema)\s+([A-Z]\w+)/g);
    for (const m of typeMatches) schemas.add(m[2]);
  }

  return { routes, schemas };
}

// ── Source reading ────────────────────────────────────────────────────────────

const SOURCE_DIRS = ['src', 'lib', 'app', 'api', 'server', 'backend'];
const SOURCE_EXTS = new Set(['.js', '.ts', '.mjs', '.cjs', '.py', '.go', '.java', '.rb']);

function gatherSourceFiles(root) {
  const files = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build', '__pycache__'].includes(entry.name)) {
        walk(full);
      } else if (entry.isFile() && SOURCE_EXTS.has(path.extname(entry.name))) {
        files.push(full);
      }
    }
  }
  for (const dir of SOURCE_DIRS) walk(path.join(root, dir));
  return files;
}

function extractRoutesFromCode(sourceFiles) {
  const routes = new Set();
  const handlers = new Set();
  const typeNames = new Set();

  const routePatterns = [
    // Express: router.get('/path', ...) or app.post('/path', ...)
    /\.(get|post|put|patch|delete|head)\s*\(\s*['"`](\/[\w\/{}\-:*]+)['"`]/gi,
    // FastAPI: @app.get("/path") or @router.post("/path")
    /@(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*["'](\/[\w\/{}\-:*]+)["']/gi,
    // Go: http.HandleFunc("/path", ...) or r.GET("/path", ...)
    /HandleFunc\s*\(\s*["'`](\/[\w\/{}\-:*]+)["'`]/gi,
    /\.(GET|POST|PUT|PATCH|DELETE)\s*\(\s*["'`](\/[\w\/{}\-:*]+)["'`]/gi,
  ];

  for (const f of sourceFiles) {
    const content = fs.readFileSync(f, 'utf-8');

    for (const pattern of routePatterns) {
      const matches = content.matchAll(pattern);
      for (const m of matches) {
        const route = m[m.length - 1].toLowerCase();
        routes.add(route);
      }
    }

    // Handler/controller function names
    const handlerMatches = content.matchAll(/(?:function|const|class)\s+([A-Z]\w*(?:Controller|Handler|Service|Router))/g);
    for (const m of handlerMatches) handlers.add(m[1]);

    // Type/interface/class names
    const typeMatches = content.matchAll(/(?:interface|type|class)\s+([A-Z]\w+)/g);
    for (const m of typeMatches) typeNames.add(m[1]);
  }

  return { routes, handlers, typeNames };
}

// ── Drift computation ─────────────────────────────────────────────────────────

function normalizeRoute(r) {
  return r.replace(/:\w+/g, '{param}').replace(/\{[^}]+\}/g, '{param}').toLowerCase();
}

function computeDrift(specData, codeData) {
  const signals = [];

  const specRoutes = [...specData.routes].map(normalizeRoute);
  const codeRoutes = [...codeData.routes].map(normalizeRoute);

  // missing_ref: in spec but not in code
  const missingInCode = specRoutes.filter(r => !codeRoutes.some(cr => cr === r || cr.includes(r.replace(/{param}/g, ''))));
  for (const r of missingInCode) {
    signals.push({ type: 'missing_ref', detail: `spec route "${r}" not found in source` });
  }

  // scope_creep: in code but not in spec (only if spec has routes)
  if (specRoutes.length > 0) {
    const extraInCode = codeRoutes.filter(r => !specRoutes.some(sr => sr === r || sr.includes(r.replace(/{param}/g, ''))));
    for (const r of extraInCode) {
      signals.push({ type: 'scope_creep', detail: `code route "${r}" has no spec entry` });
    }
  }

  // orphaned_spec: schema in spec but no type in code
  for (const schema of specData.schemas) {
    const lc = schema.toLowerCase();
    if (![...codeData.typeNames].some(t => t.toLowerCase() === lc || t.toLowerCase().includes(lc))) {
      signals.push({ type: 'orphaned_spec', detail: `spec schema "${schema}" has no code type/interface` });
    }
  }

  // naming: similar names with different casing (potential renames)
  for (const schema of specData.schemas) {
    for (const typeName of codeData.typeNames) {
      const sNorm = schema.replace(/[_-]/g, '').toLowerCase();
      const tNorm = typeName.replace(/[_-]/g, '').toLowerCase();
      if (sNorm !== tNorm && (sNorm.includes(tNorm) || tNorm.includes(sNorm)) && Math.abs(sNorm.length - tNorm.length) < 4) {
        signals.push({ type: 'naming', detail: `spec "${schema}" vs code "${typeName}" — possible rename` });
      }
    }
  }

  const totalChecks = Math.max(1, specRoutes.length + specData.schemas.size);
  const driftScore = signals.length / totalChecks;

  return { signals, driftScore, totalChecks };
}

// ── Public API ────────────────────────────────────────────────────────────────

export function detect(options = {}) {
  const root = options.root ?? PROJECT_ROOT;
  const config = loadConfig();
  const threshold = options.threshold ?? config.drift?.threshold ?? 0.2;

  const specFiles = options.specFiles ?? findSpecFiles(root);
  const sourceFiles = options.sourceFiles ?? gatherSourceFiles(root);

  if (specFiles.length === 0) {
    return { specFiles: [], sourceFiles: sourceFiles.length, signals: [], driftScore: 0, threshold, status: 'no-spec' };
  }

  const specData = extractRoutesFromSpec(specFiles);
  const codeData = extractRoutesFromCode(sourceFiles);
  const { signals, driftScore, totalChecks } = computeDrift(specData, codeData);

  const exceeds = driftScore > threshold;
  const byType = {};
  for (const s of signals) {
    byType[s.type] = (byType[s.type] ?? 0) + 1;
  }

  return {
    specFiles: specFiles.map(f => path.relative(root, f)),
    sourceFiles: sourceFiles.length,
    signals,
    signalsByType: byType,
    driftScore: Math.round(driftScore * 1000) / 1000,
    totalChecks,
    threshold,
    exceeds,
    status: specFiles.length === 0 ? 'no-spec' : exceeds ? 'drift-detected' : 'clean',
  };
}

export function formatReport(result) {
  if (result.status === 'no-spec') {
    return 'Drift check: no spec files found — skipping.';
  }

  const pct = (result.driftScore * 100).toFixed(1);
  const icon = result.exceeds ? '⚠' : '✓';
  const lines = [
    `${icon} Drift check: ${pct}% (threshold: ${(result.threshold * 100).toFixed(0)}%) — ${result.status}`,
    `  Spec files: ${result.specFiles.join(', ')}`,
    `  Source files scanned: ${result.sourceFiles}`,
  ];

  if (result.signals.length > 0) {
    lines.push(`  Signals (${result.signals.length}):`);
    for (const [type, count] of Object.entries(result.signalsByType)) {
      lines.push(`    ${type}: ${count}`);
    }
    if (result.exceeds) {
      lines.push('');
      lines.push('  Details:');
      for (const s of result.signals.slice(0, 10)) {
        lines.push(`    [${s.type}] ${s.detail}`);
      }
      if (result.signals.length > 10) lines.push(`    ... and ${result.signals.length - 10} more`);
    }
  } else {
    lines.push('  No drift signals detected.');
  }

  return lines.join('\n');
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const args = process.argv.slice(2);
  const jsonOutput = args.includes('--json');
  const thresholdIdx = args.indexOf('--threshold');
  const threshold = thresholdIdx !== -1 ? parseFloat(args[thresholdIdx + 1]) : undefined;

  const result = detect({ threshold });

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatReport(result));
    if (result.exceeds) process.exit(1);
  }
}
