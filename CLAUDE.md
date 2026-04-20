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
| `/audit` | Comprehensive codebase audit (security + quality + architecture) | security → qa → architect |

## Core Invariants

1. **Security before shipping.** Security agent always reviews before implementation ships. Security has **veto power** — hardcoded secrets, injection, auth bypass, deprecated crypto are non-negotiable blockers.
2. **ADD before code for L/XL features.** Architectural Design Document required for large features. Specs (OpenAPI, DB schema) required for M+. Inline OK for fixes and S tasks.
3. **Clean Architecture.** Dependencies point inward: Domain → Application → Adapters. Domain layer has zero external dependencies.
4. **Progress over ceremony.** Don't ask which agents to use, don't reference agent IDs. Report concise status after each phase (decisions made, issues found, artifacts produced). Integrate outputs cohesively.
5. **Specs define contracts, not implementations.** Specs come before code. Implementation decides HOW.

## How to Work

When the user asks you to do something:

1. Determine the intent (build, review, fix, secure, test, deploy, design, data, ml, refactor, frontend)
2. **Resolve agents through the Mode Resolution Protocol** before spawning
3. Use the matching command pipeline, or dispatch agents directly for simple tasks
4. For ambiguous requests, infer intent from context — do not ask the user to classify
5. Combine passes when scope is small (a trivial fix doesn't need 8 phases)
6. For critical security issues, be direct and firm — flag as blockers that must be fixed
7. When trade-offs exist, present 2-3 options with pros/cons and a recommendation

## Mode Resolution Protocol

Before spawning any agent referenced in a command pipeline, resolve the agent name:

1. **Get the task size**: Read `.claude/scratchpad/classification.json` (written by Phase 0 of `/build`) and use the `size` field. If no classification exists (e.g., for `/fix`, `/review`, or direct agent dispatch), omit the `--size` flag.
2. Run: `node .archon/runtime/config-loader.js resolve <agent-name> --size <task-size>`
3. Read the JSON output:
   - `agents`: the agent(s) to actually spawn
   - `strategy`: how to execute them
     - `single`: spawn one agent
     - `sequential`: spawn agents one after another, each receiving the previous agent's scratchpad output
     - `parallel`: spawn all agents simultaneously
   - `agents_dir`: where the agent files live (`solo/` or `team/`)
   - `unavailable`: agents excluded by the active preset (skip silently)
4. Spawn from the correct directory.

**Examples:**
- Command says "spawn the **builder**" with mode=solo → `["builder"]`, single, from `.claude/agents/solo/`
- Command says "spawn the **builder**" with mode=team → `["domain-logic", "app-services", "adapter-layer"]`, sequential, from `.claude/agents/team/`
- Command says "spawn the **qa**" with mode=team → `["test-engineer", "code-reviewer"]`, parallel, from `.claude/agents/team/`

**If `unavailable` is non-empty**, skip those agents without error. If ALL agents are unavailable, skip the entire phase and note it in the status update.

**Quick check:** `node .archon/runtime/config-loader.js mode` returns the current mode. `node .archon/runtime/config-loader.js agents` returns the active agent list.

## Repository Structure

```
.claude/
  agents/solo/       9 agents with frontmatter (model, tools, skills)
  agents/team/       21 agents for team mode
  skills/            11 reusable domain knowledge skills
  commands/          11 deterministic workflow entry points
  scratchpad/        Inter-agent state (gitignored, ephemeral)
  settings.json      Claude Code settings
docs/                Framework documentation and guides
bin/                 CLI entry point (npx github:ncacioni/archon init)
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
| `config-loader.js` | Mode resolution and solo→team agent expansion |
| `integrity.js` | Agent/skill/command cross-reference validation |
| `token-estimator.js` | Pre-execution token cost estimates per phase |
| `fast-path.js` | Deterministic code transforms without LLM invocation |
| `session-lock.js` | Pipeline checkpoint and crash recovery |
| `drift-detector.js` | Spec-to-code divergence detection |
| `rag-manager.js` | TF-IDF search over agent memory files |

## Fast-Path Transforms

For mechanical code changes, use `fast-path.js` instead of spawning an agent. This saves ~2000 tokens per operation.

**When to use fast-path (detect these intents automatically):**

| User says | Fast-path command |
|-----------|------------------|
| "remove all console.logs", "clean up console statements" | `node .archon/runtime/fast-path.js remove-console <file-or-dir>` |
| "convert var to const/let", "fix var declarations" | `node .archon/runtime/fast-path.js var-to-const <file-or-dir>` |
| "sort imports", "organize import statements" | `node .archon/runtime/fast-path.js sort-imports <file-or-dir>` |
| "normalize quotes", "use single quotes everywhere" | `node .archon/runtime/fast-path.js normalize-quotes <file-or-dir>` |
| "add use strict", "add strict mode" | `node .archon/runtime/fast-path.js add-strict <file-or-dir>` |
| "remove unused variables", "clean unused vars" | `node .archon/runtime/fast-path.js remove-unused-vars <file-or-dir>` |

Use `--dry-run` to preview changes before applying. Fast-path works on individual files or whole directories.

## Agent Memory (RAG)

Before loading large agent memory files into context, search for relevant chunks:

```bash
node .archon/runtime/rag-manager.js search <agent> "<query>" --top 3
```

**When to use:** When an agent has accumulated memory files in `.archon/memory/` and you need context about a specific topic (e.g., previous architectural decisions, past security findings, package evaluations).

This reduces memory token cost by 40-90% by loading only relevant chunks instead of entire files.

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
