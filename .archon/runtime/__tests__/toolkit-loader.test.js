import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { loadIndex, loadTool, listTools } from '../toolkit-loader.js';

describe('toolkit-loader', () => {
  describe('loadIndex()', () => {
    it('returns YAML string for existing agent toolkit', () => {
      const result = loadIndex('security');
      assert.ok(result.includes('stride-analysis'));
      assert.ok(result.includes('npm-audit-check'));
    });

    it('returns empty string for non-existent agent', () => {
      const result = loadIndex('99-nonexistent');
      assert.equal(result, '');
    });
  });

  describe('loadTool()', () => {
    it('returns full tool definition YAML', () => {
      const result = loadTool('stride-analysis');
      assert.ok(result.includes('STRIDE'));
      assert.ok(result.includes('Spoofing'));
      assert.ok(result.includes('component_name'));
    });

    it('returns empty string for non-existent tool', () => {
      const result = loadTool('nonexistent-tool');
      assert.equal(result, '');
    });
  });

  describe('listTools()', () => {
    it('returns array of tool summaries for an agent', () => {
      const tools = listTools('security');
      assert.ok(Array.isArray(tools));
      assert.equal(tools.length, 5);
      assert.equal(tools[0].id, 'stride-analysis');
      assert.ok(tools[0].description.length > 0);
    });

    it('returns empty array for non-existent agent', () => {
      const tools = listTools('99-nonexistent');
      assert.deepEqual(tools, []);
    });
  });

  describe('all agent toolkits', () => {
    const expectedToolkits = [
      { agent: 'architect', toolCount: 4 },
      { agent: 'security', toolCount: 5 },
      { agent: 'spec-writer', toolCount: 3 },
      { agent: 'builder', toolCount: 3 },
      { agent: 'frontend', toolCount: 3 },
      { agent: 'qa', toolCount: 3 },
      { agent: 'devops', toolCount: 3 },
      { agent: 'data', toolCount: 8 },
      { agent: 'ml-engineer', toolCount: 3 },
    ];

    for (const { agent, toolCount } of expectedToolkits) {
      it(`${agent} has ${toolCount} tools in index`, () => {
        const tools = listTools(agent);
        assert.equal(tools.length, toolCount, `${agent} should have ${toolCount} tools`);
      });
    }

    it('every tool referenced in an index has a corresponding .tool.yml file', () => {
      const agents = ['architect', 'security', 'spec-writer', 'builder', 'frontend', 'qa', 'devops', 'data', 'ml-engineer'];
      for (const agent of agents) {
        const tools = listTools(agent);
        for (const tool of tools) {
          const def = loadTool(tool.id);
          assert.ok(def.length > 0, `Tool ${tool.id} (from ${agent}) should have a definition file`);
          assert.ok(def.includes(`id: ${tool.id}`), `Tool ${tool.id} definition should contain its own id`);
        }
      }
    });
  });
});
