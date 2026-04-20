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

### Phase 1: Swarm Review (5 reviewers in parallel)

Spawn 5 reviewers **simultaneously** using the **qa** and **security** agents with specialized prompts. Each reviewer writes its findings to a dedicated scratchpad file.

| Reviewer | Agent | Scope | Output |
|----------|-------|-------|--------|
| **security-reviewer** | security | STRIDE threat model, OWASP Top 10, veto triggers (hardcoded secrets, injection, auth bypass, deprecated crypto) | `.claude/scratchpad/review-security.md` |
| **performance-reviewer** | qa | N+1 queries, algorithmic complexity (O(n²)+), unnecessary I/O, bundle size regressions | `.claude/scratchpad/review-performance.md` |
| **architecture-reviewer** | qa | Clean Architecture compliance (dependency direction), layer violations, coupling, cohesion | `.claude/scratchpad/review-architecture.md` |
| **test-reviewer** | qa | Coverage gaps, missing edge cases, test pyramid balance, missing regression tests | `.claude/scratchpad/review-tests.md` |
| **quality-reviewer** | qa | Code smell, duplication, naming clarity, cyclomatic complexity, error handling completeness | `.claude/scratchpad/review-quality.md` |

**Parallelism**: spawn all 5 simultaneously. Each receives only its specific scope — do not give a reviewer the full review brief.

Report after all 5 complete: how many findings each reviewer flagged, any blockers found.

### Phase 2: Consolidation

Read all 5 scratchpad files and consolidate findings into a single report:

1. **Deduplicate**: if multiple reviewers flag the same issue, merge them into one finding
2. **Classify severity**: P0 (blocker, must fix), P1 (should fix), P2 (advisory)
3. **Sort by severity**: P0 first, then P1, then P2
4. **Attribute**: note which reviewer(s) caught each finding

Write consolidated report to `.claude/scratchpad/review-consolidated.md`.

### Phase 3: Present Report

Present the consolidated findings to the user:

**Format:**
```
## Review Results

### P0 — Blockers (must fix before shipping)
- [SECURITY/ARCH/etc] filename:line — description — fix suggestion

### P1 — Should Fix
- ...

### P2 — Advisory
- ...

### Summary
5 reviewers × parallel — N total findings (X P0, Y P1, Z P2)
Security veto: YES/NO
```

## Rules

- Be concrete: provide file paths, line numbers, and fix suggestions
- Security veto triggers are always P0 — no exceptions
- Architecture violations (inner layer importing outer) are always P0
- Present findings by severity, not by agent
- If all 5 reviewers find no issues, say so explicitly — that IS a valid result
