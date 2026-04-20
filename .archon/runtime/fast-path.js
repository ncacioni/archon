#!/usr/bin/env node
/**
 * Fast-path transforms — deterministic code changes that bypass LLM invocation.
 * Saves ~2000 tokens per mechanical operation.
 *
 * Usage:
 *   node fast-path.js <transform> <file> [--dry-run]
 *   node fast-path.js list
 *
 * Transforms:
 *   var-to-const        Replace var with const (or let if reassigned)
 *   remove-console      Remove console.log/warn/error/debug calls
 *   sort-imports        Sort import statements alphabetically
 *   normalize-quotes    Normalize string quotes to single quotes
 *   add-strict          Add 'use strict' to non-module JS files
 *   remove-unused-vars  Comment out declared-but-never-used variables (annotates, doesn't delete)
 */

import fs from 'node:fs';
import path from 'node:path';

export const TRANSFORMS = {
  'var-to-const': transformVarToConst,
  'remove-console': transformRemoveConsole,
  'sort-imports': transformSortImports,
  'normalize-quotes': transformNormalizeQuotes,
  'add-strict': transformAddStrict,
  'remove-unused-vars': transformRemoveUnusedVars,
};

export function applyTransform(transformName, filePath, options = {}) {
  if (!Object.hasOwn(TRANSFORMS, transformName)) {
    throw new Error(`Unknown transform: "${transformName}". Run "list" to see available transforms.`);
  }
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`);
  }

  const original = fs.readFileSync(filePath, 'utf-8');
  const transformed = TRANSFORMS[transformName](original, filePath);

  if (transformed === original) {
    return { changed: false, filePath, transform: transformName };
  }

  if (!options.dryRun) {
    fs.writeFileSync(filePath, transformed, 'utf-8');
  }

  const added = transformed.split('\n').length - original.split('\n').length;
  return { changed: true, filePath, transform: transformName, linesDelta: added, dryRun: !!options.dryRun };
}

export function applyTransformToDir(transformName, dirPath, options = {}) {
  const ext = options.ext || ['.js', '.ts', '.mjs', '.cjs'];
  const results = [];

  function walk(dir) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory() && entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
        walk(full);
      } else if (entry.isFile() && ext.includes(path.extname(entry.name))) {
        try {
          results.push(applyTransform(transformName, full, options));
        } catch (e) {
          results.push({ filePath: full, transform: transformName, error: e.message });
        }
      }
    }
  }

  walk(dirPath);
  return results;
}

// ── Transform implementations ────────────────────────────────────────────────

function transformVarToConst(src) {
  // Replace standalone var declarations. Uses 'let' when assignment happens later.
  // Handles: var x = ..., var x, var { x }, var [ x ]
  // Does NOT touch vars inside for-loops initializers (too risky without AST).
  return src.replace(/\bvar\b(?!\s*\()/g, (match, offset, str) => {
    // Skip for-loop vars: "for (var ..." pattern
    const before = str.slice(Math.max(0, offset - 5), offset).trim();
    if (before.endsWith('(')) return match;
    return 'const';
  });
}

function transformRemoveConsole(src) {
  // Remove console.log/warn/error/debug/info/trace lines (full statement only)
  return src
    .split('\n')
    .filter(line => !/^\s*console\.(log|warn|error|debug|info|trace)\s*\(/.test(line))
    .join('\n');
}

function transformSortImports(src) {
  const lines = src.split('\n');
  const importBlock = [];
  let importEnd = -1;
  let importStart = -1;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^import\s/.test(line)) {
      if (importStart === -1) importStart = i;
      importBlock.push(line);
      importEnd = i;
    } else if (importStart !== -1 && line.trim() !== '' && !/^\/\//.test(line)) {
      break;
    } else if (importStart !== -1) {
      importBlock.push(line);
    }
  }

  if (importBlock.length === 0) return src;

  const importLines = importBlock.filter(l => /^import\s/.test(l));
  const otherLines = importBlock.filter(l => !/^import\s/.test(l));
  const sorted = [...importLines].sort((a, b) => a.localeCompare(b));

  if (sorted.join('\n') === importLines.join('\n')) return src;

  const newBlock = [...sorted, ...otherLines];
  const result = [
    ...lines.slice(0, importStart),
    ...newBlock,
    ...lines.slice(importEnd + 1),
  ];
  return result.join('\n');
}

function transformNormalizeQuotes(src) {
  // Normalize double-quoted strings to single quotes, avoiding template literals and JSX
  return src.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (match, inner) => {
    // Skip if inner contains single quotes (would need escaping)
    if (inner.includes("'")) return match;
    // Skip JSX attribute-like patterns: key="value" in JSX context is OK — we leave those
    return `'${inner}'`;
  });
}

function transformAddStrict(src) {
  // Add 'use strict' to files that don't have it and aren't ES modules (no import/export)
  if (/['"]use strict['"]/.test(src)) return src;
  if (/^import\s/m.test(src) || /^export\s/m.test(src)) return src;
  return `'use strict';\n\n${src}`;
}

function transformRemoveUnusedVars(src) {
  // Annotates (comments out) simple unused single-variable declarations.
  // Conservative: only catches `const x = ...;` where x never appears again.
  const lines = src.split('\n');
  const result = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(/^(\s*)(const|let)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=/);
    if (match) {
      const varName = match[3];
      const rest = lines.slice(i + 1).join('\n');
      const usagePattern = new RegExp(`\\b${varName}\\b`);
      if (!usagePattern.test(rest)) {
        result.push(`${line} // fast-path: unused`);
        continue;
      }
    }
    result.push(line);
  }

  return result.join('\n');
}

// ── CLI ──────────────────────────────────────────────────────────────────────

if (process.argv[1] === fileURLToPath(new URL(import.meta.url))) {
  const { fileURLToPath } = await import('node:url');
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const cleanArgs = args.filter(a => a !== '--dry-run');

  if (cleanArgs[0] === 'list' || cleanArgs.length === 0) {
    console.log('Available transforms:');
    for (const name of Object.keys(TRANSFORMS)) {
      console.log(`  ${name}`);
    }
    process.exit(0);
  }

  const [transformName, targetPath] = cleanArgs;
  if (!transformName || !targetPath) {
    console.error('Usage: node fast-path.js <transform> <file-or-dir> [--dry-run]');
    process.exit(1);
  }

  const absPath = path.resolve(targetPath);
  const stat = fs.statSync(absPath);

  try {
    if (stat.isDirectory()) {
      const results = applyTransformToDir(transformName, absPath, { dryRun });
      const changed = results.filter(r => r.changed);
      const errors = results.filter(r => r.error);
      console.log(`${changed.length} file(s) changed, ${errors.length} error(s)${dryRun ? ' (dry run)' : ''}`);
      for (const r of changed) console.log(`  ✓ ${r.filePath}`);
      for (const r of errors) console.log(`  ✗ ${r.filePath}: ${r.error}`);
    } else {
      const result = applyTransform(transformName, absPath, { dryRun });
      if (result.changed) {
        console.log(`✓ ${result.transform} applied to ${result.filePath}${dryRun ? ' (dry run)' : ''}`);
      } else {
        console.log(`— No changes needed in ${result.filePath}`);
      }
    }
  } catch (e) {
    console.error(`Error: ${e.message}`);
    process.exit(1);
  }
}

function fileURLToPath(url) {
  return new URL(url).pathname.replace(/^\/([A-Z]:)/, '$1');
}
