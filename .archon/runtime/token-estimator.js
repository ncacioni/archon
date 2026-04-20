#!/usr/bin/env node
/**
 * Token Estimator — pre-execution cost estimates for Archon pipelines.
 * Shows estimated token usage per phase before the user confirms execution.
 *
 * Usage:
 *   node token-estimator.js estimate --size <S|M|L|XL> --command <build|fix|review|...>
 *   node token-estimator.js dashboard --size L
 */

import { fileURLToPath } from 'node:url';

// ── Reference tables ─────────────────────────────────────────────────────────
// Estimates based on empirical Claude Code session data.
// Values are approximate token counts (input + output combined) per agent invocation.

const AGENT_COST = {
  architect:    { S: 3000,  M: 6000,  L: 12000, XL: 20000 },
  security:     { S: 2000,  M: 4000,  L: 8000,  XL: 14000 },
  'spec-writer':{ S: 2000,  M: 5000,  L: 10000, XL: 18000 },
  builder:      { S: 4000,  M: 8000,  L: 18000, XL: 32000 },
  frontend:     { S: 3000,  M: 7000,  L: 15000, XL: 28000 },
  qa:           { S: 2000,  M: 4000,  L: 9000,  XL: 16000 },
  devops:       { S: 2000,  M: 4000,  L: 8000,  XL: 14000 },
  data:         { S: 3000,  M: 6000,  L: 13000, XL: 22000 },
  'ml-engineer':{ S: 4000,  M: 9000,  L: 20000, XL: 36000 },
};

// Phase definitions per command: [phase name, agent(s), runs_for_sizes]
const COMMAND_PHASES = {
  build: [
    { name: 'Phase 0: Classify',    agents: [],             sizes: 'all' },
    { name: 'Phase 1: Analyze',     agents: ['architect'],  sizes: 'all' },
    { name: 'Phase 2: Architecture',agents: ['architect'],  sizes: 'L,XL' },
    { name: 'Phase 3: Spec',        agents: ['spec-writer'],sizes: 'M,L,XL' },
    { name: 'Phase 4: Security',    agents: ['security'],   sizes: 'all' },
    { name: 'Phase 5: Implement',   agents: ['builder'],    sizes: 'all' },
    { name: 'Phase 6: QA',          agents: ['qa'],         sizes: 'all' },
    { name: 'Phase 7: Docs',        agents: ['devops'],     sizes: 'M,L,XL' },
  ],
  fix: [
    { name: 'Analyze',  agents: ['builder'],  sizes: 'all' },
    { name: 'Fix',      agents: ['builder'],  sizes: 'all' },
    { name: 'QA',       agents: ['qa'],       sizes: 'all' },
  ],
  review: [
    { name: 'Code Review', agents: ['qa'],       sizes: 'all' },
    { name: 'Security',    agents: ['security'], sizes: 'all' },
  ],
  secure: [
    { name: 'Security Audit',  agents: ['security'],  sizes: 'all' },
    { name: 'Architecture',    agents: ['architect'], sizes: 'L,XL' },
  ],
  test: [
    { name: 'Strategy',       agents: ['qa'], sizes: 'all' },
    { name: 'Implementation', agents: ['qa'], sizes: 'all' },
  ],
  deploy: [
    { name: 'Assessment',    agents: ['devops'],   sizes: 'all' },
    { name: 'Implement',     agents: ['devops'],   sizes: 'all' },
    { name: 'Security',      agents: ['security'], sizes: 'all' },
    { name: 'Documentation', agents: ['devops'],   sizes: 'all' },
  ],
  design: [
    { name: 'Architecture', agents: ['architect'],   sizes: 'all' },
    { name: 'Specs',        agents: ['spec-writer'], sizes: 'all' },
    { name: 'Security',     agents: ['security'],    sizes: 'all' },
  ],
  ml: [
    { name: 'Problem Framing', agents: ['ml-engineer'], sizes: 'all' },
    { name: 'Data & Features', agents: ['ml-engineer'], sizes: 'all' },
    { name: 'Model',           agents: ['ml-engineer'], sizes: 'all' },
    { name: 'Security',        agents: ['security'],    sizes: 'all' },
    { name: 'QA',              agents: ['qa'],          sizes: 'all' },
  ],
  data: [
    { name: 'Modeling', agents: ['data'],     sizes: 'all' },
    { name: 'Schema',   agents: ['data'],     sizes: 'all' },
    { name: 'Pipeline', agents: ['data'],     sizes: 'M,L,XL' },
    { name: 'Security', agents: ['security'], sizes: 'all' },
    { name: 'QA',       agents: ['qa'],       sizes: 'all' },
  ],
  refactor: [
    { name: 'Analysis',      agents: ['architect'], sizes: 'all' },
    { name: 'Refactor',      agents: ['builder'],   sizes: 'all' },
    { name: 'Verification',  agents: ['qa'],        sizes: 'all' },
  ],
  audit: [
    { name: 'Security Audit',     agents: ['security'],  sizes: 'all' },
    { name: 'Quality Audit',      agents: ['qa'],        sizes: 'all' },
    { name: 'Architecture Audit', agents: ['architect'], sizes: 'all' },
  ],
};

