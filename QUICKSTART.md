# Quick Start — Archon

## 1. Initialize

```bash
cd your-project
npx archon init
```

This creates `.archon/` with runtime, config, skills, and toolkits. It also updates `CLAUDE.md` and `.gitignore`.

## 2. Use with Claude Code

Open Claude Code in your project. Describe what you need naturally:

```
"Add user authentication with JWT and role-based access"
"Fix the login endpoint — it returns 500 on invalid passwords"
"Review the payment module for security issues"
"Create a migration to add an orders table"
```

Archon detects the intent and activates the right agents automatically.

## 3. CLI Tools

```bash
# See what Archon detects from your message
node .archon/runtime/intent-router.js detect "add user authentication"

# Track feature progress
node .archon/runtime/project-state.js status

# Check what's missing (security review, tests, etc.)
node .archon/runtime/project-state.js pending

# Estimate token cost before starting
node .archon/runtime/token-estimator.js estimate --complexity medium

# View active agents
node .archon/runtime/agent-registry.js agents

# Check agent memory
node .archon/runtime/memory-manager.js load S4

# Run maintenance audit
node .archon/runtime/maintenance.js audit
```

## What Gets Activated When

| You say... | Archon activates |
|-----------|-----------------|
| "Add a new API endpoint" | Spec Writer → Security → Builder → QA |
| "Fix the broken tests" | Builder → QA |
| "Review auth for vulnerabilities" | Security → Architect |
| "Deploy to staging" | DevOps |
| "Design the database schema" | Architect → Spec Writer |
| "Add a React dashboard" | Frontend → QA |
| "Create a data migration" | Data → Security |

## Configuration

Edit `.archon/config.yml`:

```yaml
# Switch between modes
mode: solo          # solo (9 agents) | team (34 agents)

# Solo mode agents
solo:
  agents: [S0, S1, S2, S3, S4, S5, S6, S7, S8]

# Team mode preset
team:
  preset: "full-stack-app"
```

## Solo Agents

| ID | Agent | Role |
|----|-------|------|
| S0 | Archon | Orchestration and routing |
| S1 | Architect | Solution design, C4, API contracts |
| S2 | Security | STRIDE, veto power |
| S3 | Spec Writer | OpenAPI, DB schemas, wireframes |
| S4 | Builder | Domain logic, services, adapters |
| S5 | Frontend | Components, UI, UX |
| S6 | QA | Tests, code review, SAST |
| S7 | DevOps | CI/CD, observability, releases, docs |
| S8 | Data | Data modeling, pipelines, migrations |

## Tips

1. **Just describe what you need** — No need to pick agents or phases manually
2. **Security always reviews** — Implementation work gets S2 review automatically
3. **Specs come first** — For new features, Archon generates specs before code (quick fixes skip this)
4. **Memory carries forward** — Agent learnings persist across sessions
5. **Check pending reviews** — `project-state.js pending` shows what still needs security review or tests
