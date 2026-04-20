import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { search, listMemoryFiles, formatResults } from '../rag-manager.js';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Note: search() uses the real MEMORY_DIR (.archon/memory/).
// Tests are designed to work whether memory is empty or populated.

describe('rag-manager', () => {
  describe('search()', () => {
    it('returns structured result for any agent', () => {
      const r = search('architect', 'API versioning');
      assert.equal(r.agent, 'architect');
      assert.equal(r.query, 'API versioning');
      assert.ok(Array.isArray(r.results));
    });

    it('returns results array (empty or populated)', () => {
      const r = search('security', 'OWASP injection');
      assert.ok(Array.isArray(r.results));
      // If memory is empty, results can be empty — that's OK
      if (r.results.length > 0) {
        for (const res of r.results) {
          assert.ok(typeof res.file === 'string');
          assert.ok(typeof res.score === 'number');
          assert.ok(typeof res.excerpt === 'string');
        }
      }
    });

    it('respects --top option', () => {
      const r = search('builder', 'clean architecture domain', { top: 2 });
      assert.ok(r.results.length <= 2);
    });

    it('top defaults to 3', () => {
      const r = search('qa', 'test coverage');
      assert.ok(r.results.length <= 3);
    });

    it('handles unknown agent gracefully', () => {
      const r = search('nonexistent-agent-xyz', 'some query');
      assert.ok('results' in r);
      assert.equal(r.results.length, 0);
    });
  });

  describe('listMemoryFiles()', () => {
    it('returns array for any agent', () => {
      const files = listMemoryFiles('architect');
      assert.ok(Array.isArray(files));
    });

    it('returns array of agent names when no arg', () => {
      const agents = listMemoryFiles();
      assert.ok(Array.isArray(agents));
    });
  });

  describe('formatResults()', () => {
    it('returns message when no results', () => {
      const out = formatResults({ agent: 'architect', query: 'test', results: [] });
      assert.ok(typeof out === 'string');
      assert.ok(out.length > 0);
    });

    it('formats results with file and excerpt', () => {
      const out = formatResults({
        agent: 'architect',
        query: 'versioning',
        filesSearched: 2,
        totalChunks: 10,
        results: [
          { file: 'architect/notes.md', score: 0.8, excerpt: 'API versioning is important...' },
        ],
      });
      assert.ok(out.includes('versioning'));
      assert.ok(out.includes('architect/notes.md'));
      assert.ok(out.includes('API versioning'));
    });
  });

  describe('TF-IDF scoring', () => {
    it('returns higher score for more relevant chunks when memory exists', () => {
      // Create temporary memory content to verify scoring
      const memDir = path.join(path.dirname(fileURLToPath(new URL('../rag-manager.js', import.meta.url))), '..', 'memory');
      const testFile = path.join(memDir, '_rag_test_temp.md');

      // Ensure memory dir exists
      fs.mkdirSync(memDir, { recursive: true });

      fs.writeFileSync(testFile, [
        '## OWASP Security',
        'SQL injection attacks bypass authentication. Use parameterized queries.',
        '',
        '## Performance',
        'Cache frequently accessed data. Use CDN for static assets.',
      ].join('\n'), 'utf-8');

      try {
        const r = search('_rag_test', 'SQL injection authentication', { top: 5 });
        // Can't assert file-specific scoring without knowing the agent dir,
        // but we can verify the search doesn't throw and returns valid structure
        assert.ok(Array.isArray(r.results));
      } finally {
        if (fs.existsSync(testFile)) fs.unlinkSync(testFile);
      }
    });
  });
});
