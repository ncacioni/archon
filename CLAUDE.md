# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Repository Is

USDAF (Unified Spec-Driven Agile Framework) is a **documentation-only repository** — no code, no build system, no tests. It contains AI agent system prompts and framework documentation for orchestrating AI agents through a structured software development lifecycle.

## Repository Structure

```
agents/         34 agent system prompts (NN-agent-name.md format)
docs/           Framework documentation and guides
QUICKSTART.md   Entry point for new users
```

Key docs:
- `docs/USDAF.md` — Master framework specification
- `docs/MASTER-INVOCATION-GUIDE.md` — Prompt templates (A/B/C/D) for invoking the framework
- `docs/multi-agent-framework.md` — Full agent definitions
- `docs/agent-certification-map.md` — Professional certifications per agent
- `docs/team-presets.md` — YAML team configurations by project type
- `docs/spec-templates.md` — OpenAPI, DB schema, wireframe templates
- `docs/backlog-guide.md` — Markdown-native backlog management

## Agent Numbering & Layers

Agents are numbered 00–33 and organized into layers:

| Range | Layer |
|-------|-------|
| 00, 24–26, 28 | META / Agile (Orchestration) |
| 01–03, 32 | Governance & Discovery |
| 04–07, 27, 33 | Architecture & Specifications |
| 08–11 | Security (Agent 08 has **veto power**) |
| 12–16 | Implementation (Domain → App → Adapters → Frontend → UI) |
| 17–20, 31 | Quality Assurance |
| 21–23, 29–30 | Operations |

## Adding or Modifying Agents

Every agent file must include these sections (see `CONTRIBUTING.md` for the template):

- **Layer** — USDAF layer
- **Role** — One-line description
- **TOGAF Phase** — Which ADM phase(s)
- **Clean Architecture** — Dependency layer position
- **Core Mission**, **Input**, **Process**, **Output Format**, **Rules**
- **Professional Certification Context** — Certification-level knowledge equivalent

When adding a new agent, also add an entry to `docs/agent-certification-map.md`.

## Core Framework Invariants

These rules must not be violated in any agent prompt or documentation:
1. Security phase (Phase 3) always runs **before** implementation (Phase 4)
2. Agent 08 (Security Architect) has **veto power** at any phase
3. No code is written until specs (OpenAPI, DB schema, wireframes) are approved
4. Clean Architecture: dependencies point inward only — Domain ← App ← Infrastructure ← UI
5. Domain layer has zero external dependencies

## Development Framework

Follow USDAF phases 0–7 for all development work.
Read `docs/USDAF.md` for the full framework.
For each active agent, consult `docs/agent-certification-map.md`.
