import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { estimate, formatEstimate, dashboard } from '../token-estimator.js';

describe('token-estimator', () => {
  describe('estimate()', () => {
    it('returns structured result for build S', () => {
      const r = estimate('build', 'S');
      assert.equal(r.command, 'build');
      assert.equal(r.size, 'S');
      assert.equal(r.sizeLabel, 'Small');
      assert.ok(Array.isArray(r.phases));
      assert.ok(r.total > 0);
    });

    it('build L has more phases than build S', () => {
      const s = estimate('build', 'S');
      const l = estimate('build', 'L');
      assert.ok(l.phases.length > s.phases.length, 'L should have more phases (arch + spec)');
      assert.ok(l.total > s.total, 'L should cost more tokens');
    });

    it('build XL costs more than build M', () => {
      const m = estimate('build', 'M');
      const xl = estimate('build', 'XL');
      assert.ok(xl.total > m.total);
    });

    it('returns phases only for applicable sizes', () => {
      const s = estimate('build', 'S');
      const phaseNames = s.phases.map(p => p.phase);
      assert.ok(!phaseNames.some(n => n.includes('Architecture')), 'Arch phase should not run for S');
      assert.ok(!phaseNames.some(n => n.includes('Spec')), 'Spec phase should not run for S');
    });

    it('returns arch phase for L', () => {
      const l = estimate('build', 'L');
      assert.ok(l.phases.some(p => p.phase.includes('Architecture')));
    });

    it('all 11 commands produce valid estimates', () => {
      const commands = ['build', 'fix', 'review', 'secure', 'test', 'deploy', 'design', 'ml', 'data', 'refactor', 'audit'];
      for (const cmd of commands) {
        const r = estimate(cmd, 'M');
        assert.ok(r.total > 0, `${cmd} should have nonzero total`);
        assert.ok(r.phases.length > 0, `${cmd} should have phases`);
      }
    });

    it('throws on unknown command', () => {
      assert.throws(() => estimate('unknown', 'M'), /Unknown command/);
    });

    it('throws on invalid size', () => {
      assert.throws(() => estimate('build', 'XXL'), /Invalid size/);
    });
  });

  describe('formatEstimate()', () => {
    it('returns a non-empty string', () => {
      const r = estimate('build', 'M');
      const out = formatEstimate(r);
      assert.ok(typeof out === 'string');
      assert.ok(out.length > 0);
    });

    it('includes total line', () => {
      const r = estimate('build', 'M');
      const out = formatEstimate(r);
      assert.ok(out.includes('TOTAL'));
    });

    it('includes command and size in header', () => {
      const r = estimate('build', 'L');
      const out = formatEstimate(r);
      assert.ok(out.includes('/build'));
      assert.ok(out.includes('[L]'));
    });
  });

  describe('dashboard()', () => {
    it('returns a string with all commands', () => {
      const out = dashboard('M');
      assert.ok(typeof out === 'string');
      assert.ok(out.includes('/build'));
      assert.ok(out.includes('/fix'));
      assert.ok(out.includes('/audit'));
    });
  });
});
