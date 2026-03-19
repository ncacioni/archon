# Archon — Team Presets

> Project-specific agent team configurations. Used by Agent 00 (Orchestrator) during Phase 0 (Kickoff).

---

## How Team Selection Works

1. User describes their project scope
2. Orchestrator (00) recommends a preset based on project type
3. User confirms or customizes the team
4. Team roster is saved to `backlog/config.yml`
5. Only active team agents participate in the project

---

## Core Team (Always Active)

These agents are **mandatory for every project**, regardless of preset:

| # | Agent | Why |
|---|-------|-----|
| 00 | Orchestrator | Coordinates all phases and agents |
| 08 | Security Architect | Veto power, security-by-design is non-negotiable |
| 27 | Spec Writer | Spec-driven development is the foundation of Archon |
| 28 | Backlog Manager | Task lifecycle tracking is non-negotiable |

---

## Preset: Full Stack Application

**Use when**: Building a web/mobile app with API backend, database, and frontend.

```yaml
preset: full-stack-app
description: "Complete web/mobile application with API and frontend"

mandatory:
  - 00-orchestrator
  - 01-architecture-board
  - 02-requirements-architect
  - 04-enterprise-architect
  - 06-integration-architect
  - 08-security-architect
  - 12-domain-logic
  - 13-app-services
  - 14-adapters
  - 15-frontend-architect
  - 17-test-architect
  - 18-test-implementation
  - 19-code-review
  - 21-cicd
  - 23-documentation
  - 26-product-owner
  - 27-spec-writer
  - 28-backlog-manager

recommended:
  - 05-data-architect         # If complex data model
  - 07-infrastructure         # If deploying to cloud
  - 09-iam                    # If auth beyond basic OAuth
  - 10-secrets-crypto         # If handling sensitive data
  - 16-ui-builder             # If complex UI components
  - 20-sast                   # If security-critical
  - 22-observability          # If production monitoring needed
  - 29-release-manager        # If formal release process
  - 30-devex-engineer         # If team onboarding needed
  - 31-performance-engineer   # If performance SLAs exist
  - 32-ux-researcher          # If user-facing product
  - 33-data-engineer          # If migrations/seeding needed
```

---

## Preset: API Service / Microservice

**Use when**: Building a backend API or microservice without a frontend.

```yaml
preset: api-service
description: "Backend API or microservice"

mandatory:
  - 00-orchestrator
  - 01-architecture-board
  - 02-requirements-architect
  - 04-enterprise-architect
  - 06-integration-architect
  - 08-security-architect
  - 12-domain-logic
  - 13-app-services
  - 14-adapters
  - 17-test-architect
  - 18-test-implementation
  - 19-code-review
  - 21-cicd
  - 23-documentation
  - 27-spec-writer
  - 28-backlog-manager

recommended:
  - 05-data-architect
  - 07-infrastructure
  - 09-iam
  - 10-secrets-crypto
  - 20-sast
  - 22-observability
  - 29-release-manager
  - 31-performance-engineer
  - 33-data-engineer
```

---

## Preset: Security Hardening

**Use when**: Hardening an existing application's security posture.

```yaml
preset: security-hardening
description: "Security hardening of existing application"

mandatory:
  - 00-orchestrator
  - 08-security-architect
  - 09-iam
  - 10-secrets-crypto
  - 11-threat-intelligence
  - 17-test-architect
  - 18-test-implementation
  - 20-sast
  - 27-spec-writer
  - 28-backlog-manager

recommended:
  - 01-architecture-board
  - 19-code-review
  - 21-cicd
  - 22-observability
```

---

## Preset: Documentation Project

**Use when**: Creating policies, standards, SOPs, or technical documentation.

```yaml
preset: documentation
description: "Policy, standard, and documentation creation"

mandatory:
  - 00-orchestrator
  - 02-requirements-architect
  - 03-compliance
  - 23-documentation
  - 26-product-owner
  - 27-spec-writer
  - 28-backlog-manager

recommended:
  - writer                    # IAM-specific doc writer
  - iam-architect             # IAM technical reviewer
  - ceo-reviewer              # Executive reviewer
  - compliance                # Compliance validator
```

---

## Preset: Data Pipeline

**Use when**: Building ETL, data pipelines, analytics, or data processing systems.

