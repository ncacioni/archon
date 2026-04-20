import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyTransform, TRANSFORMS } from '../fast-path.js';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

function withTempFile(content, fn) {
  const tmp = path.join(os.tmpdir(), `fast-path-test-${Date.now()}.js`);
  fs.writeFileSync(tmp, content, 'utf-8');
  try {
    return fn(tmp);
  } finally {
    if (fs.existsSync(tmp)) fs.unlinkSync(tmp);
  }
}

describe('fast-path transforms', () => {
  describe('TRANSFORMS registry', () => {
    it('exports all 6 transforms', () => {
      const expected = ['var-to-const', 'remove-console', 'sort-imports', 'normalize-quotes', 'add-strict', 'remove-unused-vars'];
      for (const name of expected) {
        assert.ok(Object.hasOwn(TRANSFORMS, name), `Missing transform: ${name}`);
      }
    });
  });

  describe('var-to-const', () => {
    it('replaces var with const', () => {
      withTempFile('var x = 1;\nvar y = 2;\n', (f) => {
        const r = applyTransform('var-to-const', f);
        assert.ok(r.changed);
        const out = fs.readFileSync(f, 'utf-8');
        assert.ok(!out.includes('var '));
        assert.ok(out.includes('const x'));
        assert.ok(out.includes('const y'));
      });
    });

    it('does not change file without var', () => {
      withTempFile('const x = 1;\nlet y = 2;\n', (f) => {
        const r = applyTransform('var-to-const', f);
        assert.equal(r.changed, false);
      });
    });
  });

  describe('remove-console', () => {
    it('removes console.log lines', () => {
      withTempFile('const x = 1;\nconsole.log("hello");\nreturn x;\n', (f) => {
        const r = applyTransform('remove-console', f);
        assert.ok(r.changed);
        const out = fs.readFileSync(f, 'utf-8');
        assert.ok(!out.includes('console.log'));
        assert.ok(out.includes('const x'));
        assert.ok(out.includes('return x'));
      });
    });

    it('removes multiple console variants', () => {
      withTempFile('console.warn("a");\nconsole.error("b");\nconsole.debug("c");\n', (f) => {
        const r = applyTransform('remove-console', f);
        assert.ok(r.changed);
        const out = fs.readFileSync(f, 'utf-8');
        assert.equal(out.trim(), '');
      });
    });

    it('does not change file without console', () => {
      withTempFile('const x = 1;\nreturn x;\n', (f) => {
        const r = applyTransform('remove-console', f);
        assert.equal(r.changed, false);
      });
    });
  });

  describe('sort-imports', () => {
    it('sorts imports alphabetically', () => {
      withTempFile("import z from 'z';\nimport a from 'a';\nimport m from 'm';\n\nconst x = 1;\n", (f) => {
        const r = applyTransform('sort-imports', f);
        assert.ok(r.changed);
        const out = fs.readFileSync(f, 'utf-8');
        const lines = out.split('\n').filter(l => l.startsWith('import'));
        assert.equal(lines[0], "import a from 'a';");
        assert.equal(lines[1], "import m from 'm';");
        assert.equal(lines[2], "import z from 'z';");
      });
    });

    it('does not change already sorted imports', () => {
      withTempFile("import a from 'a';\nimport z from 'z';\n", (f) => {
        const r = applyTransform('sort-imports', f);
        assert.equal(r.changed, false);
      });
    });
  });

  describe('normalize-quotes', () => {
    it('converts double quotes to single quotes', () => {
      withTempFile('const x = "hello";\nconst y = "world";\n', (f) => {
        const r = applyTransform('normalize-quotes', f);
        assert.ok(r.changed);
        const out = fs.readFileSync(f, 'utf-8');
        assert.ok(out.includes("'hello'"));
        assert.ok(out.includes("'world'"));
      });
    });

    it('leaves strings with internal single quotes unchanged', () => {
      withTempFile('const x = "it\'s fine";\n', (f) => {
        const r = applyTransform('normalize-quotes', f);
        assert.equal(r.changed, false);
      });
    });
  });

  describe('add-strict', () => {
    it('adds use strict to CommonJS file', () => {
      withTempFile('function foo() {}\nmodule.exports = foo;\n', (f) => {
        const r = applyTransform('add-strict', f);
        assert.ok(r.changed);
        const out = fs.readFileSync(f, 'utf-8');
        assert.ok(out.startsWith("'use strict'"));
      });
    });

    it('does not add use strict to ES module', () => {
      withTempFile("import foo from 'foo';\nexport default foo;\n", (f) => {
        const r = applyTransform('add-strict', f);
        assert.equal(r.changed, false);
      });
    });

    it('does not duplicate use strict', () => {
      withTempFile("'use strict';\nfunction foo() {}\n", (f) => {
        const r = applyTransform('add-strict', f);
        assert.equal(r.changed, false);
      });
    });
  });

  describe('remove-unused-vars', () => {
    it('annotates unused const declarations', () => {
      withTempFile('const unused = 42;\nconst used = 1;\nreturn used;\n', (f) => {
        const r = applyTransform('remove-unused-vars', f);
        assert.ok(r.changed);
        const out = fs.readFileSync(f, 'utf-8');
        assert.ok(out.includes('// fast-path: unused'));
        assert.ok(!out.split('\n').find(l => l.includes('used = 1') && l.includes('fast-path')));
      });
    });

    it('does not annotate variables that are used', () => {
      withTempFile('const x = 1;\nreturn x;\n', (f) => {
        const r = applyTransform('remove-unused-vars', f);
        assert.equal(r.changed, false);
      });
    });
  });

  describe('dry-run mode', () => {
    it('does not write file in dry-run mode', () => {
      withTempFile('var x = 1;\n', (f) => {
        const original = fs.readFileSync(f, 'utf-8');
        const r = applyTransform('var-to-const', f, { dryRun: true });
        assert.ok(r.changed);
        assert.ok(r.dryRun);
        const after = fs.readFileSync(f, 'utf-8');
        assert.equal(after, original);
      });
    });
  });

  describe('error handling', () => {
    it('throws on unknown transform', () => {
      assert.throws(() => applyTransform('nonexistent', 'any.js'), /Unknown transform/);
    });

    it('throws on missing file', () => {
      assert.throws(() => applyTransform('var-to-const', '/nonexistent/path/file.js'), /File not found/);
    });
  });
});
