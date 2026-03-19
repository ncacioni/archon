Analyze and fix a bug, then verify with regression tests.

## Input
$ARGUMENTS

## Pipeline

### Phase 1: Analysis

Spawn the **builder** agent to:
- Reproduce or understand the bug from the description
- Trace the root cause through the codebase
- Identify affected code paths
- Check for related issues in nearby code

Write analysis to `.claude/scratchpad/analysis.md`.

### Phase 2: Fix

The **builder** agent implements the fix:
- Apply minimal, targeted fix (no scope creep)
- Inline spec is sufficient — no formal spec needed for fixes
- Ensure fix is backward-compatible

Write implementation log to `.claude/scratchpad/implementation-log.md`.

### Phase 3: Regression Testing

Spawn the **qa** agent to:
- Write/update tests that cover the bug scenario
- Verify the fix resolves the issue
- Run existing tests to check for regressions
- Confirm no architecture violations introduced

Write to `.claude/scratchpad/qa-review.md`.

## Rules

- Fix the root cause, not just the symptom
- Keep fixes minimal — don't refactor surrounding code
- Every fix must have a test that would have caught the bug
- If the fix reveals a deeper issue, flag it separately
