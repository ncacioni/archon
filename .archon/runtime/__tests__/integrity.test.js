import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import { parseFrontmatter, extractAgentRefs, check } from '../integrity.js';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..');

describe('integrity', () => {
  describe('parseFrontmatter', () => {
    it('extracts name, model, tools, skills from agent files', () => {
      const agentPath = path.join(ROOT, '.claude', 'agents', 'solo', 'builder.md');
      const fm = parseFrontmatter(agentPath);
      assert.equal(fm.name, 'builder');
      assert.equal(fm.model, 'opus');
      assert.ok(fm.tools.includes('Read'));
      assert.ok(fm.skills.includes('clean-architecture'));
    });
  });

  describe('extractAgentRefs', () => {
    it('extracts bold agent names from command files', () => {
      const cmdPath = path.join(ROOT, '.claude', 'commands', 'build.md');
      const refs = extractAgentRefs(cmdPath);
      assert.ok(refs.includes('architect'));
      assert.ok(refs.includes('builder'));
      assert.ok(refs.includes('security'));
      assert.ok(refs.includes('qa'));
    });
  });

  describe('check', () => {
    it('passes with zero errors for current solo mode', () => {
      const result = check();
      assert.equal(result.errors.length, 0, `Unexpected errors: ${result.errors.join(', ')}`);
      assert.equal(result.stats.agents, 9);
      assert.ok(result.stats.commands >= 8);
    });

    it('detects missing skill reference', () => {
      // Use a fake agents dir with a broken skill reference
      const fakeAgentsDir = path.join(ROOT, '.claude', 'agents', 'solo');
      const fakeSkillsDir = path.join(ROOT, '.claude', 'skills-nonexistent');
      const result = check(fakeAgentsDir, fakeSkillsDir);
      assert.ok(result.errors.length > 0, 'Should detect missing skills');
    });
  });
});
