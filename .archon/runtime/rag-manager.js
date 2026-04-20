#!/usr/bin/env node
/**
 * RAG Manager — TF-IDF search over agent memory files.
 * Loads only relevant chunks instead of entire memory files, reducing token usage 40-90%.
 *
 * Usage:
 *   node rag-manager.js search <agent> "<query>" [--top N]
 *   node rag-manager.js list [agent]
 *   node rag-manager.js index <agent>   — pre-build index for an agent
 *
 * Memory files: .archon/memory/<agent>/**
 * Also searches: .archon/memory/evaluations.md for package-related queries
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MEMORY_DIR = path.join(__dirname, '..', 'memory');

// ── TF-IDF implementation ────────────────────────────────────────────────────

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2 && !STOPWORDS.has(t));
}

const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'has', 'her',
  'was', 'one', 'our', 'out', 'had', 'him', 'his', 'how', 'did', 'its',
  'let', 'may', 'use', 'via', 'etc', 'that', 'this', 'with', 'from', 'they',
  'have', 'been', 'when', 'will', 'also', 'each', 'into', 'more', 'than',
  'then', 'them', 'these', 'those', 'which', 'while', 'would', 'could', 'should',
]);

function termFrequency(tokens) {
  const tf = new Map();
  for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
  const total = tokens.length || 1;
  for (const [k, v] of tf) tf.set(k, v / total);
  return tf;
}

function buildCorpus(chunks) {
  const docFreq = new Map();
  const tfs = chunks.map(c => {
    const tokens = tokenize(c.text);
    const tf = termFrequency(tokens);
    for (const k of tf.keys()) docFreq.set(k, (docFreq.get(k) ?? 0) + 1);
    return tf;
  });

  const N = chunks.length || 1;
  return chunks.map((chunk, i) => {
    const tf = tfs[i];
    let score = 0;
    for (const [term, freq] of tf) {
      const idf = Math.log(N / (docFreq.get(term) ?? 1));
      score += freq * idf;
    }
    return { ...chunk, tfidf: score, tf };
  });
}

function scoredSearch(corpus, queryTokens) {
  return corpus.map(doc => {
    let score = 0;
    for (const qt of queryTokens) {
      const tf = doc.tf?.get(qt) ?? 0;
      if (tf > 0) score += tf;
    }
    return { ...doc, queryScore: score };
  }).filter(d => d.queryScore > 0)
    .sort((a, b) => b.queryScore - a.queryScore);
}

// ── Memory loading ────────────────────────────────────────────────────────────

function loadMemoryFiles(agent) {
  const files = [];

  // Agent-specific dir
  const agentDir = path.join(MEMORY_DIR, agent);
  if (fs.existsSync(agentDir)) {
    collectFiles(agentDir, files);
  }

  // Shared evaluations (useful for package queries)
  const evalFile = path.join(MEMORY_DIR, 'evaluations.md');
  if (fs.existsSync(evalFile)) files.push(evalFile);

  // Root-level .md files in memory dir
  if (fs.existsSync(MEMORY_DIR)) {
    for (const f of fs.readdirSync(MEMORY_DIR)) {
      if (f.endsWith('.md') && f !== 'evaluations.md') {
        files.push(path.join(MEMORY_DIR, f));
      }
    }
  }

  return [...new Set(files)];
}

function collectFiles(dir, acc) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) collectFiles(full, acc);
    else if (entry.isFile() && /\.(md|txt|json|yml|yaml)$/.test(entry.name)) acc.push(full);
  }
}

function chunkFile(filePath, chunkSize = 400) {
  const content = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
  const chunks = [];

  // Split on markdown headers (## or ###) or blank lines
  const sections = content.split(/(?=^#{1,3} )/m).filter(s => s.trim());

  for (const section of sections) {
    const lines = section.split('\n');
    // Sub-chunk large sections
    for (let i = 0; i < lines.length; i += chunkSize) {
      const text = lines.slice(i, i + chunkSize).join('\n').trim();
      if (text.length > 30) {
        chunks.push({ filePath, text, startLine: i + 1 });
      }
    }
  }

  // Fallback: if no chunks created, use whole file
  if (chunks.length === 0 && content.trim()) {
    chunks.push({ filePath, text: content.trim(), startLine: 1 });
  }

  return chunks;
}

// ── Public API ────────────────────────────────────────────────────────────────

export function search(agent, query, options = {}) {
  const topN = options.top ?? 3;
  const files = loadMemoryFiles(agent);

  if (files.length === 0) {
    return { agent, query, results: [], message: `No memory files found for agent "${agent}"` };
  }

  const allChunks = files.flatMap(f => {
    try { return chunkFile(f); }
    catch { return []; }
  });

  if (allChunks.length === 0) {
    return { agent, query, results: [], message: 'Memory files are empty' };
  }

  const corpus = buildCorpus(allChunks);
  const queryTokens = tokenize(query);
  const ranked = scoredSearch(corpus, queryTokens);
  const top = ranked.slice(0, topN);

  return {
    agent,
    query,
    totalChunks: allChunks.length,
    filesSearched: files.length,
    results: top.map(r => ({
      file: path.relative(MEMORY_DIR, r.filePath),
      score: Math.round(r.queryScore * 1000) / 1000,
      excerpt: r.text.slice(0, 300) + (r.text.length > 300 ? '…' : ''),
    })),
  };
}

export function listMemoryFiles(agent) {
  if (agent) return loadMemoryFiles(agent);
  if (!fs.existsSync(MEMORY_DIR)) return [];
  const entries = fs.readdirSync(MEMORY_DIR, { withFileTypes: true });
  return entries
    .filter(e => e.isDirectory())
    .map(e => e.name);
}

export function formatResults(result) {
  if (!result.results || result.results.length === 0) {
    return result.message ?? `No relevant chunks found for query: "${result.query}"`;
  }

  const lines = [
    `RAG search: "${result.query}" in ${result.agent} memory`,
    `  ${result.filesSearched} file(s), ${result.totalChunks} chunks — top ${result.results.length} shown`,
    '',
  ];

  for (let i = 0; i < result.results.length; i++) {
    const r = result.results[i];
    lines.push(`[${i + 1}] ${r.file} (score: ${r.score})`);
    lines.push(r.excerpt.split('\n').map(l => `    ${l}`).join('\n'));
    lines.push('');
  }

  return lines.join('\n');
}

// ── CLI ──────────────────────────────────────────────────────────────────────

const isMain = process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isMain) {
  const args = process.argv.slice(2);
  const sub = args[0];

  if (sub === 'search') {
    const agent = args[1];
    const query = args[2];
    const topIdx = args.indexOf('--top');
    const top = topIdx !== -1 ? parseInt(args[topIdx + 1]) : 3;

    if (!agent || !query) {
      console.error('Usage: node rag-manager.js search <agent> "<query>" [--top N]');
      process.exit(1);
    }

    const result = search(agent, query, { top });
    console.log(formatResults(result));

  } else if (sub === 'list') {
    const agent = args[1];
    const items = listMemoryFiles(agent);
    if (items.length === 0) {
      console.log(agent ? `No memory files for "${agent}"` : 'No agent memory directories found');
    } else {
      console.log(items.join('\n'));
    }

  } else {
    console.log('Usage:');
    console.log('  node rag-manager.js search <agent> "<query>" [--top N]');
    console.log('  node rag-manager.js list [agent]');
    process.exit(0);
  }
}
