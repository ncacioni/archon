# Quick Start Guide — USDAF

## Option A: Using the v2.0 Runtime (Recommended)

```bash
# 1. Initialize USDAF in your project
cd your-project
npx usdaf init

# 2. This creates:
#    .usdaf/runtime/    — 6 runtime modules
#    .usdaf/skills/     — 6 phase skill definitions
#    .usdaf/toolkits/   — Agent tool indices + definitions
#    .usdaf/config.yml  — Project configuration
#    Updates CLAUDE.md and .gitignore

# 3. Estimate token cost before starting
node .usdaf/runtime/token-estimator.js estimate --complexity medium

# 4. Start with Agent 00 (Orchestrator) — it will guide the rest
```

### v2.0 Runtime Commands

```bash
# Token estimation
node .usdaf/runtime/token-estimator.js estimate --complexity simple
node .usdaf/runtime/token-estimator.js estimate --complexity complex --agents 00,02,04,08,12,15,17

# Agent memory
node .usdaf/runtime/memory-manager.js load 08-security-architect
node .usdaf/runtime/memory-manager.js compact 08-security-architect

# Toolkit inspection
node .usdaf/runtime/toolkit-loader.js list 08-security-architect
node .usdaf/runtime/toolkit-loader.js load stride-analysis

# Scout cache
node .usdaf/runtime/scout-service.js search jwt --cache-only
node .usdaf/runtime/scout-service.js cache

# Maintenance
node .usdaf/runtime/maintenance.js audit
node .usdaf/runtime/maintenance.js check
```

## Option B: Manual Agent Loading (Any LLM)

1. Pick a team preset from `docs/team-presets.md`
2. Load the relevant agent prompts from `agents/`
3. Append the certification context from `docs/agent-certification-map.md`
4. Start with Phase 0 (Kickoff)

### Agent Quick Reference

| I need to... | Use Agent |
|---|---|
| Define what to build | 02-Requirements Architect |
| Design the database/domain model | 05-Data Architect |
| Design APIs | 06-Integration Architect |
| Set up auth/permissions | 09-IAM Agent |
| Write business logic | 12-Domain Logic Agent |
| Build the frontend | 15-Frontend Architect + 16-UI Builder |
| Write tests | 17-Test Architect + 18-Test Implementation |
| Review code for security | 08-Security Architect + 20-SAST Agent |
| Set up CI/CD | 21-CI/CD Agent |

## Option C: Security Review Only

For existing code, use agents 08 + 11 + 19 + 20 in sequence:
1. Security Architect — threat model your system
2. Threat Intelligence — find attack surfaces
3. Code Review — check architecture compliance
4. SAST — scan for OWASP Top 10

## Tips for Best Results

1. **Start with requirements** — Even for fast projects, 5 minutes on requirements saves hours of rework
2. **Always include the Security agent** — Auth is where most projects get compromised
3. **Use the Security Architect early** — Designing security in is cheaper than bolting it on
4. **Feed artifacts forward** — Each agent's output is the next agent's input
5. **Don't skip gates** — If a gate fails, fix it before moving on
6. **Check memory** — Agent learnings from past sessions prevent repeating mistakes

## Example Prompt to Start

```
I want to build a task management API with:
- User registration and login
- Teams with multiple users
- Tasks assigned to users within teams
- Role-based access (admin, member, viewer)
- REST API with PostgreSQL
- Docker deployment

Use USDAF phases 0-7 and start with Phase 0 (Kickoff).
```

The Orchestrator will invoke each agent in order, building the complete system.
