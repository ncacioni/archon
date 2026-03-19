Build a feature or implement a requirement using the full Archon pipeline.

## Input
$ARGUMENTS

## Pipeline

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

### Phase 1: Analysis

Explore the codebase to understand current state. Read relevant files, check existing patterns, identify integration points. Write findings to `.claude/scratchpad/analysis.md`.

### Phase 2: Architecture (L/XL only)

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

Spawn the **spec-writer** agent. Produce specs appropriate to the feature (OpenAPI, DB schema, domain model, etc.). Write to `.claude/scratchpad/spec.md`.

### Phase 4: Security Review

Spawn the **security** agent. Review the ADD and/or specs for security issues using STRIDE methodology.

**If security agent flags VETO triggers → STOP. Report blockers to user. Do NOT proceed to implementation.**

Write to `.claude/scratchpad/security-review.md`.

### Phase 5: Implementation

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

Spawn the **qa** agent. Run tests, code review, architecture compliance check.

**If QA fails → loop back to Phase 5 (max 3 iterations). After 3 failures, escalate to user.**

Write to `.claude/scratchpad/qa-review.md`.

### Phase 7: Documentation (M/L/XL)

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
