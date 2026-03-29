#!/usr/bin/env node

/**
 * Archon CLI
 * Usage: npx github:ncacioni/archon [init|upgrade] [--local]
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
const SRC_SETTINGS = path.join(PKG_ROOT, '.claude', 'settings.json');

function getSourceVersion() {
  const pkgPath = path.join(PKG_ROOT, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
  return pkg.version;
}

function detectInstalledVersion(cwd) {
  const installModePath = path.join(cwd, '.archon', 'install-mode.json');
  if (fs.existsSync(installModePath)) {
    const data = JSON.parse(fs.readFileSync(installModePath, 'utf-8'));
    return data.version;
  }
  const configLoaderPath = path.join(cwd, '.archon', 'runtime', 'config-loader.js');
  if (fs.existsSync(configLoaderPath)) {
    return '3.3.0';
  }
  const archonDir = path.join(cwd, '.archon');
  if (fs.existsSync(archonDir)) {
    return '3.0.0';
  }
  throw new Error('No Archon installation found. Run "archon init" first.');
}

function writeInstallMode(cwd, local) {
  const installModePath = path.join(cwd, '.archon', 'install-mode.json');
  const data = {
    mode: local ? 'local' : 'shared',
    version: getSourceVersion(),
    installed_at: new Date().toISOString(),
  };
  fs.writeFileSync(installModePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

function getArchonSection() {
  return `## This project uses Archon

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
}

function injectOrReplaceArchonSection(cwd) {
  const claudeMdPath = path.join(cwd, 'CLAUDE.md');
  const section = getArchonSection();

  if (!fs.existsSync(claudeMdPath)) {
    fs.writeFileSync(claudeMdPath, section.trim() + '\n', 'utf-8');
    console.log('  Created: CLAUDE.md with Archon section');
    return;
  }

  let content = fs.readFileSync(claudeMdPath, 'utf-8');
  const marker = '## This project uses Archon';
  const markerIndex = content.indexOf(marker);

  if (markerIndex === -1) {
    // Not found — append
    content += '\n' + section;
    fs.writeFileSync(claudeMdPath, content, 'utf-8');
    console.log('  Updated: CLAUDE.md with Archon section');
    return;
  }

  // Find the end of the Archon section: next ## heading or EOF
  const afterMarker = content.substring(markerIndex + marker.length);
  const nextHeadingMatch = afterMarker.match(/\n## (?!#)/);
  let endIndex;
  if (nextHeadingMatch) {
    endIndex = markerIndex + marker.length + nextHeadingMatch.index;
  } else {
    endIndex = content.length;
  }

  const before = content.substring(0, markerIndex);
  const after = content.substring(endIndex);
  content = before + section.trim() + '\n' + after;
  fs.writeFileSync(claudeMdPath, content, 'utf-8');
  console.log('  Updated: CLAUDE.md (replaced Archon section)');
}

// Keep legacy wrapper for init path
function injectClaudeMd(cwd) {
  injectOrReplaceArchonSection(cwd);
}

function main(local = false) {
  const modeLabel = local ? 'local mode' : 'shared mode';
  console.log(`Archon — Initializing (${modeLabel})...\n`);

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

  // 10. Copy settings.json
  if (fs.existsSync(SRC_SETTINGS)) {
    fs.copyFileSync(SRC_SETTINGS, path.join(CLAUDE_DIR, 'settings.json'));
    console.log('  Copied: .claude/settings.json');
  }

  // 11. Scaffold settings.local.json.example
  scaffoldSettingsExample(CWD);

  // 12. Write install-mode.json
  writeInstallMode(CWD, local);
  console.log(`  Created: .archon/install-mode.json (${local ? 'local' : 'shared'})`);

  // 13. Update .gitignore
  updateGitignore(CWD, local);

  // 14. Inject CLAUDE.md section
  injectClaudeMd(CWD);

  console.log('\nArchon initialized successfully!');
  if (local) {
    console.log('  Mode: local — framework files are gitignored.');
  }
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
        "Bash(node --version)", "Bash(npm --version)",
        "Bash(python --version)", "Bash(python3 --version)",
        "Bash(git --version)", "Bash(docker --version)"
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

function updateGitignore(cwd, local = false) {
  const gitignorePath = path.join(cwd, '.gitignore');

  let localEntries;
  if (local) {
    localEntries = [
      '# Archon — local install (framework files excluded from git)',
      '.archon/',
      '.claude/agents/',
      '.claude/skills/',
      '.claude/commands/',
      '.claude/scratchpad/',
      '.claude/settings.json',
      '.claude/settings.local.json',
      '.claude/settings.local.json.example',
    ];
  } else {
    localEntries = [
      '# Archon — local only (not shared)',
      '.archon/state.json',
      '.archon/memory/',
      '.archon/runtime/package-lock.json',
      '.archon/install-mode.json',
      '',
      '# Claude Code — local only (not shared)',
      '.claude/scratchpad/',
      '.claude/settings.local.json',
    ];
  }

  let content = '';
  if (fs.existsSync(gitignorePath)) {
    content = fs.readFileSync(gitignorePath, 'utf-8');
  }
  if (content.includes('.claude/scratchpad/')) {
    console.log('  .gitignore: already configured');
    return;
  }
  content += '\n' + localEntries.join('\n') + '\n';
  fs.writeFileSync(gitignorePath, content, 'utf-8');
  console.log('  Updated: .gitignore');
}

function upgrade() {
  let installedVersion;
  try {
    installedVersion = detectInstalledVersion(CWD);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(1);
  }

  const sourceVersion = getSourceVersion();

  if (installedVersion === sourceVersion) {
    console.log(`Archon is already up to date (v${sourceVersion}).`);
    return;
  }

  console.log(`Archon — Upgrading v${installedVersion} → v${sourceVersion}...\n`);

  // Determine install mode
  let local = false;
  const installModePath = path.join(CWD, '.archon', 'install-mode.json');
  if (fs.existsSync(installModePath)) {
    const data = JSON.parse(fs.readFileSync(installModePath, 'utf-8'));
    local = data.mode === 'local';
  }

  const report = [];

  // Overwrite: runtime
  if (fs.existsSync(SRC_RUNTIME)) {
    copyDir(SRC_RUNTIME, path.join(ARCHON_DIR, 'runtime'));
    report.push('runtime modules');
  }

  // Overwrite: toolkits
  if (fs.existsSync(SRC_TOOLKITS)) {
    copyDir(SRC_TOOLKITS, path.join(ARCHON_DIR, 'toolkits'));
    report.push('toolkit definitions');
  }

  // Overwrite: agents (solo)
  if (fs.existsSync(SRC_AGENTS_SOLO)) {
    copyDir(SRC_AGENTS_SOLO, path.join(CLAUDE_DIR, 'agents', 'solo'));
    report.push('solo agents');
  }

  // Overwrite: agents (team)
  if (fs.existsSync(SRC_AGENTS_TEAM)) {
    copyDir(SRC_AGENTS_TEAM, path.join(CLAUDE_DIR, 'agents', 'team'));
    report.push('team agents');
  }

  // Overwrite: skills
  if (fs.existsSync(SRC_SKILLS)) {
    copyDir(SRC_SKILLS, path.join(CLAUDE_DIR, 'skills'));
    report.push('skills');
  }

  // Overwrite: commands
  if (fs.existsSync(SRC_COMMANDS)) {
    copyDir(SRC_COMMANDS, path.join(CLAUDE_DIR, 'commands'));
    report.push('commands');
  }

  // Overwrite: settings.json
  if (fs.existsSync(SRC_SETTINGS)) {
    fs.copyFileSync(SRC_SETTINGS, path.join(CLAUDE_DIR, 'settings.json'));
    report.push('settings.json');
  }

  // Merge: CLAUDE.md
  injectOrReplaceArchonSection(CWD);
  report.push('CLAUDE.md (merged)');

  // Skip: config.yml, settings.local.json, settings.local.json.example, scratchpad
  console.log('  Skipped: .archon/config.yml (preserved)');
  console.log('  Skipped: .claude/settings.local.json (preserved)');
  console.log('  Skipped: .claude/scratchpad/ (preserved)');

  // Refresh: gitignore
  // Remove idempotency marker temporarily to allow refresh
  const gitignorePath = path.join(CWD, '.gitignore');
  if (fs.existsSync(gitignorePath)) {
    let gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    // Remove existing Archon block to allow re-generation
    const archonBlockStart = gitignoreContent.indexOf('# Archon');
    if (archonBlockStart !== -1) {
      // Find the end of the Archon+Claude block
      const lines = gitignoreContent.split('\n');
      let startLine = -1;
      let endLine = lines.length;
      let inBlock = false;
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith('# Archon') || lines[i].startsWith('# Claude Code')) {
          if (!inBlock) {
            startLine = i;
            inBlock = true;
          }
        } else if (inBlock && lines[i].trim() !== '' && !lines[i].startsWith('.archon') && !lines[i].startsWith('.claude')) {
          endLine = i;
          break;
        }
      }
      if (startLine !== -1) {
        lines.splice(startLine, endLine - startLine);
        gitignoreContent = lines.join('\n').replace(/\n{3,}/g, '\n\n');
        fs.writeFileSync(gitignorePath, gitignoreContent, 'utf-8');
      }
    }
  }
  updateGitignore(CWD, local);
  report.push('gitignore');

  // Refresh: settings.local.json.example (overwrite)
  const examplePath = path.join(CWD, '.claude', 'settings.local.json.example');
  if (fs.existsSync(examplePath)) {
    fs.unlinkSync(examplePath);
  }
  scaffoldSettingsExample(CWD);
  report.push('settings.local.json.example');

  // Write updated install-mode.json
  writeInstallMode(CWD, local);
  report.push('install-mode.json');

  console.log(`\nArchon upgraded successfully: v${installedVersion} → v${sourceVersion}`);
  console.log(`  Updated: ${report.join(', ')}`);
  if (local) {
    console.log('  Mode: local — framework files remain gitignored.');
  }
  console.log('');
}

// CLI entry — guarded
if (process.argv[1] && import.meta.url === `file:///${process.argv[1].replace(/\\/g, '/')}`) {
  const subcommand = process.argv[2];
  const local = process.argv.includes('--local');

  if (subcommand === 'init' || !subcommand) {
    main(local);
  } else if (subcommand === 'upgrade') {
    upgrade();
  } else {
    console.error(`Unknown command: ${subcommand}\nUsage: npx github:ncacioni/archon [init|upgrade] [--local]`);
    process.exit(1);
  }
}
