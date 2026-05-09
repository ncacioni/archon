Build a feature or implement a requirement using the full Archon pipeline.

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

### Phase 0: Clarification (M/L/XL only)

Before classifying, assess whether the request is ambiguous. A request is ambiguous if any of these are true:
- The success criteria are not verifiable ("improve", "refactor", "make it better")
- The scope is unclear (could mean 1 endpoint or 10)
- A key constraint is missing (auth? which DB? which service?)

If ambiguous AND the request will likely be M or larger: ask **at most 3 questions**, each targeting the most impactful unknown. State what you'll assume if the user doesn't answer. Then proceed — do not wait for clarification if the user says "just do it" or equivalent.

If unambiguous, or clearly S-sized: skip this step entirely.

### Phase 0: Classification

Classify the task size and determine which phases to run:

| Size | Criteria | Phases |
|------|----------|--------|
| **S** | Trivial fix, typo, config change | 0 → 1 → 5 → 6 |
| **M** | Single feature, API endpoint, component | 0 → 1 → 3 → 4 → 5 → 6 → 7 |
| **L** | Multi-component feature, new domain | All phases |
| **XL** | System-wide change, new subsystem | All phases (warn user, offer to split) |

Write classification to `.claude/scratchpad/classification.json`:
```json
{
  "size": "S|M|L|XL",
  "feature": "description",
  "affected_areas": ["backend", "frontend", "data", "ml", "infra"],
  "agents_needed": ["builder", "frontend", "data", "ml-engineer"],
  "skip_phases": [2, 3]
}
```

**After classification, evaluate mode and report to the user:**

1. Get current mode: `node .archon/runtime/config-loader.js mode`
2. Score whether team mode would benefit this task (0-100):

| Signal | Points |
|--------|--------|
| Size is L | +20 |
| Size is XL | +35 |
| 3 affected areas | +15 |
| 4+ affected areas | +25 (replaces +15) |
| Multiple bounded contexts touched | +15 |
| Complex architecture (API + DB + queue/events + frontend) | +10 |

3. Add `mode_evaluation` to `classification.json`:
```json
{
  "mode_evaluation": {
    "current_mode": "solo",
    "score": 55,
    "signals": ["Size L (+20)", "3 affected areas (+15)", "2 bounded contexts (+15)", "Complex architecture (+10)"],
    "recommendation": "team"
  }
}
```

4. Get token estimate for this pipeline:
   ```
   node .archon/runtime/token-estimator.js estimate --size <size> --command build
   ```
   Include the estimate table in the report to the user.

5. Report to the user:
   - Task size, reasoning, affected areas, phases that will run
   - Token estimate per phase (from step 4)
   - Current mode and agents that will be used
   - **If score >= 40**: show the score, signals, and what team mode would expand. Let the user decide.
   - **If score < 40**: just show the current mode, no recommendation
   - If the user says "switch to team mode", update `.archon/config.yml` and re-resolve.

6. Write initial session checkpoint and start session continuity:
   ```
   node .archon/runtime/session-lock.js write build phase-0
   node .archon/runtime/session-continuity.js start build "$ARGUMENTS"
   ```

### Pre-phase: Agent Resolution

Using the `agents_needed` and `size` from Phase 0's `.claude/scratchpad/classification.json`, resolve all agents upfront. Always include `architect`, `spec-writer`, `security`, `qa`, and `devops` in addition to the agents listed in `agents_needed`.

Run:
```
node .archon/runtime/config-loader.js resolve-all <agents_needed + architect spec-writer security qa devops> --size <size> --output .claude/scratchpad/agent-map.json
```

Read `.claude/scratchpad/agent-map.json` for ALL subsequent phases. When a phase says "spawn the **X**", look up `agents["X"]` in the map and spawn using the listed `agents`, `strategy`, and `agents_dir`.

**Do NOT call resolve individually during later phases. The agent map is the single source of truth.**

### Phase 1: Analysis

Explore the codebase to understand current state. Read relevant files, check existing patterns, identify integration points. Write findings to `.claude/scratchpad/analysis.md`.

### Phase 2: Architecture (L/XL only)

```
node .archon/runtime/session-continuity.js update build phase-2 "Architecture design (ADD)"
```

