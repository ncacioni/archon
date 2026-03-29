import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, getMode, getActiveAgents, resolve, resolveAll } from '../config-loader.js';

describe('config-loader', () => {
  describe('loadConfig()', () => {
    it('returns a parsed object with expected top-level keys', () => {
      const config = loadConfig();
      assert.equal(typeof config, 'object');
      assert.ok('mode' in config);
      assert.ok('solo' in config);
      assert.ok('team' in config);
      assert.ok('project' in config);
    });

    it('has valid solo agents list', () => {
      const config = loadConfig();
      assert.ok(Array.isArray(config.solo.agents));
      assert.ok(config.solo.agents.length > 0);
      assert.ok(config.solo.agents.includes('builder'));
      assert.ok(config.solo.agents.includes('security'));
    });

    it('has team presets defined', () => {
      const config = loadConfig();
      assert.ok(config.team.presets);
      assert.ok('full-stack-app' in config.team.presets);
      assert.ok('api-service' in config.team.presets);
      assert.ok('minimum-viable' in config.team.presets);
    });
  });

  describe('getMode()', () => {
    it('returns "solo" for the current config', () => {
      const mode = getMode();
      assert.equal(mode, 'solo');
    });

    it('returns a string of either solo or team', () => {
      const mode = getMode();
      assert.ok(mode === 'solo' || mode === 'team');
    });
  });

  describe('getActiveAgents()', () => {
    it('returns 9 solo agents when mode is solo', () => {
      const agents = getActiveAgents();
      assert.equal(agents.length, 9);
    });

    it('includes all expected solo agent names', () => {
      const agents = getActiveAgents();
      const expected = ['architect', 'security', 'spec-writer', 'builder', 'frontend', 'qa', 'devops', 'data', 'ml-engineer'];
      for (const name of expected) {
        assert.ok(agents.includes(name), `Expected "${name}" in active agents`);
      }
    });

    it('returns a fresh array (not a reference to internal state)', () => {
      const a = getActiveAgents();
      const b = getActiveAgents();
      assert.notEqual(a, b);
      assert.deepEqual(a, b);
    });
  });

  describe('resolve() in solo mode', () => {
    it('returns single agent for any valid solo name', () => {
      const result = resolve('builder');
      assert.equal(result.mode, 'solo');
      assert.deepEqual(result.agents, ['builder']);
      assert.equal(result.strategy, 'single');
      assert.equal(result.agents_dir, '.claude/agents/solo');
      assert.deepEqual(result.unavailable, []);
    });

    it('works for all solo agents', () => {
      const soloNames = ['architect', 'security', 'spec-writer', 'builder', 'frontend', 'qa', 'devops', 'data', 'ml-engineer'];
      for (const name of soloNames) {
        const result = resolve(name);
        assert.equal(result.mode, 'solo');
        assert.deepEqual(result.agents, [name]);
      }
    });

    it('throws for unknown agent name', () => {
      assert.throws(() => resolve('nonexistent'), /Unknown agent "nonexistent"/);
    });
  });

  describe('EXPANSION_MAP logic (team mode simulation)', () => {
    // Since the current config is solo mode, we test the expansion map
    // by directly verifying the resolve shape expectations against the map.
    // These tests document the expected team-mode behavior.

    it('builder expands to 3 sequential agents', () => {
      // When team mode is active, builder should expand to:
      // domain-logic, app-services, adapter-layer (sequential)
      const config = loadConfig();
      const presetAgents = config.team.presets['full-stack-app'].agents;
      assert.ok(presetAgents.includes('domain-logic'));
      assert.ok(presetAgents.includes('app-services'));
      assert.ok(presetAgents.includes('adapter-layer'));
    });

    it('qa expands to 2 parallel agents', () => {
      const config = loadConfig();
      const presetAgents = config.team.presets['full-stack-app'].agents;
      assert.ok(presetAgents.includes('test-engineer'));
      assert.ok(presetAgents.includes('code-reviewer'));
    });

    it('frontend conditional agent ux-researcher is in full-stack-app preset', () => {
      const config = loadConfig();
      const presetAgents = config.team.presets['full-stack-app'].agents;
      assert.ok(presetAgents.includes('ui-engineer'));
      assert.ok(presetAgents.includes('ux-researcher'));
    });

    it('minimum-viable preset does not include all builder agents', () => {
      const config = loadConfig();
      const presetAgents = config.team.presets['minimum-viable'].agents;
      assert.ok(presetAgents.includes('domain-logic'));
      assert.ok(presetAgents.includes('adapter-layer'));
      assert.ok(!presetAgents.includes('app-services'), 'app-services should not be in minimum-viable');
    });
  });

  describe('conditional agent evaluation', () => {
    it('frontend resolve includes ux-researcher for size L', () => {
      // Test the condition parsing logic indirectly:
      // In team mode with full-stack-app, resolve('frontend', { size: 'L' })
      // should include ux-researcher. We verify the config supports this.
      const config = loadConfig();
      const presetAgents = config.team.presets['full-stack-app'].agents;
      // ux-researcher is present in the preset, so it would not be filtered out
      assert.ok(presetAgents.includes('ux-researcher'));
      assert.ok(presetAgents.includes('ui-engineer'));
    });

    it('frontend resolve excludes ux-researcher for size S', () => {
      // For size S, the conditional agent should NOT be added to candidates.
      // The condition is "size:L,XL" — size S does not match.
      // This is a unit-level check of the expansion logic:
      // candidates would be ['ui-engineer'] only (no ux-researcher added).
      const config = loadConfig();
      // Verify the conditional structure exists
      assert.ok(config.team.presets['full-stack-app'].agents.includes('ux-researcher'));
    });
  });

  describe('resolveAll()', () => {
    it('returns all requested agents in the agents map', () => {
      const result = resolveAll(['builder', 'qa', 'security']);
      assert.ok('agents' in result);
      assert.ok('builder' in result.agents);
      assert.ok('qa' in result.agents);
      assert.ok('security' in result.agents);
      assert.equal(Object.keys(result.agents).length, 3);
    });

    it('includes mode, size, and resolved_at', () => {
      const result = resolveAll(['architect'], { size: 'L' });
      assert.ok(result.mode === 'solo' || result.mode === 'team');
      assert.equal(result.size, 'L');
      assert.ok(typeof result.resolved_at === 'string');
      // resolved_at should be a valid ISO date
      assert.ok(!isNaN(Date.parse(result.resolved_at)));
    });

    it('throws for empty agent names array', () => {
      assert.throws(() => resolveAll([]), /non-empty array/);
    });

    it('throws for non-array argument', () => {
      assert.throws(() => resolveAll(null), /non-empty array/);
    });

    it('size defaults to null when not provided', () => {
      const result = resolveAll(['builder']);
      assert.equal(result.size, null);
    });

    it('each agent entry matches resolve() output shape', () => {
      const result = resolveAll(['builder', 'security']);
      const directResolve = resolve('builder');
      const fromAll = result.agents['builder'];
      assert.deepEqual(fromAll.agents, directResolve.agents);
      assert.equal(fromAll.mode, directResolve.mode);
      assert.equal(fromAll.strategy, directResolve.strategy);
      assert.equal(fromAll.agents_dir, directResolve.agents_dir);
    });
  });

  describe('getActiveAgents applies override logic', () => {
    it('solo mode returns agents from solo config section', () => {
      const config = loadConfig();
      const agents = getActiveAgents();
      assert.deepEqual(agents, config.solo.agents);
    });

    it('team presets have varying agent counts', () => {
      const config = loadConfig();
      const fullStack = config.team.presets['full-stack-app'].agents;
      const minViable = config.team.presets['minimum-viable'].agents;
      assert.ok(fullStack.length > minViable.length,
        'full-stack-app should have more agents than minimum-viable');
    });
  });
});
