#!/usr/bin/env node
// Reads Claude Code PreToolUse hook payload from stdin and blocks dangerous commands.
// Exit 0 = allow, Exit 2 = block (Claude Code will not execute the tool call).

import { createInterface } from 'node:readline';

const BLOCKED_PATTERNS = [
  { pattern: /(?:^|&&|\|\||;\s*|\|\s*)(?:\s*(?:cd\s+\S+\s*&&\s*)?)npm\s+publish\b/, reason: 'npm publish blocked — use CI/CD pipeline for releases' },
  { pattern: /\bDROP\s+TABLE\b/i, reason: 'DROP TABLE blocked — destructive database operation requires manual execution' },
  { pattern: /\bDROP\s+DATABASE\b/i, reason: 'DROP DATABASE blocked — destructive database operation requires manual execution' },
  { pattern: /\bsudo\s+rm\b/, reason: 'sudo rm blocked — use targeted file removal without sudo' },
  { pattern: /\brm\s+-rf\s+\//, reason: 'rm -rf / blocked — would delete entire filesystem' },
  { pattern: /\bgit\s+push\b.*\s--force(?!-with-lease)/, reason: 'git push --force blocked — use --force-with-lease or rebase strategy' },
  { pattern: /\bgit\s+push\b.*\s-f(\s|$)/, reason: 'git push -f blocked — use --force-with-lease or rebase strategy' },
  { pattern: /\bgit\s+reset\s+--hard\s+origin\/main\b/, reason: 'git reset --hard origin/main blocked — would discard local commits' },
  { pattern: /\bchmod\s+777\b/, reason: 'chmod 777 blocked — overly permissive file permissions' },
];

function stripQuotedStrings(cmd) {
  // Remove contents of double-quoted and single-quoted strings to avoid
  // matching blocked patterns that appear only inside string literals
  return cmd
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/\$\((?:[^)]*)\)/g, '$()');
}

function check(command) {
  const stripped = stripQuotedStrings(command);
  for (const { pattern, reason } of BLOCKED_PATTERNS) {
    if (pattern.test(stripped)) {
      return { blocked: true, reason };
    }
  }
  return { blocked: false };
}

async function main() {
  const chunks = [];
  const rl = createInterface({ input: process.stdin });

  for await (const line of rl) {
    chunks.push(line);
  }

  const raw = chunks.join('\n').trim();
  if (!raw) process.exit(0);

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    // Non-JSON input — allow through
    process.exit(0);
  }

  const command = payload?.tool_input?.command ?? payload?.input?.command ?? '';
  if (!command) process.exit(0);

  const result = check(command);
  if (result.blocked) {
    console.error(`[Archon Hook] Blocked: ${result.reason}`);
    process.exit(2);
  }

  process.exit(0);
}

main();

export { check };
