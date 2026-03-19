#!/usr/bin/env node

/**
 * Archon CLI
 * Usage: npx archon init
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CWD = process.cwd();
const ARCHON_DIR = path.join(CWD, '.archon');
const CLAUDE_DIR = path.join(CWD, '.claude');

const PKG_ROOT = path.resolve(__dirname, '..');
const SRC_RUNTIME = path.join(PKG_ROOT, '.archon', 'runtime');
const SRC_TOOLKITS = path.join(PKG_ROOT, '.archon', 'toolkits');
const SRC_CONFIG = path.join(PKG_ROOT, '.archon', 'config.yml');

const SRC_AGENTS_SOLO = path.join(PKG_ROOT, '.claude', 'agents', 'solo');
const SRC_AGENTS_TEAM = path.join(PKG_ROOT, '.claude', 'agents', 'team');
const SRC_SKILLS = path.join(PKG_ROOT, '.claude', 'skills');
const SRC_COMMANDS = path.join(PKG_ROOT, '.claude', 'commands');

function main() {
  console.log('Archon — Initializing...\n');

  // 1. Create .archon directory structure
  const archonDirs = [
    '.archon/runtime', '.archon/runtime/__tests__',
    '.archon/toolkits/tools',
  ];
  for (const dir of archonDirs) {
    const full = path.join(CWD, dir);
    fs.mkdirSync(full, { recursive: true });
    console.log(`  Created: ${dir}/`);
  }

  // 2. Create .claude directory structure
  const claudeDirs = [
    '.claude/agents/solo', '.claude/agents/team',
    '.claude/skills', '.claude/commands',
    '.claude/scratchpad',
  ];
  for (const dir of claudeDirs) {
    const full = path.join(CWD, dir);
    fs.mkdirSync(full, { recursive: true });
    console.log(`  Created: ${dir}/`);
  }

  // 3. Copy runtime files
  if (fs.existsSync(SRC_RUNTIME)) {
    copyDir(SRC_RUNTIME, path.join(ARCHON_DIR, 'runtime'));
    console.log('  Copied: runtime modules');
  }

  // 4. Copy toolkits
  if (fs.existsSync(SRC_TOOLKITS)) {
    copyDir(SRC_TOOLKITS, path.join(ARCHON_DIR, 'toolkits'));
    console.log('  Copied: toolkit definitions');
  }

  // 5. Copy default config
  if (fs.existsSync(SRC_CONFIG)) {
    fs.copyFileSync(SRC_CONFIG, path.join(ARCHON_DIR, 'config.yml'));
    console.log('  Created: .archon/config.yml');
  }

  // 6. Copy .claude agents (solo)
  if (fs.existsSync(SRC_AGENTS_SOLO)) {
    copyDir(SRC_AGENTS_SOLO, path.join(CLAUDE_DIR, 'agents', 'solo'));
    console.log('  Copied: solo agents (9)');
  }

  // 7. Copy .claude agents (team)
  if (fs.existsSync(SRC_AGENTS_TEAM)) {
    copyDir(SRC_AGENTS_TEAM, path.join(CLAUDE_DIR, 'agents', 'team'));
    console.log('  Copied: team agent scaffolding');
  }

  // 8. Copy .claude skills
  if (fs.existsSync(SRC_SKILLS)) {
    copyDir(SRC_SKILLS, path.join(CLAUDE_DIR, 'skills'));
    console.log('  Copied: skills (11)');
  }

  // 9. Copy .claude commands
  if (fs.existsSync(SRC_COMMANDS)) {
    copyDir(SRC_COMMANDS, path.join(CLAUDE_DIR, 'commands'));
    console.log('  Copied: commands (10)');
  }

  // 10. Scaffold settings.local.json.example
  scaffoldSettingsExample(CWD);

  // 11. Update .gitignore
  updateGitignore(CWD);

  // 12. Inject CLAUDE.md section
  injectClaudeMd(CWD);

  console.log('\nArchon initialized successfully!');
  console.log('Next steps:');
  console.log('  1. Rename .claude/settings.local.json.example to .claude/settings.local.json');
  console.log('  2. Edit .archon/config.yml to configure your project');
  console.log('  3. Use /build, /fix, /review, /design, /ml, etc. in Claude Code\n');
}

function scaffoldSettingsExample(cwd) {
  const examplePath = path.join(cwd, '.claude', 'settings.local.json.example');
  if (fs.existsSync(examplePath)) {
    console.log('  .claude/settings.local.json.example: already exists');
    return;
  }
  const tier2Config = {
    permissions: {
      allow: [
        "Write", "Edit", "WebSearch",
        "Bash(git status*)", "Bash(git log*)", "Bash(git diff*)",
        "Bash(git branch*)", "Bash(git show*)", "Bash(git remote*)",
        "Bash(git add *)", "Bash(git commit *)", "Bash(git stash*)",
        "Bash(git checkout *)", "Bash(git switch *)",
        "Bash(git fetch*)", "Bash(git pull*)",
        "Bash(git rev-parse*)", "Bash(git ls-remote*)",
        "Bash(gh *)",
        "Bash(npm run *)", "Bash(npm test*)", "Bash(npx *)",
        "Bash(node *)", "Bash(python *)", "Bash(python3 *)",
        "Bash(pytest *)", "Bash(cargo *)", "Bash(go *)", "Bash(make *)",
        "Bash(tsc *)", "Bash(eslint *)", "Bash(prettier *)",
        "Bash(jest *)", "Bash(vitest *)",
        "Bash(ls *)", "Bash(cat *)", "Bash(head *)", "Bash(tail *)",
        "Bash(wc *)", "Bash(pwd)", "Bash(which *)", "Bash(type *)",
        "Bash(find *)", "Bash(tree *)", "Bash(echo *)",
        "Bash(jq *)", "Bash(sort *)", "Bash(diff *)", "Bash(test *)",
        "Bash(mkdir *)", "Bash(cp *)", "Bash(mv *)", "Bash(touch *)", "Bash(rm *)",
        "Bash(docker ps*)", "Bash(docker logs*)",
        "Bash(* --version)", "Bash(* --help)", "Bash(* --help *)"
      ],
      ask: [
        "Bash(git push *)", "Bash(git merge *)", "Bash(git rebase *)",
        "Bash(npm install*)", "Bash(pip install *)", "Bash(pip3 install *)",
        "Bash(curl *)", "Bash(wget *)",
        "Bash(docker compose*)", "Bash(docker exec *)",
        "Bash(docker build *)", "Bash(docker run *)"
      ]
    }
  };
  fs.writeFileSync(examplePath, JSON.stringify(tier2Config, null, 2) + '\n', 'utf-8');
  console.log('  Created: .claude/settings.local.json.example (rename to settings.local.json to activate)');
}

function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) {
      console.warn(`  Skipping symlink: ${entry.name}`);
      continue;
    }
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
    '# Archon — local only (not shared)',
    '.archon/state.json',
    '.archon/memory/agents/',
    '.archon/memory/archive/',
    '',
    '# Claude Code — local only (not shared)',
    '.claude/scratchpad/',
    '.claude/settings.local.json',
  ];
  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf-8');
  }
  if (content.includes('.claude/scratchpad/')) {
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

Archon is an intelligent orchestrator for Claude Code using native \`.claude/\` agents, skills, and commands.

### How to work
Use slash commands for structured workflows:
- \`/build\` — Full pipeline: classify → analyze → design → spec → security → implement → QA → docs
- \`/fix\` — Bug analysis, fix, regression test
- \`/review\` — Code review + security audit
- \`/secure\` — Focused security audit (STRIDE + OWASP)
- \`/test\` — Test writing and execution
- \`/deploy\` — CI/CD, Docker, releases
- \`/design\` — Architecture (ADD) + specifications
- \`/ml\` — ML workflow: problem framing → model → deploy
- \`/data\` — Data infrastructure: modeling → pipelines → quality
- \`/refactor\` — Code refactoring with behavioral preservation

Or describe what you need naturally — Archon detects intent and dispatches agents.

### Core invariants
1. Security reviews before shipping; security agent has veto power
2. ADD before code for L/XL features; specs for M+; inline OK for fixes
3. Clean Architecture: deps point inward; domain layer zero external deps
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
    console.error(`Unknown command: ${subcommand}\nUsage: npx archon init`);
    process.exit(1);
  }
}
