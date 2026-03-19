# CLAUDE.md

## This project uses Archon

Archon is an intelligent orchestrator for Claude Code. It auto-detects what you need and activates the right agents.

## Active Mode: Solo

9 consolidated agents — read their prompts from `agents/solo/`:

| ID | Agent | Role |
|----|-------|------|
| S0 | Archon | Orchestration and routing |
| S1 | Architect | Solution design, C4, API contracts |
| S2 | Security | Security review (STRIDE, veto power) |
| S3 | Spec Writer | OpenAPI, DB schemas, wireframes |
| S4 | Builder | Domain logic, app services, adapters |
| S5 | Frontend | Components, UI, UX |
| S6 | QA | Tests, code review, SAST |
| S7 | DevOps | CI/CD, observability, releases, docs |
| S8 | Data | Data modeling, pipelines, migrations |

## How to work

When the user asks you to do something:

1. Read `.archon/config.yml` for project context and mode (solo/team)
2. Determine the intent of the request (build, review, fix, secure, test, deploy, design, data, document, frontend)
3. For each activated agent, read its prompt from `agents/solo/` (solo mode) or `agents/` (team mode)
4. Security (S2) **always** reviews implementation work before shipping
5. Specs precede code — but for quick fixes, inline spec is fine

### Intent → Agent mapping

| Intent | Agents activated |
|--------|-----------------|
| BUILD (add, create, implement) | S3 → S2 → S4 → S6 |
| REVIEW (review, check, audit) | S6 → S2 |
| FIX (fix, bug, error, debug) | S4 → S6 |
| SECURE (security, auth, permissions) | S2 → S1 |
| TEST (test, coverage, e2e) | S6 |
| DEPLOY (deploy, release, ci/cd) | S7 |
| DESIGN (architecture, design, schema) | S1 → S3 |
| DATA (migration, pipeline, etl, database) | S8 → S2 |
| DOCUMENT (document, readme, docs) | S7 |
| FRONTEND (frontend, ui, component, react) | S5 → S6 |

## Core invariants

1. Security phase always runs **before** implementation ships
2. S2 (Security) has **veto power** at any point
3. No code is written until specs are approved (inline OK for quick fixes)
4. Clean Architecture: dependencies point inward — Domain < App < Infrastructure < UI
5. Domain layer has zero external dependencies

## Repository structure

```
agents/
  solo/            9 consolidated agents (S0-S8) for solo mode
  *.md             34 original agents (00-33) for team mode
docs/              Framework documentation and guides
bin/               CLI entry point (npx archon init)
.archon/
  runtime/         8 modules: memory-manager, toolkit-loader, token-estimator,
  |                scout-service, agent-registry, maintenance, intent-router, project-state
  |__ __tests__/   Test suite (Node.js built-in test runner)
  skills/          6 phase skill definitions
  toolkits/        Agent toolkit indices + tool definitions (YAML)
  memory/          Persistent agent memory (auto-managed, gitignored)
  config.yml       Project configuration (mode: solo | team)
```

## Runtime

The runtime lives in `.archon/runtime/` — Node.js ES modules, `js-yaml` as only dependency.

### Running tests

```bash
cd .archon/runtime && npm install
node --test __tests__/*.test.js
```

### Key modules

| Module | Purpose |
|--------|---------|
| `intent-router.js` | Detect intent from user message, map to agent activation order |
| `project-state.js` | Track feature progress (spec → security → implementation → tests → review) |
| `agent-registry.js` | Load agents (solo or team mode), build dispatch prompts |
| `memory-manager.js` | Persistent agent memory with graduation rules |
| `token-estimator.js` | Token cost estimation per task |
| `scout-service.js` | OSS package evaluation cache |
| `toolkit-loader.js` | Two-level YAML toolkit loading |
| `maintenance.js` | Toolkit integrity + vulnerability auditing |

### CLI examples

```bash
# Detect intent
node .archon/runtime/intent-router.js detect "add user authentication"

# Check active agents for current mode
node .archon/runtime/agent-registry.js agents

# Feature tracking
node .archon/runtime/project-state.js status
node .archon/runtime/project-state.js pending

# Token estimation
node .archon/runtime/token-estimator.js estimate --complexity medium

# Agent memory
node .archon/runtime/memory-manager.js load S4
```

## Team mode (34 agents)

Switch to team mode in `.archon/config.yml`:

```yaml
mode: team
team:
  preset: "full-stack-app"
```

Agents are numbered 00-33 across layers: Meta/Agile, Governance, Architecture, Security, Implementation, QA, Operations. See `docs/team-presets.md` for preset configurations.
