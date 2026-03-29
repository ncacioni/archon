/**
 * Archon Integrity Validator
 * Verifies that all skill references in agent frontmatter resolve to existing
 * skill directories, and all agent references in commands resolve to existing agents.
 *
 * Usage: node .archon/runtime/integrity.js check [--agents-dir <path>] [--skills-dir <path>]
 */

import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

/**
 * Parse YAML frontmatter from a markdown file.
 * Returns an object with extracted fields.
 */
export function parseFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8').replace(/\r\n/g, '\n');
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const frontmatter = {};
  for (const line of match[1].split('\n')) {
    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    const value = line.slice(colonIdx + 1).trim().replace(/^["']|["']$/g, '');
    frontmatter[key] = value;
  }
  return frontmatter;
}

/**
 * Extract agent names referenced in a command file.
 * Looks for **agentname** patterns (bold markdown).
 */
export function extractAgentRefs(commandPath) {
  const content = fs.readFileSync(commandPath, 'utf-8');
  const refs = new Set();
  const pattern = /\*\*(\w[\w-]*)\*\*/g;
  let m;
  while ((m = pattern.exec(content)) !== null) {
    const name = m[1].toLowerCase();
    // Filter out non-agent bold words
    const skipWords = new Set([
      'if', 'stop', 'fail', 'veto', 'blocked', 'high', 'medium', 'low',
      'not', 'must', 'never', 'always', 'critical', 'single', 'multiple',
      'phase', 'input', 'pipeline', 'rules',
    ]);
    if (!skipWords.has(name)) {
      refs.add(name);
    }
  }
  return [...refs];
}

/**
 * Run integrity check for a given agents directory.
 * Returns { errors: string[], warnings: string[], stats: object }
 */
export function check(agentsDir, skillsDir, commandsDir) {
  const errors = [];
  const warnings = [];

  agentsDir = agentsDir || path.join(ROOT, '.claude', 'agents', 'solo');
  skillsDir = skillsDir || path.join(ROOT, '.claude', 'skills');
  commandsDir = commandsDir || path.join(ROOT, '.claude', 'commands');

  // 1. Check agent → skill references
  const agentFiles = fs.existsSync(agentsDir)
    ? fs.readdirSync(agentsDir).filter(f => f.endsWith('.md'))
    : [];

  const agentNames = new Set();
  let totalSkillRefs = 0;

  for (const file of agentFiles) {
    const filePath = path.join(agentsDir, file);
    const fm = parseFrontmatter(filePath);
    const name = fm.name || file.replace('.md', '');
    agentNames.add(name);

    if (fm.skills) {
      const skills = fm.skills.split(',').map(s => s.trim()).filter(Boolean);
      for (const skill of skills) {
        totalSkillRefs++;
        const skillPath = path.join(skillsDir, skill, 'SKILL.md');
        if (!fs.existsSync(skillPath)) {
          errors.push(`Agent "${name}" references skill "${skill}" but ${skillPath} does not exist`);
        }
      }
    }
  }

  // 2. Check for orphan skills (skills not referenced by any agent)
  if (fs.existsSync(skillsDir)) {
    const skillDirs = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(d => d.isDirectory())
      .map(d => d.name);

    const referencedSkills = new Set();
    for (const file of agentFiles) {
      const fm = parseFrontmatter(path.join(agentsDir, file));
      if (fm.skills) {
        fm.skills.split(',').map(s => s.trim()).filter(Boolean).forEach(s => referencedSkills.add(s));
      }
    }

    for (const dir of skillDirs) {
      if (!referencedSkills.has(dir)) {
        warnings.push(`Skill "${dir}" exists but is not referenced by any agent`);
      }
    }
  }

  // 3. Check command → agent references
  const commandFiles = fs.existsSync(commandsDir)
    ? fs.readdirSync(commandsDir).filter(f => f.endsWith('.md'))
    : [];

  for (const file of commandFiles) {
    const filePath = path.join(commandsDir, file);
    const refs = extractAgentRefs(filePath);
    for (const ref of refs) {
      if (!agentNames.has(ref)) {
        // Only flag if it looks like a known agent name pattern
        const knownAgentPatterns = [
          'architect', 'security', 'builder', 'frontend', 'qa',
          'devops', 'data', 'spec-writer', 'ml-engineer',
        ];
        if (knownAgentPatterns.includes(ref)) {
          errors.push(`Command "${file}" references agent "${ref}" but no agent file found`);
        }
      }
    }
  }

  return {
    errors,
    warnings,
    stats: {
      agents: agentNames.size,
      skills: totalSkillRefs,
      commands: commandFiles.length,
    },
  };
}

// CLI entry
if (process.argv[2] === 'check') {
  const result = check();
  console.log(`\nArchon Integrity Check`);
  console.log(`  Agents: ${result.stats.agents}`);
  console.log(`  Skill references: ${result.stats.skills}`);
  console.log(`  Commands: ${result.stats.commands}`);

  if (result.warnings.length > 0) {
    console.log(`\nWarnings (${result.warnings.length}):`);
    for (const w of result.warnings) console.log(`  ⚠ ${w}`);
  }

  if (result.errors.length > 0) {
    console.log(`\nErrors (${result.errors.length}):`);
    for (const e of result.errors) console.log(`  ✗ ${e}`);
    process.exit(1);
  } else {
    console.log(`\n  ✓ All references valid`);
  }
}
