# Quick Start — Archon

## 1. Initialize

```bash
cd your-project
npx github:ncacioni/archon init
```

This creates `.archon/` (runtime, config, toolkits) and `.claude/` (agents, skills, commands, scratchpad). It also updates `CLAUDE.md` and `.gitignore`.

## 2. Use with Claude Code

Open Claude Code in your project. Use slash commands for structured workflows:

```
/build Add user authentication with JWT and role-based access
/fix Login endpoint returns 500 on invalid passwords
/review Payment module security audit
/secure Full security audit of the auth system
/test Write tests for the user service
/deploy Set up CI/CD with GitHub Actions
/design Database schema for orders system
/ml Build a churn prediction model
```

Or describe what you need naturally — Archon detects the intent and dispatches the right agents.

## 3. CLI Tools

```bash
# Track feature progress
node .archon/runtime/project-state.js status
node .archon/runtime/project-state.js pending

# Run maintenance audit
node .archon/runtime/maintenance.js audit
```

## What Gets Activated When

| Command | Pipeline |
|---------|----------|
| `/build` | Classify → Analyze → Architecture (L/XL) → Spec (M+) → Security → Implement → QA → Docs |
| `/fix` | Analyze → Fix → Regression Tests |
| `/review` | Code Review (QA) → Security Audit |
| `/secure` | STRIDE + OWASP + Veto Triggers → Remediation Plan |
| `/test` | Strategy → Implementation → Execution |
| `/deploy` | Assessment → CI/CD/Docker/IaC → Documentation |
| `/design` | ADD (Architecture) → Specs → Security Review |
| `/ml` | Problem Framing → Data → Features → Model → Security → MLOps → QA |
| `/data` | Scope → Modeling → Schema/Migration → Pipeline → Security → Quality → QA |
| `/refactor` | Analysis → Refactoring Plan → Incremental Implementation → Verification |
| `/audit` | Security Audit → Quality Audit → Architecture Audit → Consolidated P0/P1/P2 Report |

## Solo Agents

| Agent | Model | Role |
|-------|-------|------|
| architect | opus | Solution design, ADD, C4, API contracts |
| security | opus | STRIDE, veto power, OWASP Top 10 |
| builder | opus | Domain logic, services, adapters (Clean Architecture) |
| ml-engineer | opus | ML systems: features, modeling, evaluation, MLOps |
| spec-writer | sonnet | OpenAPI, DB schemas, wireframes |
| frontend | sonnet | Components, UI/UX, accessibility |
| qa | sonnet | Tests, code review, SAST |
| devops | sonnet | CI/CD, observability, releases, docs |
| data | sonnet | Data modeling, pipelines, migrations |

## Configuration

Edit `.archon/config.yml`:

```yaml
# Switch between modes
mode: solo          # solo (9 agents) | team (21 agents)

# Solo mode
solo:
  agents_dir: ".claude/agents/solo"
  agents: [architect, security, spec-writer, builder, frontend, qa, devops, data, ml-engineer]

# Team mode preset
team:
  agents_dir: ".claude/agents/team"
  preset: "full-stack-app"
```

## Three Ways to Work

### Option A: Slash commands (deterministic pipelines)
```
/build Add user authentication with JWT
/fix Login returns 500 on invalid passwords
/review Security audit of payment module
```
Each command triggers a fixed pipeline of agents in sequence. See the table above.

### Option B: Natural language
```
"I need to add JWT authentication to the backend"
"The login endpoint is broken, returning 500"
"Review the payment module for security issues"
```
Claude Code reads `CLAUDE.md` automatically, detects intent, and dispatches the same pipeline as the corresponding slash command.

### Option C: Plan mode (for complex features)
```
/plan I want a notification system with WebSockets, message queue, and metrics dashboard
```
Claude analyzes the scope, proposes an architecture and agent sequence, and executes after you approve the plan. Use this for L/XL features where you want to review the approach before implementation starts.

**When to use which:**
- **Commands** — when you know exactly what workflow you need
- **Natural language** — for everyday development (same result, less ceremony)
- **Plan mode** — for complex features where you want to review the approach first

## What Gets Committed vs Ignored

After `npx github:ncacioni/archon init`, your `.gitignore` is updated automatically.

