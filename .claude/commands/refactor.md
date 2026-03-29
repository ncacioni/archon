Analyze, plan, and execute a code refactoring with verified behavioral preservation.

## Output Protocol

**MANDATORY**: You MUST output visible text to the user after completing each phase. This is not optional. The user must see real-time progress as the pipeline executes.

Between every phase:
1. Output a brief status update (3-5 lines) describing what was done, key decisions made, and issues found
2. If in plan mode, still output commentary — do not silently plan without explanation
3. Write artifacts to scratchpad AND summarize findings in visible text

**Silent execution is a bug.** If the user sees no output between agent spawns, the pipeline is broken.

## Input
$ARGUMENTS

## Pipeline

### Pre-phase: Agent Resolution

Resolve all agents needed for this pipeline upfront.

Run:
```
node .archon/runtime/config-loader.js resolve-all architect builder qa --output .claude/scratchpad/agent-map.json
```

Read `.claude/scratchpad/agent-map.json` for ALL subsequent phases. When a phase says "spawn the **X**", look up `agents["X"]` in the map and spawn using the listed `agents`, `strategy`, and `agents_dir`.

**Do NOT call resolve individually during later phases. The agent map is the single source of truth.**

### Phase 0: Analysis

Spawn the **architect** agent to:
- Map dependencies of the code to be refactored (imports, callers, callees)
- Identify code smells (duplication, long methods, feature envy, god classes, coupling)
- Assess blast radius — what other code is affected by changes here
- Check current test coverage on the affected code

Write to `.claude/scratchpad/analysis.md`.

### Phase 1: Refactoring Plan

The **architect** agent produces a plan:
- Specific refactoring techniques to apply (extract method, move class, introduce interface, etc.)
- Ordering of changes (which changes are safe to do first)
- Risk assessment per change (high/medium/low based on test coverage and coupling)
- Intermediate checkpoints where tests should pass

Write to `.claude/scratchpad/refactoring-plan.md`.

### Phase 2: Implementation

Spawn the **builder** agent to execute the refactoring plan:
- Apply changes incrementally (one refactoring technique at a time)
- Run tests after each increment — do NOT proceed if tests fail
- Maintain backward compatibility unless explicitly breaking (in which case, update all callers)
- Follow Clean Architecture: if moving code between layers, ensure dependency direction stays inward

Write to `.claude/scratchpad/implementation-log.md`.

### Phase 3: Verification

Spawn the **qa** agent to verify:
- All existing tests pass (zero regressions)
- No behavioral change unless explicitly intended
- Architecture compliance (dependency direction, layer boundaries)
- Code quality improved (reduced complexity, duplication, coupling)
- Test coverage maintained or improved

**If verification fails → loop back to Phase 2 (max 3 iterations). After 3 failures, escalate to user.**

Write to `.claude/scratchpad/qa-review.md`.

## Progress Reporting

After each phase completes, report a concise status update to the user:

- **Phase 0**: Report analysis (dependencies mapped, code smells found, blast radius, current test coverage)
- **Phase 1**: Report refactoring plan (techniques to apply, ordering, risk per change, checkpoints)
- **Phase 2**: Report implementation progress (changes applied, tests passing at each checkpoint)
- **Phase 3**: Report verification results (regressions, architecture compliance, quality improvement metrics)

## Rules

- Refactoring changes structure, not behavior — tests must pass before AND after
- Work incrementally: one refactoring at a time, tests between each
- Never refactor and add features in the same pass
- If test coverage is insufficient, write tests FIRST, then refactor
- Keep the blast radius small — prefer many small refactors over one big one
- If the refactoring reveals a deeper architectural issue, flag it and propose a `/design` follow-up
