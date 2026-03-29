Write and run tests for the specified code or feature.

## Output Protocol

**MANDATORY**: You MUST output visible text to the user after completing each phase. This is not optional. The user must see real-time progress as the pipeline executes.

Between every phase:
1. Output a brief status update (3-5 lines) describing what was done, key decisions made, and issues found
2. If in plan mode, still output commentary — do not silently plan without explanation
3. Write artifacts to scratchpad AND summarize findings in visible text

**Silent execution is a bug.** If the user sees no output between agent spawns, the pipeline is broken.

## Input
$ARGUMENTS

If no specific scope provided, analyze test coverage gaps and prioritize.

## Pipeline

### Pre-phase: Agent Resolution

Resolve all agents needed for this pipeline upfront.

Run:
```
node .archon/runtime/config-loader.js resolve-all qa --output .claude/scratchpad/agent-map.json
```

Read `.claude/scratchpad/agent-map.json` for ALL subsequent phases. When a phase says "spawn the **X**", look up `agents["X"]` in the map and spawn using the listed `agents`, `strategy`, and `agents_dir`.

**Do NOT call resolve individually during later phases. The agent map is the single source of truth.**

### Phase 1: Test Strategy

Spawn the **qa** agent to:

1. **Analyze scope** — identify what needs testing
2. **Map to test pyramid**:
   - Unit tests (70%): domain logic, pure functions, value objects
   - Integration tests (20%): repos with real DB, API endpoints
   - E2E tests (10%): critical user journeys
3. **Check existing coverage** — find gaps and prioritize

### Phase 2: Test Implementation

The **qa** agent writes tests:

- **Domain layer**: pure unit tests, no mocks (no external deps)
- **Application layer**: unit tests with mocked ports
- **Adapter layer**: integration tests against real dependencies
- **Security tests**: injection, XSS, AuthZ, rate limiting, IDOR, JWT tampering
- Use test design techniques: equivalence partitioning, boundary values, state transitions

### Phase 3: Execution

Run all tests and report:
- Pass/fail results
- Coverage metrics vs targets (Domain 90%+, App 80%+, Adapters 60%+)
- New tests added
- Remaining coverage gaps

Write to `.claude/scratchpad/qa-review.md`.

## Progress Reporting

After each phase completes, report a concise status update to the user:

- **Phase 1**: Report test strategy (scope analyzed, pyramid breakdown, coverage gaps identified)
- **Phase 2**: Report tests written (count by type, key scenarios covered)
- **Phase 3**: Report execution results (pass/fail, coverage metrics, remaining gaps)

## Rules

- Every acceptance criterion maps to at least one test
- Test data NEVER contains real PII
- Tests must be deterministic and fast (unit < 10ms, integration < 1s, E2E < 30s)
- Failing tests are P0 — fix immediately or explain why
