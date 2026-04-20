import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { check } from '../../hooks/pre-bash.js';

describe('pre-bash hook', () => {
  describe('blocked commands', () => {
    it('blocks npm publish', () => {
      const r = check('npm publish');
      assert.equal(r.blocked, true);
      assert.ok(r.reason.includes('npm publish'));
    });

    it('blocks npm publish with flags', () => {
      const r = check('cd my-pkg && npm publish --access public');
      assert.equal(r.blocked, true);
    });

    it('blocks DROP TABLE (uppercase)', () => {
      const r = check('psql -c "DROP TABLE users;"');
      assert.equal(r.blocked, true);
    });

    it('blocks DROP TABLE (lowercase)', () => {
      const r = check('psql -c "drop table sessions;"');
      assert.equal(r.blocked, true);
    });

    it('blocks DROP DATABASE', () => {
      const r = check('psql -c "DROP DATABASE mydb;"');
      assert.equal(r.blocked, true);
    });

    it('blocks sudo rm', () => {
      const r = check('sudo rm -rf /etc/config');
      assert.equal(r.blocked, true);
    });

    it('blocks rm -rf /', () => {
      const r = check('rm -rf /');
      assert.equal(r.blocked, true);
    });

    it('blocks git push --force', () => {
      const r = check('git push origin main --force');
      assert.equal(r.blocked, true);
    });

    it('blocks git push -f', () => {
      const r = check('git push origin main -f');
      assert.equal(r.blocked, true);
    });

    it('blocks git reset --hard origin/main', () => {
      const r = check('git reset --hard origin/main');
      assert.equal(r.blocked, true);
    });

    it('blocks chmod 777', () => {
      const r = check('chmod 777 ./script.sh');
      assert.equal(r.blocked, true);
    });
  });

  describe('allowed commands', () => {
    it('allows git commit with npm publish in message string', () => {
      const r = check('git commit -m "blocks npm publish"');
      assert.equal(r.blocked, false);
    });

    it('allows gh pr with npm publish in body text', () => {
      const r = check('gh pr edit --body "text about npm publish here"');
      assert.equal(r.blocked, false);
    });

    it('allows git push without --force', () => {
      const r = check('git push origin main');
      assert.equal(r.blocked, false);
    });

    it('allows git push --force-with-lease', () => {
      const r = check('git push origin feature --force-with-lease');
      assert.equal(r.blocked, false);
    });

    it('allows npm install', () => {
      const r = check('npm install express');
      assert.equal(r.blocked, false);
    });

    it('allows npm run build', () => {
      const r = check('npm run build');
      assert.equal(r.blocked, false);
    });

    it('allows rm of a specific file', () => {
      const r = check('rm ./tmp/output.json');
      assert.equal(r.blocked, false);
    });

    it('allows chmod 755', () => {
      const r = check('chmod 755 ./bin/archon');
      assert.equal(r.blocked, false);
    });

    it('allows SELECT queries', () => {
      const r = check('psql -c "SELECT * FROM users LIMIT 10;"');
      assert.equal(r.blocked, false);
    });

    it('allows node --test', () => {
      const r = check('node --test __tests__/*.test.js');
      assert.equal(r.blocked, false);
    });

    it('allows empty string', () => {
      const r = check('');
      assert.equal(r.blocked, false);
    });
  });

  describe('result structure', () => {
    it('blocked result has reason string', () => {
      const r = check('npm publish');
      assert.ok(typeof r.reason === 'string');
      assert.ok(r.reason.length > 0);
    });

    it('allowed result has no reason', () => {
      const r = check('git status');
      assert.equal(r.blocked, false);
      assert.equal(r.reason, undefined);
    });
  });
});
