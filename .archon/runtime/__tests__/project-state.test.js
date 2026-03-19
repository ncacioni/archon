import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadState, getFeature, markComplete, getPendingReviews, clearCompleted, listFeatures } from '../project-state.js';

const STATE_FILE = path.join(import.meta.dirname, '../../../.archon/state.json');
const STATE_BACKUP = STATE_FILE + '.test.bak';

describe('project-state', () => {
  beforeEach(() => {
    if (fs.existsSync(STATE_FILE)) {
      fs.copyFileSync(STATE_FILE, STATE_BACKUP);
    }
    // Clean state for tests
    if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
  });

  afterEach(() => {
    // Restore original state
    if (fs.existsSync(STATE_BACKUP)) {
      fs.copyFileSync(STATE_BACKUP, STATE_FILE);
      fs.unlinkSync(STATE_BACKUP);
    } else if (fs.existsSync(STATE_FILE)) {
      fs.unlinkSync(STATE_FILE);
    }
  });

  describe('loadState()', () => {
    it('returns empty state when no file exists', () => {
      const state = loadState();
      assert.equal(state.version, '3.0');
      assert.deepEqual(state.features, {});
    });
  });

  describe('getFeature()', () => {
    it('returns default feature structure for new feature', () => {
      const feature = getFeature('user-auth');
      assert.equal(feature.id, 'user-auth');
      assert.equal(feature.spec, false);
      assert.equal(feature.security_review, false);
      assert.equal(feature.implementation, false);
      assert.equal(feature.tests, false);
      assert.equal(feature.review, false);
    });
  });

  describe('markComplete()', () => {
    it('marks a phase as complete', () => {
      const result = markComplete('user-auth', 'spec', 'docs/specs/user-auth.yaml');
      assert.equal(result.spec, 'docs/specs/user-auth.yaml');
      assert.equal(result.security_review, false);
    });

    it('persists across calls', () => {
      markComplete('user-auth', 'spec');
      markComplete('user-auth', 'implementation');
      const state = loadState();
      assert.ok(state.features['user-auth'].spec);
      assert.ok(state.features['user-auth'].implementation);
    });
  });

  describe('getPendingReviews()', () => {
    it('returns empty when no features tracked', () => {
      const pending = getPendingReviews();
      assert.equal(pending.length, 0);
    });

    it('flags missing security review when implementation exists', () => {
      markComplete('user-auth', 'implementation');
      const pending = getPendingReviews();
      assert.ok(pending.length > 0);
      assert.ok(pending[0].missing.includes('security_review'));
    });

    it('flags missing tests when implementation exists', () => {
      markComplete('user-auth', 'implementation');
      const pending = getPendingReviews();
      assert.ok(pending[0].missing.includes('tests'));
    });
  });

  describe('clearCompleted()', () => {
    it('clears features with all phases done', () => {
      markComplete('done-feature', 'spec');
      markComplete('done-feature', 'security_review');
      markComplete('done-feature', 'implementation');
      markComplete('done-feature', 'tests');
      markComplete('done-feature', 'review');
      const result = clearCompleted();
      assert.equal(result.cleared, 1);
      const features = listFeatures();
      assert.equal(features.length, 0);
    });

    it('does not clear incomplete features', () => {
      markComplete('wip-feature', 'spec');
      markComplete('wip-feature', 'implementation');
      const result = clearCompleted();
      assert.equal(result.cleared, 0);
    });
  });

  describe('listFeatures()', () => {
    it('lists all tracked features', () => {
      markComplete('feat-a', 'spec');
      markComplete('feat-b', 'implementation');
      const features = listFeatures();
      assert.equal(features.length, 2);
    });
  });
});
