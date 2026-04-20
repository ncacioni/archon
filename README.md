<p align="center">
  <img src="assets/archon-logo.png" alt="Archon Logo" width="250">
</p>

<p align="center">
  <a href="https://github.com/ncacioni/archon/releases"><img src="https://img.shields.io/github/v/release/ncacioni/archon?style=flat-square&color=blue" alt="Release"></a>
  <a href="https://github.com/ncacioni/archon/blob/main/LICENSE"><img src="https://img.shields.io/github/license/ncacioni/archon?style=flat-square" alt="License"></a>
  <a href="https://github.com/ncacioni/archon/actions/workflows/release.yml"><img src="https://img.shields.io/github/actions/workflow/status/ncacioni/archon/release.yml?style=flat-square&label=release" alt="Release"></a>
  <a href="https://github.com/ncacioni/archon/actions/workflows/codeql.yml"><img src="https://img.shields.io/github/actions/workflow/status/ncacioni/archon/codeql.yml?style=flat-square&label=CodeQL" alt="CodeQL"></a>
  <img src="https://img.shields.io/badge/node-%3E%3D18-green?style=flat-square" alt="Node">
  <img src="https://img.shields.io/badge/agents-9%20solo%20%7C%2021%20team-purple?style=flat-square" alt="Agents">
  <img src="https://img.shields.io/badge/commands-11-orange?style=flat-square" alt="Commands">
  <img src="https://img.shields.io/badge/tests-132%20passing-brightgreen?style=flat-square" alt="Tests">
</p>

# Archon — Intelligent Orchestrator for Claude Code

Archon is a scalable agent orchestration framework for Claude Code. It uses Claude Code's native `.claude/` system — agents with frontmatter, skills, commands, and scratchpad — to provide deterministic, multi-agent workflows with proper model tiering and tool scoping.

**Solo mode**: 9 agents for individual developers.
**Team mode**: 21 specialized agents for complex projects.
Security review built in. Specs before code. Clean Architecture enforced.

## How It Works

Use slash commands for structured workflows:

```
/build Add user authentication with JWT
/fix Login endpoint returns 500 on invalid passwords
/review Payment module security audit
/design Database schema for orders system
/data Create Snowflake pipeline for user events
/ml Build a churn prediction model
/refactor Extract auth logic into domain service
/audit Full codebase health check before production
```

Or just describe what you need naturally — Archon detects the intent and dispatches the right agents.

### Three Ways to Work

- **Slash commands** — `/build`, `/fix`, `/review`, etc. Deterministic pipelines with fixed agent sequences.
- **Natural language** — "Add JWT auth to the backend." Archon detects the intent and runs the same pipeline.
- **Plan mode** — `/build Add notifications system` in plan mode. Claude analyzes scope, proposes an approach, and waits for your approval before executing.

### Commands

| Command | Description | Agents |
|---------|-------------|--------|
| `/build` | Full pipeline: classify → analyze → design → spec → security → implement → QA → docs | All (by size) |
| `/review` | Code review + security audit | qa → security |
| `/fix` | Bug analysis, fix, regression test | builder → qa |
| `/secure` | Focused security audit (STRIDE + OWASP) | security (→ architect) |
| `/test` | Test writing and execution | qa |
| `/deploy` | CI/CD, Docker, releases | devops |
| `/design` | Architecture (ADD) + specifications | architect → spec-writer → security |
| `/ml` | ML workflow: problem framing → model → deploy | ml-engineer → security → qa |
| `/data` | Data infrastructure: modeling → schema → pipelines → quality | data → security → qa |
| `/refactor` | Code refactoring with behavioral preservation | architect → builder → qa |
| `/audit` | Comprehensive codebase audit (security + quality + architecture) | security → qa → architect |

## Quick Start

### New project

```bash
cd your-project
npx github:ncacioni/archon init          # shared: framework files committed to git
npx github:ncacioni/archon init --local  # local: framework files gitignored (solo dev)
```

Then rename `.claude/settings.local.json.example` to `.claude/settings.local.json` to avoid constant approval popups. See [permission guide](docs/permission-guide.md) for tier options.

Open Claude Code and start working:
```
/build Add user authentication with JWT and role-based access
```

Phase 0 classifies your task, evaluates whether solo or team mode fits best, shows you the plan, and asks for confirmation before proceeding.

### Existing project

```bash
npx github:ncacioni/archon upgrade
```

Updates framework files (agents, skills, commands, runtime) while preserving your config and CLAUDE.md content. Run `/audit --framework` after upgrading to verify health.

### When to use `--local`

Use `--local` when you're the only developer using Archon on the project. Framework files stay on your machine and don't clutter the repo. CLAUDE.md is still committed (Claude Code needs it).

Use the default (no flag) when your team shares the Archon setup — everyone gets the same agents, skills, and commands.

## Solo Mode (Default)

9 agents with model tiering (opus for critical decisions, sonnet for production work):

