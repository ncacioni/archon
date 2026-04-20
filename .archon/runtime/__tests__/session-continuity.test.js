import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  startSession,
  updatePhase,
  completePhase,
  addDecision,
  completeSession,
  getSessionBrief,
} from '../session-continuity.js';

// SESSION.md is written to project root (2 levels up from .archon/runtime/)
const __moduleDir = path.dirname(fileURLToPath(new URL('../session-continuity.js', import.meta.url)));
const SESSION_PATH = path.resolve(__moduleDir, '..', '..', 'SESSION.md');

function cleanup() {
  if (fs.existsSync(SESSION_PATH)) fs.unlinkSync(SESSION_PATH);
}

describe('session-continuity', () => {
  beforeEach(cleanup);
  afterEach(cleanup);

  describe('startSession()', () => {
    it('creates SESSION.md at project root', () => {
      startSession('build', 'Add JWT authentication');
      assert.ok(fs.existsSync(SESSION_PATH));
    });

    it('writes correct header', () => {
      startSession('build', 'Add JWT authentication');
      const content = fs.readFileSync(SESSION_PATH, 'utf-8');
      assert.ok(content.includes('# Active Session — /build Add JWT authentication'));
    });

    it('includes Started timestamp', () => {
      startSession('fix', 'Login returns 500');
      const content = fs.readFileSync(SESSION_PATH, 'utf-8');
      assert.ok(content.includes('**Started:**'));
    });

    it('returns session object with correct command', () => {
      const s = startSession('review', 'Payment module');
      assert.equal(s.command, 'review');
      assert.equal(s.description, 'Payment module');
    });

    it('starts with empty completed phases', () => {
      const s = startSession('build', 'Test');
      assert.equal(s.completed.length, 0);
    });

    it('starts with empty decisions', () => {
      const s = startSession('build', 'Test');
      assert.equal(s.decisions.length, 0);
    });
  });

  describe('updatePhase()', () => {
    it('updates in-progress phase', () => {
      startSession('build', 'Add auth');
      updatePhase('build', 'phase-1', 'Analysis complete');
      const content = fs.readFileSync(SESSION_PATH, 'utf-8');
      assert.ok(content.includes('phase-1: Analysis complete'));
    });

    it('updates status line', () => {
      startSession('build', 'Add auth');
      updatePhase('build', 'phase-3', 'Writing spec');
      const content = fs.readFileSync(SESSION_PATH, 'utf-8');
      assert.ok(content.includes('In progress — phase-3'));
    });

    it('throws when no session for command', () => {
      assert.throws(() => updatePhase('build', 'phase-1', 'test'), /No active session/);
    });

    it('throws when command differs', () => {
      startSession('fix', 'some bug');
      assert.throws(() => updatePhase('build', 'phase-1', 'test'), /No active session/);
    });
  });

  describe('completePhase()', () => {
    it('adds phase to completed list', () => {
      startSession('build', 'Add auth');
      completePhase('build', 'phase-1', 'Analysis done');
      const content = fs.readFileSync(SESSION_PATH, 'utf-8');
      assert.ok(content.includes('✓ phase-1: Analysis done'));
    });

    it('does not duplicate completed phases', () => {
      startSession('build', 'Add auth');
      completePhase('build', 'phase-1', 'Analysis done');
      completePhase('build', 'phase-1', 'Analysis done');
      const content = fs.readFileSync(SESSION_PATH, 'utf-8');
      const matches = content.match(/✓ phase-1: Analysis done/g);
      assert.equal(matches?.length, 1);
    });

    it('accumulates multiple phases', () => {
      startSession('build', 'Add auth');
      completePhase('build', 'phase-1', 'Analysis');
      completePhase('build', 'phase-2', 'Design');
      const content = fs.readFileSync(SESSION_PATH, 'utf-8');
      assert.ok(content.includes('✓ phase-1: Analysis'));
      assert.ok(content.includes('✓ phase-2: Design'));
    });

    it('throws when no session for command', () => {
      assert.throws(() => completePhase('build', 'phase-1', 'test'), /No active session/);
    });
  });

  describe('addDecision()', () => {
    it('adds decision to Key Decisions section', () => {
      startSession('build', 'Add auth');
      addDecision('build', 'Use HS256', 'single-service deployment');
      const content = fs.readFileSync(SESSION_PATH, 'utf-8');
      assert.ok(content.includes('Use HS256 — single-service deployment'));
    });

    it('accumulates multiple decisions', () => {
      startSession('build', 'Add auth');
      addDecision('build', 'Use HS256', 'single service');
      addDecision('build', 'httpOnly cookies', 'XSS prevention');
      const content = fs.readFileSync(SESSION_PATH, 'utf-8');
      assert.ok(content.includes('Use HS256 — single service'));
      assert.ok(content.includes('httpOnly cookies — XSS prevention'));
    });

    it('throws when no session for command', () => {
      assert.throws(() => addDecision('build', 'x', 'y'), /No active session/);
    });
  });

  describe('completeSession()', () => {
    it('returns false when no session', () => {
      assert.equal(completeSession(), false);
    });

    it('marks session as completed without --clear', () => {
      startSession('build', 'Add auth');
      completeSession(false);
      assert.ok(fs.existsSync(SESSION_PATH));
      const content = fs.readFileSync(SESSION_PATH, 'utf-8');
      assert.ok(content.includes('Completed'));
    });

    it('removes SESSION.md with --clear', () => {
      startSession('build', 'Add auth');
      completeSession(true);
      assert.ok(!fs.existsSync(SESSION_PATH));
    });

    it('returns true when session exists', () => {
      startSession('build', 'Add auth');
      assert.equal(completeSession(true), true);
    });
  });

  describe('getSessionBrief()', () => {
    it('returns null when no session', () => {
      assert.equal(getSessionBrief(), null);
    });

    it('returns brief string with command', () => {
      startSession('build', 'Add auth');
      const brief = getSessionBrief();
      assert.ok(typeof brief === 'string');
      assert.ok(brief.includes('/build'));
    });

    it('shows completed count when phases done', () => {
      startSession('build', 'Add auth');
      completePhase('build', 'phase-1', 'Done');
      const brief = getSessionBrief();
      assert.ok(brief.includes('1 phase'));
    });

    it('shows in-progress phase', () => {
      startSession('build', 'Add auth');
      updatePhase('build', 'phase-2', 'Writing spec');
      const brief = getSessionBrief();
      assert.ok(brief.includes('phase-2'));
    });
  });
});
