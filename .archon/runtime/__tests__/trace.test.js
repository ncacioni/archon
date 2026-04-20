import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, rmSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import {
  startTrace,
  recordPhase,
  endTrace,
  getStats,
  formatSummary,
  formatTail,
} from '../trace.js';

const __moduleDir = dirname(fileURLToPath(import.meta.url));
const TRACES_DIR = join(__moduleDir, '..', '..', 'traces');

function cleanTraces() {
  if (existsSync(TRACES_DIR)) rmSync(TRACES_DIR, { recursive: true, force: true });
}

function readAllLines() {
  if (!existsSync(TRACES_DIR)) return [];
  const files = readdirSync(TRACES_DIR).filter(f => f.endsWith('.jsonl'));
  const lines = [];
  for (const f of files) {
    lines.push(...readFileSync(join(TRACES_DIR, f), 'utf8').trim().split('\n').filter(Boolean).map(l => JSON.parse(l)));
  }
  return lines;
}

describe('startTrace', () => {
  beforeEach(cleanTraces);
  afterEach(cleanTraces);

  test('returns a non-empty traceId', () => {
    const id = startTrace('build', 'Add JWT auth');
    assert.ok(id && id.length > 0);
  });

  test('creates traces directory on first call', () => {
    startTrace('build');
    assert.ok(existsSync(TRACES_DIR));
  });

  test('appends a start record to JSONL', () => {
    startTrace('build', 'some feature');
    const lines = readAllLines();
    assert.equal(lines.length, 1);
    assert.equal(lines[0].type, 'start');
    assert.equal(lines[0].command, 'build');
    assert.equal(lines[0].args, 'some feature');
  });

  test('start record contains startedAt ISO string', () => {
    startTrace('review');
    const lines = readAllLines();
    assert.ok(lines[0].startedAt.match(/^\d{4}-\d{2}-\d{2}T/));
  });

  test('multiple startTrace calls produce unique traceIds', () => {
    const id1 = startTrace('build');
    const id2 = startTrace('review');
    assert.notEqual(id1, id2);
  });

  test('args defaults to empty string when omitted', () => {
    startTrace('fix');
    const lines = readAllLines();
    assert.equal(lines[0].args, '');
  });
});

describe('recordPhase', () => {
  beforeEach(cleanTraces);
  afterEach(cleanTraces);

  test('appends a phase record', () => {
    const id = startTrace('build');
    recordPhase(id, 'phase-1', 'architect', 'success', { tokens: 500, durationMs: 1200 });
    const lines = readAllLines();
    const phase = lines.find(l => l.type === 'phase');
    assert.ok(phase);
    assert.equal(phase.phase, 'phase-1');
    assert.equal(phase.agent, 'architect');
    assert.equal(phase.outcome, 'success');
    assert.equal(phase.tokens, 500);
    assert.equal(phase.durationMs, 1200);
  });

  test('records phase even for unknown traceId (not in memory)', () => {
    recordPhase('unknown-id', 'phase-1', 'qa', 'skipped', {});
    const lines = readAllLines();
    assert.equal(lines[0].type, 'phase');
  });

  test('defaults tokens and durationMs to 0', () => {
    const id = startTrace('fix');
    recordPhase(id, 'phase-1', 'builder', 'success');
    const lines = readAllLines().find(l => l.type === 'phase');
    assert.equal(lines.tokens, 0);
    assert.equal(lines.durationMs, 0);
  });

  test('multiple phases append in order', () => {
    const id = startTrace('build');
    recordPhase(id, 'phase-1', 'architect', 'success', { tokens: 100 });
    recordPhase(id, 'phase-2', 'security', 'success', { tokens: 200 });
    const phases = readAllLines().filter(l => l.type === 'phase');
    assert.equal(phases.length, 2);
    assert.equal(phases[0].phase, 'phase-1');
    assert.equal(phases[1].phase, 'phase-2');
  });
});

