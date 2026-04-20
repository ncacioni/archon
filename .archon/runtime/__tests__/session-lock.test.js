import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Override SESSION_PATH by monkey-patching — we import after setting env
process.env.ARCHON_SESSION_TTL_HOURS = '2';

// Import after env is set
const { readSession, writeCheckpoint, completePhase, clearSession, checkResume, isStale, formatStatus } =
  await import('../session-lock.js');

// Derive the same SESSION_PATH as session-lock.js uses
const __moduleDir = path.dirname(fileURLToPath(new URL('../session-lock.js', import.meta.url)));
const SESSION_PATH = path.join(__moduleDir, '..', 'session.json');

function cleanupSession() {
  if (fs.existsSync(SESSION_PATH)) fs.unlinkSync(SESSION_PATH);
}

describe('session-lock', () => {
  beforeEach(cleanupSession);
  afterEach(cleanupSession);

  describe('readSession()', () => {
    it('returns null when no session file exists', () => {
      assert.equal(readSession(), null);
    });

    it('returns parsed session when file exists', () => {
      writeCheckpoint('build', 'phase-1');
      const s = readSession();
      assert.ok(s !== null);
      assert.equal(s.command, 'build');
    });
  });

  describe('writeCheckpoint()', () => {
    it('creates session.json with correct structure', () => {
      const s = writeCheckpoint('build', 'phase-1', ['spec.md']);
      assert.equal(s.command, 'build');
      assert.equal(s.current_phase, 'phase-1');
      assert.ok(Array.isArray(s.completed_phases));
      assert.ok(s.artifacts_written.includes('spec.md'));
      assert.ok(typeof s.timestamp === 'string');
    });

    it('accumulates artifacts across calls', () => {
      writeCheckpoint('build', 'phase-1', ['spec.md']);
      const s2 = writeCheckpoint('build', 'phase-2', ['security.md']);
      assert.ok(s2.artifacts_written.includes('spec.md'));
      assert.ok(s2.artifacts_written.includes('security.md'));
    });

    it('preserves started_at across updates', () => {
      const s1 = writeCheckpoint('build', 'phase-1');
      const s2 = writeCheckpoint('build', 'phase-2');
      assert.equal(s1.started_at, s2.started_at);
    });
  });

  describe('completePhase()', () => {
    it('adds phase to completed_phases', () => {
      writeCheckpoint('build', 'phase-1');
      const s = completePhase('build', 'phase-1');
      assert.ok(s.completed_phases.includes('phase-1'));
    });

    it('does not duplicate completed phases', () => {
      writeCheckpoint('build', 'phase-1');
      completePhase('build', 'phase-1');
      const s = completePhase('build', 'phase-1');
      assert.equal(s.completed_phases.filter(p => p === 'phase-1').length, 1);
    });
  });

  describe('clearSession()', () => {
    it('removes session file and returns true', () => {
      writeCheckpoint('build', 'phase-1');
      const result = clearSession();
      assert.equal(result, true);
      assert.equal(readSession(), null);
    });

    it('returns false when no session exists', () => {
      assert.equal(clearSession(), false);
    });
  });

  describe('isStale()', () => {
    it('returns true for null session', () => {
      assert.equal(isStale(null), true);
    });

    it('returns false for fresh session', () => {
      const s = { timestamp: new Date().toISOString() };
      assert.equal(isStale(s), false);
    });

    it('returns true for old session (>2h)', () => {
      const old = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();
      assert.equal(isStale({ timestamp: old }), true);
    });
  });

  describe('checkResume()', () => {
    it('returns canResume: false when no session', () => {
      const r = checkResume('build');
      assert.equal(r.canResume, false);
    });

    it('returns canResume: false when command differs', () => {
      writeCheckpoint('fix', 'analyze');
      const r = checkResume('build');
      assert.equal(r.canResume, false);
      assert.ok(r.reason.includes('fix'));
    });

    it('returns canResume: true for matching active session', () => {
      writeCheckpoint('build', 'phase-3');
      const r = checkResume('build');
      assert.equal(r.canResume, true);
      assert.equal(r.resumeFrom, 'phase-3');
    });

    it('returns stale: true for expired session', () => {
      const staleSession = {
        command: 'build',
        current_phase: 'phase-2',
        started_at: new Date(Date.now() - 5 * 3600 * 1000).toISOString(),
        timestamp: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        completed_phases: [],
        artifacts_written: [],
      };
      fs.writeFileSync(SESSION_PATH, JSON.stringify(staleSession, null, 2), 'utf-8');
      const r = checkResume('build');
      assert.equal(r.canResume, false);
      assert.equal(r.stale, true);
    });
  });

  describe('formatStatus()', () => {
    it('returns "No active session." for null', () => {
      assert.equal(formatStatus(null), 'No active session.');
    });

    it('includes command and phase in output', () => {
      const s = writeCheckpoint('build', 'phase-3');
      const out = formatStatus(s);
      assert.ok(out.includes('/build'));
      assert.ok(out.includes('phase-3'));
    });
  });
});