```yaml
preset: data-pipeline
description: "ETL, data pipeline, or analytics system"

mandatory:
  - 00-orchestrator
  - 01-architecture-board
  - 02-requirements-architect
  - 05-data-architect
  - 07-infrastructure
  - 08-security-architect
  - 14-adapters
  - 17-test-architect
  - 18-test-implementation
  - 21-cicd
  - 27-spec-writer
  - 28-backlog-manager
  - 33-data-engineer

recommended:
  - 10-secrets-crypto
  - 20-sast
  - 22-observability
  - 29-release-manager
```

---

## Preset: Frontend Application

**Use when**: Building a SPA, mobile app, or UI-heavy application.

```yaml
preset: frontend-app
description: "Single-page application or mobile UI"

mandatory:
  - 00-orchestrator
  - 02-requirements-architect
  - 08-security-architect
  - 15-frontend-architect
  - 16-ui-builder
  - 17-test-architect
  - 18-test-implementation
  - 27-spec-writer
  - 28-backlog-manager
  - 32-ux-researcher

recommended:
  - 01-architecture-board
  - 06-integration-architect
  - 19-code-review
  - 20-sast
  - 30-devex-engineer
```

---

## Preset: Minimum Viable / Prototype

**Use when**: Building a quick prototype or MVP with minimal ceremony.

```yaml
preset: minimum-viable
description: "Quick prototype or MVP"

mandatory:
  - 00-orchestrator
  - 02-requirements-architect
  - 12-domain-logic
  - 13-app-services
  - 14-adapters
  - 17-test-architect
  - 27-spec-writer
  - 28-backlog-manager

recommended:
  - 08-security-architect     # Light-touch security review
  - 19-code-review
  - 21-cicd
```

**Note**: Even for MVPs, Agent 08 is in the core team and provides at minimum a security checklist review before launch.

---

## Preset: Creative & Innovation (Game Development)

**Use when**: Designing new game features, modes, quest content, UX improvements, and creative direction. Sprint-based creative cycle with spec-driven handoff to implementation.

```yaml
preset: creative-innovation
description: "Game design, UX research, quest writing, and creative direction"

mandatory:
  - 00-orchestrator             # Coordinates creative sprints
  - 02-requirements-architect   # Player stories, acceptance criteria
  - 12-domain-logic             # Game mechanics, rules, state machines
  - 15-frontend-architect       # UI/UX architecture, interaction patterns
  - 16-ui-builder               # Component design, accessibility, visual polish
  - 23-documentation            # Game design docs, quest descriptions, mode guides
  - 25-innovation-scout         # Benchmarking competitors, gaming trends, inspiration
  - 26-product-owner            # Creative vision, feature prioritization, final approval proxy
  - 27-spec-writer              # Specs for new modes, wireframes, API contracts
  - 28-backlog-manager          # Sprint planning, velocity, backlog grooming
  - 32-ux-researcher            # Player personas, journey maps, usability, playtesting

recommended:
  - 05-data-architect           # If new data models needed (e.g. achievements, leaderboards)
  - 06-integration-architect    # If new API endpoints needed
  - 08-security-architect       # If feature touches auth or user data
  - 13-app-services             # If backend orchestration needed
```

**Creative Sprint Cycle** (2 weeks):
1. **Discovery** (Day 1-3): UX Researcher (32) + Innovation Scout (25) research trends, player feedback, competitor analysis
2. **Ideation** (Day 4-5): Product Owner (26) + Requirements Architect (02) define player stories, prioritize ideas
3. **Specification** (Day 6-8): Spec Writer (27) + Domain Logic (12) write game mechanics specs, quest structures
4. **Design** (Day 9-11): Frontend Architect (15) + UI Builder (16) create wireframes, interaction patterns
5. **Review** (Day 12-14): Documentation (23) writes game design docs → **Human approver** gives final go/no-go
6. **Handoff**: Approved specs move to the Full Stack team backlog for implementation

---

## Preset: Solo Dev — Base

**Use when**: Working alone on any project. Lightweight core team that covers spec-driven development, basic security, and quality without the overhead of full team coordination. Add specialists from the recommended list based on project type.

