Review code for quality, architecture compliance, and security issues.

## Output Protocol

**MANDATORY**: You MUST output visible text to the user after completing each phase. This is not optional. The user must see real-time progress as the pipeline executes.

Between every phase:
1. Output a brief status update (3-5 lines) describing what was done, key decisions made, and issues found
2. If in plan mode, still output commentary — do not silently plan without explanation
3. Write artifacts to scratchpad AND summarize findings in visible text

**Silent execution is a bug.** If the user sees no output between agent spawns, the pipeline is broken.

## Input
$ARGUMENTS

If no specific files/PR provided, review recent changes (git diff, staged files).

## Pipeline

### Pre-phase: Agent Resolution

Resolve all agents needed for this pipeline upfront.

Run:
```
node .archon/runtime/config-loader.js resolve-all qa security --output .claude/scratchpad/agent-map.json
```

Read `.claude/scratchpad/agent-map.json` for ALL subsequent phases. When a phase says "spawn the **X**", look up `agents["X"]` in the map and spawn using the listed `agents`, `strategy`, and `agents_dir`.

**Do NOT call resolve individually during later phases. The agent map is the single source of truth.**

### Phase 1: Code Review

Spawn the **qa** agent to perform:
- Clean Architecture compliance (dependency direction check)
- Code quality (complexity, duplication, naming, error handling)
- Test coverage assessment
- SAST quality gate checks

Write findings to `.claude/scratchpad/qa-review.md`.

### Phase 2: Security Review

Spawn the **security** agent to perform:
- STRIDE threat modeling on changed components
- OWASP Top 10 check
- Veto trigger scan (hardcoded secrets, injection, auth bypass, deprecated crypto)
- Advisory findings with severity levels

Write findings to `.claude/scratchpad/security-review.md`.

### Phase 3: Summary

Present consolidated review with:
- **Blockers** (must fix before shipping)
- **High** (should fix)
- **Medium/Low** (advisory)
- Each finding: file, line, severity, category, description, suggested fix

## Progress Reporting

After each phase completes, report a concise status update to the user:

- **Phase 1**: Report QA findings summary (number of issues by severity, key patterns found)
- **Phase 2**: Report security findings summary (blockers, high/medium/low counts, critical items)
- **Phase 3**: Present consolidated review — this IS the final output to the user

## Rules

- Be concrete: provide file paths, line numbers, and fix suggestions
- Security veto triggers are always blockers — no exceptions
- Architecture violations (inner layer importing outer) are always flagged
- Present findings by severity, not by agent
