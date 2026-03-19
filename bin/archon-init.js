#!/usr/bin/env node

/**
 * Archon v3.0 CLI
 * Usage: npx archon init [--name <name>] [--mode <solo|team>]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CWD = process.cwd();
const ARCHON_DIR = path.join(CWD, '.archon');

const PKG_ROOT = path.resolve(__dirname, '..');
const SRC_RUNTIME = path.join(PKG_ROOT, '.archon', 'runtime');
const SRC_TOOLKITS = path.join(PKG_ROOT, '.archon', 'toolkits');
const SRC_SKILLS = path.join(PKG_ROOT, '.archon', 'skills');
const SRC_CONFIG = path.join(PKG_ROOT, '.archon', 'config.yml');

function main() {
  console.log('Archon v3.0 — Initializing...\n');

  // 1. Create directory structure
  const dirs = [
    '.archon/runtime', '.archon/runtime/__tests__',
    '.archon/toolkits/tools', '.archon/skills',
    '.archon/memory/agents', '.archon/memory/archive',
  ];
  for (const dir of dirs) {
    const full = path.join(CWD, dir);
    fs.mkdirSync(full, { recursive: true });
    console.log(`  Created: ${dir}/`);
  }

  // 2. Copy runtime files
  if (fs.existsSync(SRC_RUNTIME)) {
    copyDir(SRC_RUNTIME, path.join(ARCHON_DIR, 'runtime'));
    console.log('  Copied: runtime modules');
  }

  // 3. Copy toolkits
  if (fs.existsSync(SRC_TOOLKITS)) {
    copyDir(SRC_TOOLKITS, path.join(ARCHON_DIR, 'toolkits'));
    console.log('  Copied: toolkit definitions');
  }

  // 4. Copy skills
  if (fs.existsSync(SRC_SKILLS)) {
    copyDir(SRC_SKILLS, path.join(ARCHON_DIR, 'skills'));
    console.log('  Copied: phase skills');
  }

  // 5. Copy default config
  if (fs.existsSync(SRC_CONFIG)) {
    fs.copyFileSync(SRC_CONFIG, path.join(ARCHON_DIR, 'config.yml'));
    console.log('  Created: config.yml');
  }

  // 6. Create .gitkeep files for empty directories
  for (const dir of ['memory/agents', 'memory/archive']) {
    const gitkeep = path.join(ARCHON_DIR, dir, '.gitkeep');
    if (!fs.existsSync(gitkeep)) {
      fs.writeFileSync(gitkeep, '', 'utf-8');
    }
  }
  console.log('  Created: .gitkeep files for empty dirs');

  // 7. Create empty evaluations.md
  const evalFile = path.join(ARCHON_DIR, 'memory', 'evaluations.md');
  if (!fs.existsSync(evalFile)) {
    fs.writeFileSync(evalFile, '# Archon Evaluation Cache\n\n', 'utf-8');
    console.log('  Created: memory/evaluations.md');
  }

  // 8. Update .gitignore
  updateGitignore(CWD);

  // 9. Inject CLAUDE.md section
  injectClaudeMd(CWD);

  console.log('\nArchon v3.0 initialized successfully!');
  console.log('Edit .archon/config.yml to configure your project.\n');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function updateGitignore(cwd) {
  const gitignorePath = path.join(cwd, '.gitignore');
  const entries = [
    '# Archon — personal agent memories (not shared)',
    '.archon/memory/agents/',
    '.archon/memory/archive/',
    '# Keep evaluations.md (project knowledge)',
    '!.archon/memory/evaluations.md',
    '# Archon — project state (local only)',
    '.archon/state.json',
  ];
  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf-8');
  }
  if (content.includes('.archon/memory/agents/')) {
    console.log('  .gitignore: already configured');
    return;
  }
  content += '\n' + entries.join('\n') + '\n';
  fs.writeFileSync(gitignorePath, content, 'utf-8');
  console.log('  Updated: .gitignore');
}

function injectClaudeMd(cwd) {
  const claudeMdPath = path.join(cwd, 'CLAUDE.md');
  const section = `
## This project uses Archon

Archon is an intelligent orchestrator for Claude Code.

### How to work
When the user asks you to do something:
1. Read \`.archon/config.yml\` for project context and mode (solo/team)
2. Determine the intent of the request (build, review, fix, secure, test, deploy, design, data, document)
3. For each activated agent, read its prompt from \`agents/solo/\` (solo mode) or \`agents/\` (team mode)
4. Security (S2) always reviews implementation work before shipping
5. Specs precede code — but for quick fixes, inline spec is fine

### Agent prompts (Solo mode)
- \`agents/solo/S0-archon.md\` — Orchestration and routing
- \`agents/solo/S1-architect.md\` — Solution design, API contracts
- \`agents/solo/S2-security.md\` — Security review (STRIDE, veto power)
- \`agents/solo/S3-spec-writer.md\` — OpenAPI, DB schemas, wireframes
- \`agents/solo/S4-builder.md\` — Domain logic, app services, adapters
- \`agents/solo/S5-frontend.md\` — Components, UI, UX
- \`agents/solo/S6-qa.md\` — Tests, code review, SAST
- \`agents/solo/S7-devops.md\` — CI/CD, observability, releases
- \`agents/solo/S8-data.md\` — Data modeling, pipelines, migrations

### Runtime
- Token estimator: \`node .archon/runtime/token-estimator.js estimate --complexity medium\`
- Memory: \`node .archon/runtime/memory-manager.js load {agent-id}\`
- Agent registry: \`node .archon/runtime/agent-registry.js prompt {agent-id} "{task}"\`
`;

  if (!fs.existsSync(claudeMdPath)) {
    fs.writeFileSync(claudeMdPath, section.trim() + '\n', 'utf-8');
    console.log('  Created: CLAUDE.md with Archon section');
    return;
  }
  let content = fs.readFileSync(claudeMdPath, 'utf-8');
  if (content.includes('This project uses Archon')) {
    console.log('  CLAUDE.md: Archon section already present');
    return;
  }
  content += '\n' + section;
  fs.writeFileSync(claudeMdPath, content, 'utf-8');
  console.log('  Updated: CLAUDE.md with Archon section');
}

// CLI entry — guarded
if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const subcommand = process.argv[2];
  if (subcommand === 'init' || !subcommand) {
    main();
  } else {
    console.error(`Unknown command: ${subcommand}\nUsage: npx archon init [--name <name>] [--mode <solo|team>]`);
    process.exit(1);
  }
}
