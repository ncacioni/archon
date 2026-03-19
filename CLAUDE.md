# Archon

Archon is a scalable agent orchestration framework for Claude Code. It uses Claude Code's native `.claude/` system — agents with frontmatter, skills, commands, and scratchpad — to provide deterministic, multi-agent workflows with proper model tiering and tool scoping.

## Modes

- **Solo** (9 agents) — for individual developers or small projects. Each agent covers a broad domain.
- **Team** (21 agents) — for larger projects with multiple domains. Solo agents decompose into specialists.

The mode is set in `.archon/config.yml` (`mode: solo` or `mode: team`). Commands and natural language work identically in both modes — the orchestrator expands solo agent names to team specialists when in team mode. See the mapping table below.

## Available Agents

| Agent | Model | Role |
|-------|-------|------|
| architect | opus | Solution design, ADD, C4, API contracts, technology selection |
| security | opus | Security review (STRIDE, OWASP), veto power on critical issues |
| spec-writer | sonnet | OpenAPI, DB schemas, domain models, wireframes, state machines |
| builder | opus | Domain logic, app services, adapters (Clean Architecture, TDD) |
| frontend | sonnet | Components, UI/UX, accessibility (WCAG 2.1 AA), performance |
| qa | sonnet | Tests, code review, SAST, architecture compliance |
| devops | sonnet | CI/CD, observability, releases, documentation |
| data | sonnet | Data modeling, pipelines, migrations, warehouse patterns |
| ml-engineer | opus | ML systems: feature engineering, modeling, evaluation, MLOps |

## Commands

Use these for structured workflows:

| Command | Description | Agents |
|---------|-------------|--------|
| `/build` | Full build pipeline (classify → analyze → design → spec → security → implement → QA → docs) | All (by size) |
| `/review` | Code review + security audit | qa → security |
| `/fix` | Bug analysis, fix, regression test | builder → qa |
| `/secure` | Focused security audit (STRIDE + OWASP) | security (→ architect) |
| `/test` | Test writing and execution | qa |
| `/deploy` | CI/CD, Docker, releases | devops |
| `/design` | Architecture (ADD) + specifications | architect → spec-writer → security |
| `/ml` | ML workflow: problem framing → data → features → model → deploy | ml-engineer → security → qa |
| `/data` | Data infrastructure: modeling → schema → migrations → pipelines → quality | data → security → qa |
| `/refactor` | Code refactoring with behavioral preservation | architect → builder → qa |

## Core Invariants

1. **Security before shipping.** Security agent always reviews before implementation ships. Security has **veto power** — hardcoded secrets, injection, auth bypass, deprecated crypto are non-negotiable blockers.
2. **ADD before code for L/XL features.** Architectural Design Document required for large features. Specs (OpenAPI, DB schema) required for M+. Inline OK for fixes and S tasks.
3. **Clean Architecture.** Dependencies point inward: Domain → Application → Adapters. Domain layer has zero external dependencies.
4. **No ceremony.** Don't announce phases, don't ask which agents to use, don't reference agent IDs. Just work. Integrate outputs cohesively.
5. **Specs define contracts, not implementations.** Specs come before code. Implementation decides HOW.

## How to Work

When the user asks you to do something:

1. Determine the intent (build, review, fix, secure, test, deploy, design, data, ml, refactor, frontend)
2. Use the matching command pipeline, or dispatch agents directly for simple tasks
3. For ambiguous requests, infer intent from context — do not ask the user to classify
4. Combine passes when scope is small (a trivial fix doesn't need 8 phases)
5. For critical security issues, be direct and firm — flag as blockers that must be fixed
6. When trade-offs exist, present 2-3 options with pros/cons and a recommendation

## Repository Structure

```
.claude/
  agents/solo/       9 agents with frontmatter (model, tools, skills)
  agents/team/       21 agents for team mode
  skills/            11 reusable domain knowledge skills
  commands/          10 deterministic workflow entry points
  scratchpad/        Inter-agent state (gitignored, ephemeral)
  settings.json      Claude Code settings
docs/                Framework documentation and guides
bin/                 CLI entry point (npx archon init)
.archon/
  runtime/           Runtime modules (project-state, scout-service, toolkit-loader, maintenance, integrity)
  toolkits/          Agent toolkit indices + tool definitions (YAML)
  config.yml         Project configuration (mode: solo | team)
```

## Runtime

The runtime lives in `.archon/runtime/` — Node.js ES modules, `js-yaml` as only dependency.

```bash
cd .archon/runtime && npm install
node --test __tests__/*.test.js
```

### Key Modules

| Module | Purpose |
|--------|---------|
| `project-state.js` | Track feature progress (spec → security → implementation → tests → review) |
| `scout-service.js` | OSS package evaluation cache |
| `toolkit-loader.js` | Two-level YAML toolkit loading |
| `maintenance.js` | Toolkit integrity + vulnerability auditing |
| `integrity.js` | Agent/skill/command cross-reference validation |

## Team Mode (21 agents)

Switch to team mode in `.archon/config.yml`:

```yaml
mode: team
team:
  preset: "full-stack-app"
```

Team agents are specialized versions of solo agents. Same frontmatter schema, same skills, same commands. See `docs/team-presets.md` for preset configurations.

### Solo → Team Agent Mapping

When in team mode, commands reference solo agent names which expand to team specialists:

| Command references | Solo resolves to | Team resolves to |
|-------------------|-----------------|-----------------|
| builder | builder | domain-logic → app-services → adapter-layer (sequential) |
| qa | qa | test-engineer + code-reviewer (parallel) |
| frontend | frontend | ui-engineer (+ ux-researcher for L/XL) |
| data | data | data-modeler → pipeline-engineer → warehouse-engineer (sequential) |
| devops | devops | ci-cd-engineer + observability-engineer + release-manager |
| architect | architect | architect (same) |
| security | security | security (same) |
| spec-writer | spec-writer | spec-writer (same) |
| ml-engineer | ml-engineer | ml-engineer (same) |

### Presets

| Preset | Agents | Use case |
|--------|--------|----------|
| full-stack-app | 18 | Web/mobile app with API, DB, frontend |
| api-service | 11 | Backend API or microservice |
| data-platform | 11 | Data warehouse, ETL/ELT, analytics |
| ml-platform | 10 | ML training, serving, monitoring |
| frontend-app | 10 | SPA, mobile, UI-heavy |
| minimum-viable | 6 | Quick prototype or MVP |