| Agent | Model | Role |
|-------|-------|------|
| **architect** | opus | Solution design, ADD, C4, API contracts |
| **security** | opus | STRIDE threat modeling, veto power |
| **builder** | opus | Domain logic, app services, adapters (Clean Architecture, TDD) |
| **ml-engineer** | opus | ML systems: features, modeling, evaluation, MLOps |
| **spec-writer** | sonnet | OpenAPI, DB schemas, domain models, wireframes |
| **frontend** | sonnet | Components, UI/UX, accessibility (WCAG 2.1 AA) |
| **qa** | sonnet | Tests, code review, SAST, architecture compliance |
| **devops** | sonnet | CI/CD, observability, releases, documentation |
| **data** | sonnet | Data modeling, pipelines, migrations, warehouse patterns |

### Skills (11 reusable knowledge modules)

Skills provide deep domain knowledge shared across agents:

`clean-architecture` · `security-review` · `spec-templates` · `tdd-patterns` · `backend-patterns` · `ui-ux-patterns` · `mobile-patterns` · `data-patterns` · `devops-patterns` · `ml-engineering` · `mlops-patterns`

## Team Mode (21 Agents)

When you run `/build`, Phase 0 automatically evaluates whether your task would benefit from team mode based on size, affected areas, and architecture complexity. If the score is high enough, it recommends switching and shows what would change. You decide.

To switch manually:

```yaml
mode: team
team:
  preset: "full-stack-app"
```

Available presets: `full-stack-app`, `api-service`, `data-platform`, `ml-platform`, `frontend-app`, `minimum-viable`. See [docs/team-presets.md](docs/team-presets.md).

## Runtime

Archon includes a Node.js runtime (ES modules, `js-yaml` as only dependency):

| Module | Purpose |
|--------|---------|
| `project-state.js` | Track feature progress (spec → security → impl → tests → review) |
| `scout-service.js` | OSS package evaluation cache |
| `toolkit-loader.js` | Two-level YAML toolkit loading |
| `maintenance.js` | Toolkit integrity + vulnerability auditing |
| `config-loader.js` | Mode resolution and solo→team agent expansion |
| `integrity.js` | Agent/skill/command cross-reference validation |
| `token-estimator.js` | Pre-execution token cost estimates per phase |
| `fast-path.js` | Deterministic code transforms without LLM invocation |
| `session-lock.js` | Pipeline checkpoint and crash recovery |
| `drift-detector.js` | Spec-to-code divergence detection |
| `rag-manager.js` | TF-IDF search over agent memory (40-90% token reduction) |

```bash
cd .archon/runtime && npm install
node --test __tests__/*.test.js
```

132 tests across 11 test suites.

## Core Principles

1. **Security before shipping** — Security agent reviews all implementation work. Has veto power on critical issues.
2. **ADD before code for L/XL features** — Architectural Design Document required for large features. Specs for M+. Inline OK for fixes.
3. **Clean Architecture** — Dependencies point inward: Domain → Application → Adapters. Domain has zero external deps.
4. **Deterministic pipelines** — Commands define exact agent sequences. No more skipped steps.
5. **Progress over ceremony** — Concise status updates after each phase. No gate approvals, no agent labels.

## CI/CD

Archon uses [semantic-release](https://github.com/semantic-release/semantic-release) for automated versioning and releases.

- **Conventional commits** enforced via [commitlint](https://commitlint.js.org/) on PRs
- **Automatic releases** on push to `main` — version bump, changelog, and GitHub release
- Commit format: `type(scope): description` — `feat:` → minor, `fix:` → patch, `BREAKING CHANGE:` → major

```
feat: add user authentication agent        → v1.1.0
fix: correct security veto logic           → v1.0.1
feat!: redesign command pipeline structure  → v2.0.0
```

The devops agent includes semantic-release patterns in its `devops-patterns` skill, available to both `/deploy` (for scaffolding CI/CD) and `/build` (Phase 7: Documentation).

## Repository Structure

```
.claude/
  agents/solo/       9 agents with frontmatter (model, tools, skills)
  agents/team/       21 agents for team mode
  skills/            11 reusable domain knowledge skills
  commands/          11 deterministic workflow entry points
  scratchpad/        Inter-agent state (gitignored, ephemeral)
.github/
  workflows/         release.yml (semantic-release) + commitlint.yml (PR validation)
docs/                Framework documentation
bin/                 CLI (npx github:ncacioni/archon init)
.archon/
  runtime/           6 modules + test suite
  toolkits/          Agent toolkit indices + tool definitions (YAML)
  config.yml         Project configuration
```

## Recommended Tools

These are optional but improve the Archon experience:

| Tool | What it does | Install |
|------|-------------|---------|
| [codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp) | Builds a knowledge graph of your codebase — call paths, impact analysis, dead code detection. Agents use it to understand code before modifying it. | Install globally in `~/.claude/settings.json` as an MCP server |

MCP servers are personal tools (global config, not committed to the repo). The index is per-project and created on demand.

## Documentation

| Document | Description |
|----------|-------------|
| [permission-guide.md](docs/permission-guide.md) | Permission tiers for reducing approval friction |
| [team-presets.md](docs/team-presets.md) | Team configurations by project type |
| [spec-templates.md](docs/spec-templates.md) | OpenAPI, DB schema, wireframe templates |
| [QUICKSTART.md](QUICKSTART.md) | Getting started guide |

## License

MIT — see [LICENSE](LICENSE).