const SIZE_LABELS = { S: 'Small', M: 'Medium', L: 'Large', XL: 'Extra Large' };

export function estimate(command, size) {
  const phases = COMMAND_PHASES[command];
  if (!phases) throw new Error(`Unknown command: "${command}". Valid: ${Object.keys(COMMAND_PHASES).join(', ')}`);
  if (!['S', 'M', 'L', 'XL'].includes(size)) throw new Error(`Invalid size: "${size}". Must be S, M, L, or XL`);

  const rows = [];
  let total = 0;

  for (const phase of phases) {
    const applicable = phase.sizes === 'all' || phase.sizes.split(',').includes(size);
    if (!applicable) continue;

    let phaseTokens = 0;
    for (const agent of phase.agents) {
      const cost = AGENT_COST[agent]?.[size] ?? 3000;
      phaseTokens += cost;
    }

    // Phase 0 (classify) has no agent but costs ~500 tokens for orchestration
    if (phase.agents.length === 0) phaseTokens = 500;

    total += phaseTokens;
    rows.push({ phase: phase.name, agents: phase.agents, tokens: phaseTokens });
  }

  return { command, size, sizeLabel: SIZE_LABELS[size], total, phases: rows };
}

export function formatEstimate(result) {
  const bar = (tokens, max) => {
    const width = 20;
    const filled = Math.round((tokens / max) * width);
    return '█'.repeat(filled) + '░'.repeat(width - filled);
  };

  const maxPhaseTokens = Math.max(...result.phases.map(p => p.tokens));
  const lines = [
    `Token estimate: /${result.command} [${result.size}] ${result.sizeLabel}`,
    '─'.repeat(60),
  ];

  for (const p of result.phases) {
    const agentStr = p.agents.length > 0 ? `(${p.agents.join(', ')})` : '(orchestrator)';
    const k = (p.tokens / 1000).toFixed(1);
    lines.push(`  ${p.phase.padEnd(28)} ${bar(p.tokens, maxPhaseTokens)} ~${k}k`);
    if (p.agents.length > 0) lines.push(`  ${''.padEnd(28)} ${agentStr}`);
  }

  lines.push('─'.repeat(60));
  const totalK = (result.total / 1000).toFixed(0);
  const totalM = (result.total / 1_000_000).toFixed(3);
  lines.push(`  TOTAL                          ~${totalK}k tokens (~${totalM}M)`);

  return lines.join('\n');
}

export function dashboard(size) {
  const results = [];
  for (const cmd of Object.keys(COMMAND_PHASES)) {
    try {
      results.push(estimate(cmd, size));
    } catch {
      // skip
    }
  }
  results.sort((a, b) => b.total - a.total);

  const lines = [`Cost dashboard for size [${size}] — all commands`, '─'.repeat(50)];
  for (const r of results) {
    const bar = '█'.repeat(Math.round((r.total / results[0].total) * 20));
    const k = (r.total / 1000).toFixed(0);
    lines.push(`  /${r.command.padEnd(10)} ${bar.padEnd(20)} ~${k}k`);
  }
  return lines.join('\n');
}

// ── CLI ──────────────────────────────────────────────────────────────────────

if (process.argv[1] && fileURLToPath(import.meta.url).endsWith(process.argv[1].replace(/\\/g, '/').split('/').pop())) {
  const args = process.argv.slice(2);
  const subcommand = args[0];

  if (subcommand === 'estimate') {
    const sizeIdx = args.indexOf('--size');
    const cmdIdx = args.indexOf('--command');
    const size = sizeIdx !== -1 ? args[sizeIdx + 1]?.toUpperCase() : 'M';
    const command = cmdIdx !== -1 ? args[cmdIdx + 1] : 'build';

    try {
      const result = estimate(command, size);
      console.log(formatEstimate(result));
    } catch (e) {
      console.error(`Error: ${e.message}`);
      process.exit(1);
    }
  } else if (subcommand === 'dashboard') {
    const sizeIdx = args.indexOf('--size');
    const size = sizeIdx !== -1 ? args[sizeIdx + 1]?.toUpperCase() : 'M';
    console.log(dashboard(size));
  } else {
    console.log('Usage:');
    console.log('  node token-estimator.js estimate --size <S|M|L|XL> --command <build|fix|...>');
    console.log('  node token-estimator.js dashboard --size <S|M|L|XL>');
    process.exit(0);
  }
}
