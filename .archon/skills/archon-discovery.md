---
name: archon-discovery
description: "Archon Phase 1: Discovery — requirements gathering, OSS scout, stack mapping"
---

# Archon Discovery Phase

## Agents

Activate these agents for this phase:
- **02-Requirements Architect** (subagent): Gather and structure requirements from user input
- **25-Innovation Scout** (subagent, proactive): Map requirements against OSS packages
- **27-Spec Writer** (subagent): Draft requirements spec document
- **28-Backlog Manager** (main context): Initialize backlog with discovered tasks

## Process

1. **Gather requirements**: Ask the user to describe their idea. Use brainstorming skill if needed.
2. **Structure requirements**: Dispatch 02-Requirements Architect as subagent:
   - Input: user's description
   - Output: `requirements.md` with FR/NFR, user stories, acceptance criteria
3. **Scout OSS packages**: Dispatch 25-Innovation Scout as subagent (parallel with step 2):
   - Input: identified technology needs from requirements
   - First check evaluation cache: `node .archon/runtime/scout-service.js cache`
   - Search for packages: `npm search`, `gh search repos`
   - Output: `dependency-map.md` with package evaluations
4. **Draft spec**: Dispatch 27-Spec Writer as subagent:
   - Input: requirements.md + dependency-map.md
   - Output: project spec document
5. **Initialize backlog**: 28-Backlog Manager creates initial task breakdown

## Artifacts

- `requirements.md` — structured requirements (FR/NFR/user stories)
- `dependency-map.md` — OSS package evaluations and decisions
- Project spec document
- Initial backlog

## Gate Criteria

- [ ] Requirements reviewed and approved by user
- [ ] Dependency map reviewed (no REJECT packages without alternatives)
- [ ] Spec document complete with all sections filled
- [ ] Backlog initialized with at least Phase 2 tasks

## Token Budget

Estimated: 20-35K tokens

## Memory

After phase completion, graduate learnings:
- Decisions about technology choices → persistent memory
- Package evaluations → evaluations.md cache
- Discoveries about project constraints → persistent memory
