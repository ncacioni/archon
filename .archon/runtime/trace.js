import { readFileSync, writeFileSync, mkdirSync, readdirSync, appendFileSync } from 'fs';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __moduleDir = dirname(fileURLToPath(import.meta.url));
const TRACES_DIR = join(__moduleDir, '..', 'traces');

function ensureTracesDir() {
  if (!existsSync(TRACES_DIR)) mkdirSync(TRACES_DIR, { recursive: true });
}

function todayFile() {
  const d = new Date().toISOString().slice(0, 10);
  return join(TRACES_DIR, `trace-${d}.jsonl`);
}

function appendRecord(record) {
  ensureTracesDir();
  appendFileSync(todayFile(), JSON.stringify(record) + '\n', 'utf8');
}

function readTraceFiles(days = 7) {
  if (!existsSync(TRACES_DIR)) return [];
  const cutoff = new Date();
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const files = readdirSync(TRACES_DIR)
    .filter(f => f.match(/^trace-\d{4}-\d{2}-\d{2}\.jsonl$/))
    .filter(f => {
      const d = new Date(f.slice(6, 16));
      return d >= cutoff;
    });
  const records = [];
  for (const f of files) {
    const lines = readFileSync(join(TRACES_DIR, f), 'utf8').trim().split('\n').filter(Boolean);
    for (const line of lines) {
      try { records.push(JSON.parse(line)); } catch {}
    }
  }
  return records;
}

const activeTraces = new Map();

export function startTrace(command, args = '') {
  const traceId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const trace = {
    traceId,
    command,
    args,
    startedAt: new Date().toISOString(),
    phases: [],
  };
  activeTraces.set(traceId, trace);
  appendRecord({ type: 'start', traceId, command, args, startedAt: trace.startedAt });
  return traceId;
}

export function recordPhase(traceId, phase, agent, outcome, { tokens = 0, durationMs = 0 } = {}) {
  const trace = activeTraces.get(traceId);
  const record = { type: 'phase', traceId, phase, agent, outcome, tokens, durationMs, recordedAt: new Date().toISOString() };
  if (trace) trace.phases.push({ phase, agent, outcome, tokens, durationMs });
  appendRecord(record);
}

export function endTrace(traceId, outcome = 'success') {
  const trace = activeTraces.get(traceId);
  const endedAt = new Date().toISOString();
  let totalTokens = 0;
  let totalDurationMs = 0;
  if (trace) {
    for (const p of trace.phases) {
      totalTokens += p.tokens || 0;
      totalDurationMs += p.durationMs || 0;
    }
    activeTraces.delete(traceId);
  }
  appendRecord({ type: 'end', traceId, outcome, totalTokens, totalDurationMs, endedAt });
  return { traceId, outcome, totalTokens, totalDurationMs, endedAt };
}

export function getStats(days = 7) {
  const records = readTraceFiles(days);
  const starts = records.filter(r => r.type === 'start');
  const ends = records.filter(r => r.type === 'end');
  const phases = records.filter(r => r.type === 'phase');

  const endMap = new Map(ends.map(e => [e.traceId, e]));

  const byCommand = {};
  for (const s of starts) {
    const e = endMap.get(s.traceId);
    if (!e) continue;
    const cmd = s.command;
    if (!byCommand[cmd]) byCommand[cmd] = { count: 0, success: 0, failed: 0, totalTokens: 0, totalDurationMs: 0 };
    byCommand[cmd].count++;
    if (e.outcome === 'success') byCommand[cmd].success++;
    else byCommand[cmd].failed++;
    byCommand[cmd].totalTokens += e.totalTokens || 0;
    byCommand[cmd].totalDurationMs += e.totalDurationMs || 0;
  }

  const totalRuns = starts.length;
  const completedRuns = ends.length;
  const successRuns = ends.filter(e => e.outcome === 'success').length;
  const totalTokens = ends.reduce((s, e) => s + (e.totalTokens || 0), 0);
  const totalDurationMs = ends.reduce((s, e) => s + (e.totalDurationMs || 0), 0);

  const agentUsage = {};
  for (const p of phases) {
    agentUsage[p.agent] = (agentUsage[p.agent] || 0) + 1;
  }

  return { days, totalRuns, completedRuns, successRuns, totalTokens, totalDurationMs, byCommand, agentUsage };
}