```yaml
preset: solo-dev
description: "Single developer, spec-first, lightweight agent selection"

mandatory:
  - 00-orchestrator              # Coordinates phases (solo mode: sequential, not dispatch)
  - 02-requirements-architect    # FR/NFR elicitation — even solo, requirements matter
  - 08-security-architect        # Security review (light-touch, checklist-focused)
  - 12-domain-logic              # Core business logic, entities, use cases
  - 14-adapters                  # Infrastructure layer, DB access, external APIs
  - 17-test-architect            # Test strategy — keep quality even when moving fast
  - 27-spec-writer               # Specs before code — the foundation of Archon

recommended:
  - 05-data-architect            # If data modeling beyond basic CRUD
  - 06-integration-architect     # If building or consuming APIs
  - 15-frontend-architect        # If building UI
  - 19-code-review               # For a second-opinion pass before shipping
  - 21-cicd                      # If setting up deployment pipeline
  - 33-data-engineer             # If ETL, migrations, or data pipelines
```

**Solo Dev Workflow** (simplified phases):
1. **Discovery**: Requirements Architect (02) structures what you want to build
2. **Spec**: Spec Writer (27) produces specs (OpenAPI, schema, wireframes as needed)
3. **Security**: Security Architect (08) does a checklist review of the spec
4. **Build**: Domain Logic (12) → Adapters (14) → any active frontend/integration agents
5. **Test**: Test Architect (17) defines strategy, you implement
6. **Ship**: CI/CD (21) if active, otherwise manual deploy

**Note**: In solo mode, the orchestrator runs phases sequentially within the same conversation rather than dispatching to separate subagent instances. The user (you) is the final approver at every gate.

---

## Preset: Solo Dev — Data Engineering

**Use when**: Working alone on data pipelines, ETL, analytics, or data platform projects. Extends the solo-dev base with data-specific agents.

```yaml
preset: solo-dev-data
description: "Solo data engineer — pipelines, ETL, analytics, data platform"

mandatory:
  - 00-orchestrator
  - 02-requirements-architect
  - 05-data-architect            # Domain model, ERD, data classification
  - 07-infrastructure            # Cloud infra, IaC (Airflow, Snowflake, etc.)
  - 08-security-architect        # Data security, PII, encryption at rest
  - 14-adapters                  # Connectors, DB access, API clients
  - 17-test-architect            # Data quality tests, pipeline validation
  - 27-spec-writer               # Schema specs, pipeline contracts
  - 33-data-engineer             # ETL, migrations, CDC, pipeline patterns

recommended:
  - 03-compliance                # If PII/GDPR/SOC2 applies
  - 06-integration-architect     # If exposing data via APIs
  - 10-secrets-crypto            # If handling sensitive data / encryption
  - 22-observability             # Pipeline monitoring, alerting, SLAs
```

---

## Preset: Solo Dev — Web/Mobile App

**Use when**: Working alone on a web or mobile application (personal projects, side projects, MVPs).

```yaml
preset: solo-dev-app
description: "Solo developer — web or mobile application"

mandatory:
  - 00-orchestrator
  - 02-requirements-architect
  - 06-integration-architect     # API contracts (OpenAPI)
  - 08-security-architect        # Auth, XSS, OWASP basics
  - 12-domain-logic              # Business logic
  - 13-app-services              # Use case orchestration
  - 14-adapters                  # DB repos, external API clients
  - 15-frontend-architect        # UI architecture, state management
  - 17-test-architect            # Test strategy
  - 27-spec-writer               # API spec, wireframes, DB schema

recommended:
  - 05-data-architect            # If complex data model
  - 09-iam                       # If auth beyond basic (OAuth, RBAC)
  - 16-ui-builder                # If complex UI components
  - 19-code-review               # Pre-ship quality pass
  - 21-cicd                      # If automated deployment
  - 32-ux-researcher             # If user-facing product
```

---

## Custom Team Configuration

Users can always customize by adding/removing agents:

```
Orchestrator: "I recommend the Full Stack App preset for this project.
This includes 18 mandatory agents. Would you like to:
1. Use this preset as-is
2. Add agents from the recommended list
3. Start from scratch and pick individual agents
4. Use a different preset

Which agents from the recommended list would you like to add?"
```

---

## Team Roster in config.yml

```yaml
team:
  core: [00, 08, 27, 28]           # Always active
  active: [00, 01, 02, 04, ...]    # Full active team for this project
  preset: full-stack-app             # Which preset was used
  customizations:                    # Any additions/removals from preset
    added: [32-ux-researcher]
    removed: []
```
