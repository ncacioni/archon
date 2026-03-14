# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

USDAF (Unified Spec-Driven Agile Framework) is a multi-agent development framework with an intelligent runtime. It contains AI agent system prompts, framework documentation, and a Node.js runtime for memory, toolkits, and subagent dispatch.

## Repository Structure

```
agents/              34 agent system prompts (NN-agent-name.md format)
docs/                Framework documentation and guides
bin/                 CLI entry point (npx usdaf init)
.usdaf/              v2.0 Runtime
├── runtime/         6 modules: memory-manager, toolkit-loader, token-estimator,
│   │                scout-service, agent-registry, maintenance
│   └── __tests__/   50 tests (Node.js built-in test runner)
├── skills/          6 phase skill definitions (discovery → operations)
├── toolkits/        7 agent indices + 24 tool definitions (YAML)
├── memory/          Persistent agent memory (auto-managed, gitignored)
└── config.yml       Default project configuration template
QUICKSTART.md        Entry point for new users
```

Key docs:
- `docs/USDAF.md` — Master framework specification
- `docs/MASTER-INVOCATION-GUIDE.md` — Prompt templates for invoking the framework
- `docs/agent-certification-map.md` — Professional certifications per agent
- `docs/team-presets.md` — YAML team configurations by project type

## Runtime (v2.0)

The runtime lives in `.usdaf/runtime/` and uses Node.js ES modules with `js-yaml` as the only dependency.

### Running Tests

```bash
cd .usdaf/runtime && npm install
node --test __tests__/*.test.js
```

### Key Modules

| Module | Exports | Purpose |
|--------|---------|---------|
| `memory-manager.js` | `load`, `appendLearning`, `graduate`, `compactIfNeeded` | Persistent agent memory with graduation rules |
| `toolkit-loader.js` | `loadIndex`, `loadTool`, `listTools` | Two-level YAML toolkit loading |
| `token-estimator.js` | `estimate`, `formatEstimate` | Token cost estimation |
| `scout-service.js` | `loadCache`, `saveEvaluation`, `search` | OSS package evaluation cache |
| `agent-registry.js` | `loadAgent`, `getTeamAgents`, `buildPrompt` | Agent loading + subagent prompt assembly |
| `maintenance.js` | `shouldRun`, `audit` | Toolkit integrity + vulnerability auditing |

All modules have CLI interfaces guarded by `import.meta.url` checks. They can be run directly or imported as libraries.

### Path Conventions

- Agent prompts: `agents/NN-agent-name.md`
- Toolkit indices: `.usdaf/toolkits/NN-agent-name.index.yml`
- Tool definitions: `.usdaf/toolkits/tools/tool-name.tool.yml`
- Agent memory: `.usdaf/memory/agents/agent-id.md` (gitignored)
- Phase skills: `.usdaf/skills/usdaf-{phase}.md`

## Agent Numbering & Layers

Agents are numbered 00-33 and organized into layers:

| Range | Layer |
|-------|-------|
| 00, 24-26, 28 | META / Agile (Orchestration) |
| 01-03, 32 | Governance & Discovery |
| 04-07, 27, 33 | Architecture & Specifications |
| 08-11 | Security (Agent 08 has **veto power**) |
| 12-16 | Implementation (Domain > App > Adapters > Frontend > UI) |
| 17-20, 31 | Quality Assurance |
| 21-23, 29-30 | Operations |

Main agents (stay in context): 00, 08, 24. All others dispatched as subagents.

## Core Framework Invariants

These rules must not be violated in any agent prompt or documentation:
1. Security phase always runs **before** implementation
2. Agent 08 (Security Architect) has **veto power** at any phase
3. No code is written until specs (OpenAPI, DB schema, wireframes) are approved
4. Clean Architecture: dependencies point inward only — Domain < App < Infrastructure < UI
5. Domain layer has zero external dependencies

## Development Framework

Follow USDAF phases 0-7 for all development work.
Read `docs/USDAF.md` for the full framework.
For each active agent, consult `docs/agent-certification-map.md`.

Use the token estimator before starting:
```bash
node .usdaf/runtime/token-estimator.js estimate --complexity medium
```