**Committed (shared with team):**
| Path | Purpose |
|------|---------|
| `.claude/agents/` | Agent definitions (frontmatter + instructions) |
| `.claude/skills/` | Shared domain knowledge |
| `.claude/commands/` | Slash command pipelines |
| `.claude/settings.json` | Base permissions (conservative, deny list) |
| `.archon/config.yml` | Project configuration (mode, presets) |
| `.archon/runtime/` | Runtime modules |
| `.archon/toolkits/` | Agent toolkits |
| `CLAUDE.md` | Project instructions for Claude Code |

**Gitignored (local only):**
| Path | Purpose |
|------|---------|
| `.claude/scratchpad/` | Ephemeral inter-agent artifacts |
| `.claude/settings.local.json` | Personal permission tier |
| `.archon/state.json` | Local feature progress tracking |
| `.archon/memory/` | Agent memories and evaluation cache |
| `.archon/runtime/package-lock.json` | Runtime dependency lock (local) |

## Permission Setup

**Without this step, you will get a confirmation popup for every file edit and every Bash command.**

After init, create `.claude/settings.local.json` with the **Tier 2 (Developer)** config — recommended for most users:

```json
{
  "permissions": {
    "allow": [
      "Write", "Edit", "WebSearch",
      "Bash(git status*)", "Bash(git log*)", "Bash(git diff*)",
      "Bash(git branch*)", "Bash(git show*)", "Bash(git remote*)",
      "Bash(git add *)", "Bash(git commit *)", "Bash(git stash*)",
      "Bash(git checkout *)", "Bash(git switch *)",
      "Bash(git fetch*)", "Bash(git pull*)",
      "Bash(git rev-parse*)", "Bash(git ls-remote*)",
      "Bash(gh *)",
      "Bash(npm run *)", "Bash(npm test*)", "Bash(npx *)",
      "Bash(node *)", "Bash(python *)", "Bash(python3 *)",
      "Bash(pytest *)", "Bash(cargo *)", "Bash(go *)", "Bash(make *)",
      "Bash(tsc *)", "Bash(eslint *)", "Bash(prettier *)",
      "Bash(jest *)", "Bash(vitest *)",
      "Bash(ls *)", "Bash(cat *)", "Bash(head *)", "Bash(tail *)",
      "Bash(wc *)", "Bash(pwd)", "Bash(which *)", "Bash(type *)",
      "Bash(find *)", "Bash(tree *)", "Bash(echo *)",
      "Bash(jq *)", "Bash(sort *)", "Bash(diff *)", "Bash(test *)",
      "Bash(mkdir *)", "Bash(cp *)", "Bash(mv *)", "Bash(touch *)", "Bash(rm *)",
      "Bash(docker ps*)", "Bash(docker logs*)",
      "Bash(node --version)", "Bash(npm --version)",
      "Bash(python --version)", "Bash(python3 --version)",
      "Bash(git --version)", "Bash(docker --version)"
    ],
    "ask": [
      "Bash(git push *)", "Bash(git merge *)", "Bash(git rebase *)",
      "Bash(npm install*)", "Bash(pip install *)", "Bash(pip3 install *)",
      "Bash(curl *)", "Bash(wget *)",
      "Bash(docker compose*)", "Bash(docker exec *)",
      "Bash(docker build *)", "Bash(docker run *)"
    ]
  }
}
```

This auto-approves file edits, git local ops, build/test/lint, and common utilities. Operations that touch the remote, install packages, or interact with containers are prompted with an "Always allow" option.

If you ran `npx github:ncacioni/archon init`, you can also rename `.claude/settings.local.json.example` to `.claude/settings.local.json`.

For other tiers (Conservative, Autonomous) and customization options, see [docs/permission-guide.md](docs/permission-guide.md).

## Recommended: Codebase Memory MCP

For better codebase understanding, install [codebase-memory-mcp](https://github.com/DeusData/codebase-memory-mcp) globally. It builds a knowledge graph of your code that agents can query for:

- **Call path tracing** — "who calls this function?"
- **Impact analysis** — "what breaks if I change X?"
- **Dead code detection** — find unused functions
- **Architecture exploration** — understand code structure

Install it as an MCP server in your global Claude Code settings (`~/.claude/settings.json`). It's a personal tool — not committed to the repo, index is per-project.

## Tips

1. **Just describe what you need** — No need to pick agents or phases manually
2. **Use `/build` for features** — Full pipeline with automatic size classification
3. **Security always reviews** — Security agent reviews before shipping, has veto power
4. **Specs come first** — For new features, specs are generated before code (quick fixes skip this)
5. **Check scratchpad** — `.claude/scratchpad/` has artifacts from the last pipeline run
