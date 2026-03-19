---
name: archon-implementation
description: "Archon Phase 4: Implementation — TDD, component coding, worktree-based development"
---

# Archon Implementation Phase

## Agents

Activate these agents for this phase:
- **12-Domain Logic** (subagent, worktree): Implement Clean Arch core (entities, use cases)
- **13-App Services** (subagent, worktree): Implement orchestration layer (DTOs, transactions, audit)
- **14-Adapters** (subagent, worktree): Implement repository layer and external clients
- **15-Frontend Architect** (subagent, worktree): Design frontend architecture, state management
- **16-UI Builder** (subagent, worktree): Build UI components, CSS, accessibility
- **25-Innovation Scout** (subagent, reactive): Spawned on-demand for library/pattern questions
- **28-Backlog Manager** (main context): Task assignment and backlog progression

## Process

1. **Initialize worktrees**: Create isolated git worktrees for concurrent development:
   - `domain-logic/` — Agent 12
   - `app-services/` — Agent 13
   - `adapters/` — Agent 14
   - `frontend/` — Agent 15
   - `ui-components/` — Agent 16

2. **Domain logic implementation**: Dispatch 12-Domain Logic as subagent (worktree):
   - Input: requirements.md, ERD, architecture spec, security requirements
   - Output: Clean Arch core layer (entities, use cases, business rules)
   - TDD: Write tests first, then implementation
   - No external dependencies; pure business logic

3. **Application services**: Dispatch 13-App Services as subagent (worktree):
   - Input: domain logic, API contracts
   - Output: service layer (orchestration, DTOs, transaction management, audit trail)
   - TDD: Unit tests for each service
   - Integrate with domain layer

4. **Adapters and repositories**: Dispatch 14-Adapters as subagent (worktree):
   - Input: application services, ERD, external API contracts
   - Output: repository implementations (DB access), external client adapters
   - TDD: Unit tests with mocked dependencies
   - Parameterized queries (NO string concatenation for SQL)

5. **Frontend architecture**: Dispatch 15-Frontend Architect as subagent (worktree):
   - Input: API contracts, wireframes/UI specs, requirements
   - Output: frontend architecture (state management, routing, folder structure)
   - Define: component hierarchy, data flow, auth flow
   - TDD: Mock APIs, test state transitions

6. **UI components**: Dispatch 16-UI Builder as subagent (worktree):
   - Input: frontend architecture, design system (if available), accessibility standards
   - Output: reusable UI components (buttons, forms, modals, etc.)
   - TDD: Component tests (render, interaction, accessibility)
   - Follow shadcn/ui or equivalent design system patterns

7. **Reactive scouting**: 25-Innovation Scout available on-demand:
   - Triggered by any subagent question about libraries, patterns, or alternatives
   - Rapid research + cache check
   - Response time: 2-5 min

8. **Backlog progression**: 28-Backlog Manager:
   - Assign tasks from Phase 4 backlog to available subagents
   - Track completion, report blockers
   - Maintain task dependency graph

## Artifacts

- Source code (domain, services, adapters, frontend, UI components)
- Unit tests (>80% coverage target)
- Component documentation (Storybook or similar)
- API integration examples
- Migration scripts (if schema changes)

## Gate Criteria

- [ ] All domain logic tests pass (TDD completion)
- [ ] All service layer tests pass
- [ ] All adapter tests pass (mocked external dependencies)
- [ ] All component tests pass and accessible
- [ ] Code review clean (Agent 19) — no CRITICAL issues
- [ ] No Security Architect veto (Agent 08 approval for auth/crypto implementation)
- [ ] Backlog refine tasks for Phase 5

## Token Budget

Estimated: 50-80K tokens

## Memory

After phase completion, graduate learnings:
- Domain entity patterns discovered → persistent memory
- Business logic edge cases → persistent memory
- Service orchestration patterns → persistent memory
- ORM/repository patterns → persistent memory
- Frontend state management decisions → persistent memory
- UI component patterns and accessibility solutions → persistent memory
- Library evaluations and quirks → update evaluations.md
