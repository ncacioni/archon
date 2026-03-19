Design architecture and produce formal specifications for a feature or system.

## Input
$ARGUMENTS

## Pipeline

### Phase 1: Architecture

Spawn the **architect** agent to produce an ADD (Architectural Design Document):

1. **Context & Problem Statement** — what are we solving and why
2. **Decision Drivers** — constraints, quality attributes, business requirements
3. **Considered Options** — 2-3 alternatives with trade-off analysis
4. **Decision Outcome** — chosen option with rationale
5. **Architecture Views** — C4 diagrams (Context, Container, Component)
6. **Data Model Overview** — high-level ERD
7. **API Contract Summary** — endpoints, auth, error strategy
8. **Security Considerations** — STRIDE summary for key components
9. **Deployment & Infrastructure** — how it runs
10. **Consequences** — positive, negative, risks

Write to `.claude/scratchpad/add.md`.

### Phase 2: Specifications

Spawn the **spec-writer** agent to produce formal specs based on the ADD:

- **API Specification** (OpenAPI 3.1) — if API involved
- **Database Schema** (SQL DDL) — if data storage involved
- **Domain Model** (Mermaid class diagram) — for domain logic
- **State Machines** (Mermaid stateDiagram) — for stateful workflows
- **UI Wireframes** — if frontend involved
- **Environment Config** — required variables and secrets

Write to `.claude/scratchpad/spec.md`.

### Phase 3: Security Review

Spawn the **security** agent to review the ADD and specs:
- STRIDE on proposed architecture
- Veto trigger check
- Advisory findings

**If blockers found → flag and revise ADD/specs before marking complete.**

Write to `.claude/scratchpad/security-review.md`.

## Progress Reporting

After each phase completes, report a concise status update to the user:

- **Phase 1**: Present ADD summary (problem, options considered, recommended decision, key architecture views)
- **Phase 2**: Report specs produced (which artifacts, key contracts, notable decisions)
- **Phase 3**: Report security review results (blockers, advisories, revisions needed)

## Rules

- ADD is the primary artifact — it captures the WHY, not just the WHAT
- Specs define contracts, not implementations
- Every endpoint needs auth, error handling, and validation defined
- Present options with trade-offs — let the user make final decisions on significant choices
- Security review happens before design is considered final
