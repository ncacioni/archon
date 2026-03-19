import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detectIntent, getAgentActivationOrder, getAgentInfo, listSoloAgents, formatDetection } from '../intent-router.js';

describe('intent-router', () => {
  describe('detectIntent()', () => {
    it('detects BUILD intent for "add user authentication"', () => {
      const results = detectIntent('add user authentication');
      const intents = results.map(r => r.intent);
      assert.ok(intents.includes('BUILD'));
      assert.ok(intents.includes('SECURE'));
    });

    it('detects FIX intent for "fix the login bug"', () => {
      const results = detectIntent('fix the login bug');
      assert.ok(results.some(r => r.intent === 'FIX'));
    });

    it('detects DEPLOY intent for "deploy to production"', () => {
      const results = detectIntent('deploy to production');
      assert.ok(results.some(r => r.intent === 'DEPLOY'));
    });

    it('detects multiple intents for complex messages', () => {
      const results = detectIntent('create a new API endpoint with database migration and tests');
      assert.ok(results.length >= 2);
    });

    it('returns empty array for unrelated messages', () => {
      const results = detectIntent('hello world');
      assert.equal(results.length, 0);
    });

    it('does not false-positive on "address" matching "add"', () => {
      const results = detectIntent('fix the address validation');
      const build = results.find(r => r.intent === 'BUILD');
      assert.ok(!build || !build.matchedKeywords.includes('add'), '"address" should not match keyword "add"');
    });

    it('does not false-positive on "padding" matching "add"', () => {
      const results = detectIntent('check the padding styles');
      const build = results.find(r => r.intent === 'BUILD');
      assert.ok(!build || !build.matchedKeywords.includes('add'), '"padding" should not match keyword "add"');
    });

    it('does not false-positive on "readable" matching "add"', () => {
      const results = detectIntent('make the code more readable');
      const build = results.find(r => r.intent === 'BUILD');
      assert.ok(!build || !build.matchedKeywords.includes('add'));
    });

    it('correctly matches "test" as a whole word', () => {
      const results = detectIntent('test the new feature');
      assert.ok(results.some(r => r.intent === 'TEST'));
    });

    it('returns confidence based on keyword match count', () => {
      const results = detectIntent('fix the broken error that is failing');
      const fix = results.find(r => r.intent === 'FIX');
      assert.ok(fix);
      assert.ok(fix.confidence > 0.5);
    });

    it('sorts results by confidence descending', () => {
      const results = detectIntent('review security authentication permissions');
      for (let i = 1; i < results.length; i++) {
        assert.ok(results[i - 1].confidence >= results[i].confidence);
      }
    });
  });

  describe('getAgentActivationOrder()', () => {
    it('deduplicates agents across multiple intents', () => {
      const intents = detectIntent('build and test the new feature');
      const agents = getAgentActivationOrder(intents);
      const unique = new Set(agents);
      assert.equal(agents.length, unique.size);
    });

    it('injects S2 for implementation intents when not already present', () => {
      const intents = detectIntent('fix the bug');
      const agents = getAgentActivationOrder(intents);
      assert.ok(agents.includes('S2'));
    });

    it('returns correct order for BUILD intent', () => {
      const intents = detectIntent('create a new module');
      const agents = getAgentActivationOrder(intents);
      assert.ok(agents.indexOf('S3') < agents.indexOf('S4'));
    });
  });

  describe('getAgentInfo()', () => {
    it('returns metadata for valid agent', () => {
      const info = getAgentInfo('S0');
      assert.ok(info);
      assert.equal(info.name, 'Archon');
      assert.equal(info.role, 'Orchestrator');
    });

    it('returns null for invalid agent', () => {
      assert.equal(getAgentInfo('S99'), null);
    });
  });

  describe('listSoloAgents()', () => {
    it('returns all 9 solo agents', () => {
      const agents = listSoloAgents();
      assert.equal(Object.keys(agents).length, 9);
      assert.ok(agents.S0);
      assert.ok(agents.S8);
    });
  });

  describe('formatDetection()', () => {
    it('formats detection results for known intents', () => {
      const output = formatDetection('add user authentication');
      assert.ok(output.includes('Detected intents'));
      assert.ok(output.includes('Agent activation order'));
    });

    it('returns fallback message when no intent detected', () => {
      const output = formatDetection('hello world');
      assert.ok(output.includes('Archon (S0)'));
    });
  });
});