Spawn the **architect** agent. Produce an ADD (Architectural Design Document) with:
1. Context & Problem Statement
2. Decision Drivers
3. Considered Options (with trade-offs)
4. Decision Outcome
5. Architecture Views (C4)
6. Data Model Overview
7. API Contract Summary
8. Security Considerations
9. Deployment & Infrastructure
10. Consequences

Write to `.claude/scratchpad/add.md`.

### Phase 3: Specification (M/L/XL)

```
node .archon/runtime/session-continuity.js update build phase-3 "Specification (OpenAPI/schema)"
```

Spawn the **spec-writer** agent. Produce specs appropriate to the feature (OpenAPI, DB schema, domain model, etc.). Write to `.claude/scratchpad/spec.md`.

### Phase 4: Security Review

Spawn the **security** agent. Review the ADD and/or specs for security issues using STRIDE methodology.

**If security agent flags VETO triggers → STOP. Report blockers to user. Do NOT proceed to implementation.**

Write to `.claude/scratchpad/security-review.md`.

### Phase 5: Implementation

```
node .archon/runtime/session-continuity.js update build phase-5 "Implementation"
```

Before spawning any implementation agent, resolve it through the **Mode Resolution Protocol** (see CLAUDE.md) using the task size from Phase 0's `.claude/scratchpad/classification.json`. This determines whether to spawn solo agents or team specialists.

Select agent(s) based on affected areas:
- Backend/API/domain logic → **builder**
- UI/components/frontend → **frontend**
- Data pipelines/migrations/warehouse → **data**
- ML/AI models/features → **ml-engineer**

**Single area**: spawn the one relevant agent.

**Multiple areas** (full-stack): execute in sub-phases:
- **5a — Backend contracts**: spawn **builder** first to produce API endpoints, domain models, and interface contracts
- **5b — Parallel execution**: spawn remaining agents in parallel (**frontend** uses 5a API contracts, **data** uses 5a domain models)
- **5c — Integration check**: verify cross-layer contracts are honored (API responses match frontend expectations, data schema matches domain entities)

Implement according to specs and ADD. Write implementation log to `.claude/scratchpad/implementation-log.md`.

### Phase 6: QA

Before spawning QA, run drift detection:
```
node .archon/runtime/drift-detector.js check
```
If drift is detected (exit code 1), report the signals to the user and include them in the QA scope. This does NOT block QA — it informs it.

Spawn the **qa** agent. Run tests, code review, architecture compliance check.

**If QA fails → loop back to Phase 5 (max 3 iterations). After 3 failures, escalate to user.**

Write to `.claude/scratchpad/qa-review.md`.

After QA completes:
```
node .archon/runtime/session-lock.js complete build phase-6
node .archon/runtime/session-continuity.js complete-phase build phase-6 "QA passed"
```

### Phase 7: Documentation (M/L/XL)

```
node .archon/runtime/session-continuity.js complete build --clear
```

Spawn the **devops** agent. Produce PR summary, update relevant docs, changelog entry if needed. Write to `.claude/scratchpad/pr-summary.md`.

## Progress Reporting

After each phase completes, report a concise status update to the user:

- **Phase 0**: Report classification (size, affected areas, agents selected, phases that will run)
- **Phase 1**: Summarize key findings from analysis (patterns found, integration points, risks identified)
- **Phase 2**: Present ADD summary with options/trade-offs for user decision (L/XL only)
- **Phase 3**: Report spec artifacts produced (which specs, key contracts defined)
- **Phase 4**: Report security findings — blockers halt the pipeline, advisories are listed
- **Phase 5**: Report what was implemented (files created/modified, key decisions made)
- **Phase 6**: Report QA results (tests passed/failed, coverage, issues found). If looping back, explain why
- **Phase 7**: Report final summary (PR description, docs updated, changelog)

Keep updates concise (3-5 lines per phase). Focus on decisions made, issues found, and artifacts produced — not process narration.

## Rules

- Do NOT ask which agents to use — determine from classification
- Integrate outputs cohesively — no "[As architect]" labels in output
- Security veto is non-negotiable — blocked means blocked
- For XL tasks, warn the user and offer to split before proceeding
- Combine phases when scope is small (S tasks can be one pass)