export function formatSummary(stats, days) {
  const d = days ?? stats.days;
  const lines = [`Trace summary — last ${d} day(s)`, ''];
  lines.push(`Runs: ${stats.totalRuns} started, ${stats.completedRuns} completed, ${stats.successRuns} succeeded`);
  lines.push(`Tokens: ${stats.totalTokens.toLocaleString()} total`);
  lines.push(`Duration: ${(stats.totalDurationMs / 1000).toFixed(1)}s total`);

  if (Object.keys(stats.byCommand).length > 0) {
    lines.push('');
    lines.push('By command:');
    for (const [cmd, s] of Object.entries(stats.byCommand)) {
      const avgTokens = s.count > 0 ? Math.round(s.totalTokens / s.count) : 0;
      lines.push(`  /${cmd}  ${s.count} runs  ${s.success} ok / ${s.failed} failed  avg ${avgTokens.toLocaleString()} tokens`);
    }
  }

  if (Object.keys(stats.agentUsage).length > 0) {
    lines.push('');
    lines.push('Agent invocations:');
    const sorted = Object.entries(stats.agentUsage).sort((a, b) => b[1] - a[1]);
    for (const [agent, count] of sorted) {
      lines.push(`  ${agent}: ${count}`);
    }
  }

  return lines.join('\n');
}

export function formatTail(records, n = 10) {
  const ends = records.filter(r => r.type === 'end').slice(-n);
  if (ends.length === 0) return 'No completed traces found.';
  const startMap = new Map(records.filter(r => r.type === 'start').map(r => [r.traceId, r]));
  const lines = [];
  for (const e of ends) {
    const s = startMap.get(e.traceId);
    const cmd = s ? `/${s.command}` : '?';
    const args = s?.args ? ` ${s.args}`.slice(0, 40) : '';
    const status = e.outcome === 'success' ? '✓' : '✗';
    const tokens = e.totalTokens ? ` ${e.totalTokens.toLocaleString()}t` : '';
    const dur = e.totalDurationMs ? ` ${(e.totalDurationMs / 1000).toFixed(1)}s` : '';
    lines.push(`${e.endedAt.slice(0, 16)} ${status} ${cmd}${args}${tokens}${dur}`);
  }
  return lines.join('\n');
}

// CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [,, subcmd, ...rest] = process.argv;

  if (subcmd === 'record') {
    // record start|phase|end — for shell-based pipeline integration
    const action = rest[0];
    if (action === 'start') {
      const [command, args = ''] = rest.slice(1);
      if (!command) { console.error('Usage: trace.js record start <command> [args]'); process.exit(1); }
      const traceId = startTrace(command, args);
      console.log(traceId);
    } else if (action === 'phase') {
      const [traceId, phase, agent, outcome] = rest.slice(1);
      const tokens = parseInt(rest[5] || '0', 10);
      const durationMs = parseInt(rest[6] || '0', 10);
      if (!traceId || !phase || !agent || !outcome) {
        console.error('Usage: trace.js record phase <traceId> <phase> <agent> <outcome> [tokens] [durationMs]');
        process.exit(1);
      }
      recordPhase(traceId, phase, agent, outcome, { tokens, durationMs });
    } else if (action === 'end') {
      const [traceId, outcome = 'success'] = rest.slice(1);
      if (!traceId) { console.error('Usage: trace.js record end <traceId> [outcome]'); process.exit(1); }
      const result = endTrace(traceId, outcome);
      console.log(JSON.stringify(result));
    } else {
      console.error('Usage: trace.js record <start|phase|end> ...');
      process.exit(1);
    }
  } else if (subcmd === 'summary') {
    const daysIdx = rest.indexOf('--days');
    const days = daysIdx !== -1 ? parseInt(rest[daysIdx + 1], 10) : 7;
    const stats = getStats(days);
    console.log(formatSummary(stats, days));
  } else if (subcmd === 'tail') {
    const nIdx = rest.indexOf('--n');
    const n = nIdx !== -1 ? parseInt(rest[nIdx + 1], 10) : 10;
    const records = readTraceFiles(7);
    console.log(formatTail(records, n));
  } else {
    console.error('Usage: trace.js <record|summary|tail>');
    process.exit(1);
  }
}
