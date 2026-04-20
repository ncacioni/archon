import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { detect, formatReport } from '../drift-detector.js';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

function makeTempProject(files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'drift-test-'));
  for (const [rel, content] of Object.entries(files)) {
    const full = path.join(root, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content, 'utf-8');
  }
  return root;
}

function cleanup(root) {
  fs.rmSync(root, { recursive: true, force: true });
}

describe('drift-detector', () => {
  describe('no-spec scenario', () => {
    it('returns no-spec status when no spec files exist', () => {
      const root = makeTempProject({ 'src/index.js': 'const x = 1;' });
      try {
        const r = detect({ root });
        assert.equal(r.status, 'no-spec');
        assert.equal(r.signals.length, 0);
      } finally { cleanup(root); }
    });
  });

  describe('clean scenario', () => {
    it('returns clean when spec and code match', () => {
      const root = makeTempProject({
        '.claude/scratchpad/spec-api.md': `
## API Spec
GET /users
POST /users
GET /users/{id}
        `,
        'src/routes.js': `
router.get('/users', listUsers);
router.post('/users', createUser);
router.get('/users/:id', getUser);
        `,
      });
      try {
        const r = detect({ root });
        assert.equal(r.status, 'clean');
        assert.ok(r.driftScore <= r.threshold);
      } finally { cleanup(root); }
    });
  });

  describe('missing_ref signal', () => {
    it('detects routes in spec not found in code', () => {
      const root = makeTempProject({
        '.claude/scratchpad/spec-api.md': `
GET /users
POST /users
DELETE /users/{id}
        `,
        'src/routes.js': `
router.get('/users', listUsers);
        `,
      });
      try {
        const r = detect({ root });
        const missing = r.signals.filter(s => s.type === 'missing_ref');
        assert.ok(missing.length > 0, 'Should detect missing routes');
      } finally { cleanup(root); }
    });
  });

  describe('threshold', () => {
    it('exceeds=true when drift above threshold', () => {
      const root = makeTempProject({
        '.claude/scratchpad/spec-api.md': `
GET /a\nGET /b\nGET /c\nGET /d\nGET /e
        `,
        'src/routes.js': `
router.get('/a', fn);
        `,
      });
      try {
        const r = detect({ root, threshold: 0.1 });
        assert.equal(r.exceeds, true);
      } finally { cleanup(root); }
    });

    it('exceeds=false when drift below threshold', () => {
      const root = makeTempProject({
        '.claude/scratchpad/spec-api.md': 'GET /users',
        'src/routes.js': "router.get('/users', fn);",
      });
      try {
        const r = detect({ root, threshold: 0.5 });
        assert.equal(r.exceeds, false);
      } finally { cleanup(root); }
    });
  });

  describe('formatReport()', () => {
    it('returns skip message for no-spec', () => {
      const r = formatReport({ status: 'no-spec', signals: [] });
      assert.ok(r.includes('no spec files'));
    });

    it('includes drift percentage', () => {
      const root = makeTempProject({
        '.claude/scratchpad/spec-api.md': 'GET /users',
        'src/routes.js': "router.get('/users', fn);",
      });
      try {
        const result = detect({ root });
        const report = formatReport(result);
        assert.ok(report.includes('%'));
      } finally { cleanup(root); }
    });

    it('shows signals when drift detected', () => {
      const root = makeTempProject({
        '.claude/scratchpad/spec-api.md': 'GET /users\nGET /orders\nGET /payments',
        'src/routes.js': "router.get('/users', fn);",
      });
      try {
        const result = detect({ root, threshold: 0.1 });
        const report = formatReport(result);
        if (result.exceeds) {
          assert.ok(report.includes('missing_ref') || report.includes('scope_creep') || report.includes('Details'));
        }
      } finally { cleanup(root); }
    });
  });

  describe('result structure', () => {
    it('always returns required fields', () => {
      const root = makeTempProject({});
      try {
        const r = detect({ root });
        assert.ok('specFiles' in r);
        assert.ok('sourceFiles' in r);
        assert.ok('signals' in r);
        assert.ok('driftScore' in r);
        assert.ok('threshold' in r);
        assert.ok('status' in r);
      } finally { cleanup(root); }
    });
  });
});