describe('endTrace', () => {
  beforeEach(cleanTraces);
  afterEach(cleanTraces);

  test('appends an end record', () => {
    const id = startTrace('build');
    endTrace(id, 'success');
    const end = readAllLines().find(l => l.type === 'end');
    assert.ok(end);
    assert.equal(end.outcome, 'success');
  });

  test('returns result object with outcome and endedAt', () => {
    const id = startTrace('review');
    const result = endTrace(id, 'failed');
    assert.equal(result.outcome, 'failed');
    assert.ok(result.endedAt);
    assert.equal(result.traceId, id);
  });

  test('totalTokens sums phase tokens', () => {
    const id = startTrace('build');
    recordPhase(id, 'p1', 'architect', 'success', { tokens: 300 });
    recordPhase(id, 'p2', 'builder', 'success', { tokens: 700 });
    const result = endTrace(id, 'success');
    assert.equal(result.totalTokens, 1000);
  });

  test('totalDurationMs sums phase durations', () => {
    const id = startTrace('build');
    recordPhase(id, 'p1', 'spec-writer', 'success', { durationMs: 2000 });
    recordPhase(id, 'p2', 'qa', 'success', { durationMs: 3000 });
    const result = endTrace(id, 'success');
    assert.equal(result.totalDurationMs, 5000);
  });

  test('defaults outcome to success when omitted', () => {
    const id = startTrace('fix');
    endTrace(id);
    const end = readAllLines().find(l => l.type === 'end');
    assert.equal(end.outcome, 'success');
  });

  test('removes trace from active map after end', () => {
    const id = startTrace('build');
    recordPhase(id, 'p1', 'builder', 'success', { tokens: 100 });
    endTrace(id, 'success');
    // second end should still write a record but tokens will be 0 (not in active map)
    const result = endTrace(id, 'success');
    assert.equal(result.totalTokens, 0);
  });
});

describe('getStats', () => {
  beforeEach(cleanTraces);
  afterEach(cleanTraces);

  test('returns zero counts when no traces', () => {
    const stats = getStats(7);
    assert.equal(stats.totalRuns, 0);
    assert.equal(stats.completedRuns, 0);
    assert.equal(stats.successRuns, 0);
  });

  test('counts runs and successes correctly', () => {
    const id1 = startTrace('build');
    endTrace(id1, 'success');
    const id2 = startTrace('review');
    endTrace(id2, 'failed');
    const stats = getStats(7);
    assert.equal(stats.totalRuns, 2);
    assert.equal(stats.completedRuns, 2);
    assert.equal(stats.successRuns, 1);
  });

  test('aggregates tokens per command', () => {
    const id = startTrace('build');
    recordPhase(id, 'p1', 'architect', 'success', { tokens: 500 });
    endTrace(id, 'success');
    const stats = getStats(7);
    assert.equal(stats.byCommand['build'].totalTokens, 500);
  });

  test('agentUsage counts phase invocations', () => {
    const id = startTrace('build');
    recordPhase(id, 'p1', 'architect', 'success', {});
    recordPhase(id, 'p2', 'architect', 'success', {});
    recordPhase(id, 'p3', 'qa', 'success', {});
    endTrace(id, 'success');
    const stats = getStats(7);
    assert.equal(stats.agentUsage['architect'], 2);
    assert.equal(stats.agentUsage['qa'], 1);
  });

  test('days field reflects requested window', () => {
    const stats = getStats(3);
    assert.equal(stats.days, 3);
  });
});

describe('formatSummary', () => {
  beforeEach(cleanTraces);
  afterEach(cleanTraces);

  test('includes header with days', () => {
    const stats = getStats(7);
    const out = formatSummary(stats, 7);
    assert.ok(out.includes('last 7 day'));
  });

  test('includes run counts', () => {
    const id = startTrace('build');
    endTrace(id, 'success');
    const stats = getStats(7);
    const out = formatSummary(stats, 7);
    assert.ok(out.includes('1 started'));
    assert.ok(out.includes('1 succeeded'));
  });

  test('includes command breakdown when present', () => {
    const id = startTrace('fix');
    endTrace(id, 'success');
    const stats = getStats(7);
    const out = formatSummary(stats, 7);
    assert.ok(out.includes('/fix'));
  });

  test('includes agent invocations when present', () => {
    const id = startTrace('build');
    recordPhase(id, 'p1', 'security', 'success', {});
    endTrace(id, 'success');
    const stats = getStats(7);
    const out = formatSummary(stats, 7);
    assert.ok(out.includes('security'));
  });
});

describe('formatTail', () => {
  beforeEach(cleanTraces);
  afterEach(cleanTraces);

  test('returns no-traces message when empty', () => {
    const out = formatTail([], 10);
    assert.ok(out.includes('No completed traces'));
  });

  test('formats completed traces with command and status', () => {
    const id = startTrace('review', 'auth module');
    endTrace(id, 'success');
    const records = readAllLines();
    const out = formatTail(records, 10);
    assert.ok(out.includes('/review'));
    assert.ok(out.includes('✓'));
  });

  test('shows failure mark for failed traces', () => {
    const id = startTrace('build');
    endTrace(id, 'failed');
    const records = readAllLines();
    const out = formatTail(records, 10);
    assert.ok(out.includes('✗'));
  });

  test('respects n limit', () => {
    for (let i = 0; i < 5; i++) {
      const id = startTrace('fix');
      endTrace(id, 'success');
    }
    const records = readAllLines();
    const out = formatTail(records, 3);
    const lines = out.trim().split('\n');
    assert.equal(lines.length, 3);
  });
});
