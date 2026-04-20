import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { validateHandoff, writeHandoff, readHandoff, listSchemas, loadSchema } from '../handoff.js';

const __moduleDir = path.dirname(fileURLToPath(new URL('../handoff.js', import.meta.url)));
const SCRATCHPAD_DIR = path.resolve(__moduleDir, '..', '..', '.claude', 'scratchpad');

function cleanupHandoff(name) {
  const p = path.join(SCRATCHPAD_DIR, `${name}.json`);
  if (fs.existsSync(p)) fs.unlinkSync(p);
}

describe('handoff', () => {
  describe('listSchemas()', () => {
    it('returns array of schema names', () => {
      const schemas = listSchemas();
      assert.ok(Array.isArray(schemas));
      assert.ok(schemas.includes('spec-complete'));
      assert.ok(schemas.includes('security-approval'));
      assert.ok(schemas.includes('implementation-complete'));
      assert.ok(schemas.includes('qa-approval'));
    });
  });

  describe('loadSchema()', () => {
    it('loads spec-complete schema', () => {
      const s = loadSchema('spec-complete');
      assert.ok(s.type === 'object');
      assert.ok(Array.isArray(s.required));
    });

    it('throws for unknown schema', () => {
      assert.throws(() => loadSchema('nonexistent-schema'), /Schema not found/);
    });
  });

  describe('validateHandoff() — spec-complete', () => {
    const valid = {
      spec_file: '.claude/scratchpad/spec.md',
      spec_type: 'openapi',
      completed_at: '2026-04-20T15:00:00Z',
      summary: 'OpenAPI spec for JWT auth endpoints.',
    };

    it('validates correct spec-complete payload', () => {
      const r = validateHandoff('spec-complete', valid);
      assert.equal(r.valid, true);
    });

    it('fails when required field missing', () => {
      const { spec_file, ...missing } = valid;
      const r = validateHandoff('spec-complete', missing);
      assert.equal(r.valid, false);
      assert.ok(r.errors.some(e => e.includes('spec_file')));
    });

    it('fails for invalid enum value', () => {
      const r = validateHandoff('spec-complete', { ...valid, spec_type: 'invalid-type' });
      assert.equal(r.valid, false);
    });

    it('fails for additional property', () => {
      const r = validateHandoff('spec-complete', { ...valid, unknown_field: 'x' });
      assert.equal(r.valid, false);
    });

    it('accepts optional fields', () => {
      const r = validateHandoff('spec-complete', {
        ...valid,
        endpoints: ['/api/auth/login', '/api/auth/refresh'],
        models: ['User', 'Session'],
        auth_required: true,
      });
      assert.equal(r.valid, true);
    });
  });

  describe('validateHandoff() — security-approval', () => {
    const valid = {
      approved: true,
      reviewed_at: '2026-04-20T15:30:00Z',
      spec_file: '.claude/scratchpad/spec.md',
      findings: { blockers: [], high: [], medium: [], low: [] },
    };

    it('validates correct security-approval payload', () => {
      const r = validateHandoff('security-approval', valid);
      assert.equal(r.valid, true);
    });

    it('validates with findings containing items', () => {
      const r = validateHandoff('security-approval', {
        ...valid,
        findings: {
          blockers: [{ id: 'S-001', description: 'SQL injection', category: 'injection' }],
          high: [],
          medium: [],
          low: [],
        },
      });
      assert.equal(r.valid, true);
    });

    it('fails when finding missing required field', () => {
      const r = validateHandoff('security-approval', {
        ...valid,
        findings: {
          blockers: [{ id: 'S-001', description: 'issue' }],
          high: [], medium: [], low: [],
        },
      });
      assert.equal(r.valid, false);
    });

    it('fails when findings key missing', () => {
      const { findings, ...missing } = valid;
      const r = validateHandoff('security-approval', missing);
      assert.equal(r.valid, false);
    });
  });

  describe('validateHandoff() — implementation-complete', () => {
    const valid = {
      completed_at: '2026-04-20T16:00:00Z',
      summary: 'JWT auth domain layer and adapters implemented.',
      files_changed: ['src/domain/auth.js', 'src/adapters/auth-router.js'],
    };

    it('validates correct implementation-complete payload', () => {
      const r = validateHandoff('implementation-complete', valid);
      assert.equal(r.valid, true);
    });

    it('fails when files_changed not array', () => {
      const r = validateHandoff('implementation-complete', { ...valid, files_changed: 'not-array' });
      assert.equal(r.valid, false);
    });

    it('accepts architecture_layer enum values', () => {
      for (const layer of ['domain', 'application', 'adapter', 'full-stack', 'infrastructure']) {
        const r = validateHandoff('implementation-complete', { ...valid, architecture_layer: layer });
        assert.equal(r.valid, true, `layer "${layer}" should be valid`);
      }
    });

    it('rejects invalid architecture_layer', () => {
      const r = validateHandoff('implementation-complete', { ...valid, architecture_layer: 'unknown' });
      assert.equal(r.valid, false);
    });
  });

  describe('validateHandoff() — qa-approval', () => {
    const valid = {
      approved: true,
      reviewed_at: '2026-04-20T17:00:00Z',
      test_summary: { total: 50, passing: 50, failing: 0 },
    };

    it('validates correct qa-approval payload', () => {
      const r = validateHandoff('qa-approval', valid);
      assert.equal(r.valid, true);
    });

    it('fails when test_summary missing required field', () => {
      const r = validateHandoff('qa-approval', {
        ...valid,
        test_summary: { total: 50, passing: 50 },
      });
      assert.equal(r.valid, false);
    });

    it('accepts spec_drift enum', () => {
      for (const drift of ['none', 'minor', 'significant']) {
        const r = validateHandoff('qa-approval', { ...valid, spec_drift: drift });
        assert.equal(r.valid, true, `drift "${drift}" should be valid`);
      }
    });
  });

  describe('writeHandoff() + readHandoff()', () => {
    const schemaName = 'spec-complete';
    const valid = {
      spec_file: '.claude/scratchpad/spec.md',
      spec_type: 'openapi',
      completed_at: '2026-04-20T15:00:00Z',
      summary: 'Test spec.',
    };

    afterEach(() => cleanupHandoff(schemaName));

    it('writes valid handoff to scratchpad', () => {
      const outPath = writeHandoff(schemaName, valid);
      assert.ok(fs.existsSync(outPath));
    });

    it('throws on invalid handoff write', () => {
      const { spec_file, ...invalid } = valid;
      assert.throws(() => writeHandoff(schemaName, invalid), /Validation failed/);
    });

    it('reads and validates written handoff', () => {
      writeHandoff(schemaName, valid);
      const data = readHandoff(schemaName);
      assert.equal(data.spec_file, valid.spec_file);
      assert.equal(data.spec_type, valid.spec_type);
    });

    it('throws when reading nonexistent handoff', () => {
      assert.throws(() => readHandoff('nonexistent-schema'), /not found|Schema not found/);
    });
  });
});
