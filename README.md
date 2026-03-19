<p align="center">
  <img src="assets/archon-logo.png" alt="Archon Logo" width="250">
</p>

# Archon — Intelligent Orchestrator for Claude Code

Archon auto-detects what you need and activates the right AI agents. No ceremony, no phase selection — just describe what you want to build.

**Solo mode**: 9 consolidated agents for individual developers.
**Team mode**: 34 specialized agents for complex projects.
Security review built in. Specs before code. Clean Architecture enforced.

## How It Works

```
You: "Add user authentication with JWT"

Archon detects: BUILD + SECURE
Activates: Spec Writer → Security → Builder → QA
```

Archon reads your message, identifies the intent, and activates agents in the right order. Security always reviews implementation work before it ships.

### Intent Detection

| Intent | Triggers | Agents |
|--------|----------|--------|
| **BUILD** | add, create, implement, build | Spec Writer → Security → Builder → QA |
| **FIX** | fix, bug, error, debug | Builder → QA |
| **SECURE** | security, auth, permissions | Security → Architect |
| **REVIEW** | review, check, audit | QA → Security |
| **TEST** | test, coverage, e2e | QA |
| **DEPLOY** | deploy, release, ci/cd | DevOps |
| **DESIGN** | architecture, design, schema | Architect → Spec Writer |
| **DATA** | migration, pipeline, database | Data → Security |
| **DOCUMENT** | document, readme, docs | DevOps |
| **FRONTEND** | ui, component, react, css | Frontend → QA |

## Quick Start

```bash
# Initialize Archon in your project
npx archon init

# That's it. Open Claude Code and describe what you need.
```

The `init` command creates `.archon/` with runtime modules, config, and updates your `CLAUDE.md` so Claude Code knows how to work with Archon.

## Solo Mode (Default)

9 agents that cover everything a solo dev needs:

| ID | Agent | What it does |
|----|-------|-------------|
| S0 | **Archon** | Orchestrates — detects intent, routes to agents |
| S1 | **Architect** | Solution design, C4 diagrams, API contracts |
| S2 | **Security** | STRIDE threat modeling, veto power |
| S3 | **Spec Writer** | OpenAPI specs, DB schemas, wireframes |
| S4 | **Builder** | Domain logic, app services, adapters |
| S5 | **Frontend** | Components, UI/UX, accessibility |
| S6 | **QA** | Tests, code review, SAST scanning |
| S7 | **DevOps** | CI/CD, observability, releases, documentation |
| S8 | **Data** | Data modeling, pipelines, migrations |

## Team Mode (34 Agents)

For larger projects, switch to team mode in `.archon/config.yml`:

```yaml
mode: team
team:
  preset: "full-stack-app"
```

Available presets: `full-stack-app`, `api-service`, `security-audit`, `data-pipeline`, `frontend`, `minimum-viable`. See [docs/team-presets.md](docs/team-presets.md).

## Runtime

Archon includes a Node.js runtime (ES modules, zero deps except `js-yaml`):

| Module | Purpose |
|--------|---------|
| `intent-router.js` | Detect intent, map to agent activation order |
| `project-state.js` | Track feature progress (spec → security → impl → tests → review) |
| `agent-registry.js` | Load agents (solo or team), build dispatch prompts |
| `memory-manager.js` | Persistent agent memory with graduation rules |
| `token-estimator.js` | Token cost estimation |
| `scout-service.js` | OSS package evaluation cache |
| `toolkit-loader.js` | Two-level YAML toolkit loading |
| `maintenance.js` | Toolkit integrity + vulnerability auditing |

### CLI

```bash
# Intent detection
node .archon/runtime/intent-router.js detect "add user authentication"

# Feature tracking
node .archon/runtime/project-state.js status
node .archon/runtime/project-state.js pending

# Active agents
node .archon/runtime/agent-registry.js agents

# Token estimation
node .archon/runtime/token-estimator.js estimate --complexity medium

# Agent memory
node .archon/runtime/memory-manager.js load S4

# Maintenance audit
node .archon/runtime/maintenance.js audit
```

### Tests

```bash
cd .archon/runtime && npm install
node --test __tests__/*.test.js
```

79 tests across 9 test suites.

## Core Principles

1. **Specs before code** — OpenAPI, DB schemas, wireframes approved before implementation (inline OK for quick fixes)
2. **Security has veto power** — S2 can block any decision at any point
3. **Clean Architecture** — Dependencies point inward: Domain < App < Infrastructure < UI
4. **Memory persists** — Agent learnings carry forward across sessions
5. **No ceremony** — No phase announcements, no gate approvals. Archon just works.

## Repository Structure

```
agents/
  solo/              9 consolidated agents (S0-S8)
  *.md               34 original agents (00-33) for team mode
docs/                Framework documentation
bin/                 CLI (npx archon init)
.archon/
  runtime/           8 modules + test suite
  skills/            6 phase skill definitions
  toolkits/          Agent toolkit indices + tool definitions (YAML)
  memory/            Persistent agent memory (gitignored)
  config.yml         Project configuration
```

## Documentation

| Document | Description |
|----------|-------------|
| [ARCHON.md](docs/ARCHON.md) | Master framework specification |
| [MASTER-INVOCATION-GUIDE.md](docs/MASTER-INVOCATION-GUIDE.md) | Prompt templates for invoking agents |
| [agent-certification-map.md](docs/agent-certification-map.md) | Professional certifications per agent |
| [team-presets.md](docs/team-presets.md) | Team configurations by project type |
| [spec-templates.md](docs/spec-templates.md) | OpenAPI, DB schema, wireframe templates |
| [QUICKSTART.md](QUICKSTART.md) | Getting started guide |

## License

MIT — see [LICENSE](LICENSE).
