# Team Mode Presets

Team mode provides 21 specialized agents organized by domain. Presets are curated selections for common project types.

## How Presets Work

Set the preset in `.archon/config.yml`:

```yaml
mode: team
team:
  preset: "full-stack-app"
```

The preset determines which agents are active. Commands use the same slash commands as solo mode (`/build`, `/fix`, `/review`, etc.) — the orchestrator maps solo agent names to their team counterparts.

### Solo → Team Agent Mapping

| Solo Agent | Team Agents |
|-----------|-------------|
| architect | architect (same) |
| security | security (same) |
| spec-writer | spec-writer (same) |
| ml-engineer | ml-engineer (same) |
| builder | domain-logic → app-services → adapter-layer |
| qa | test-engineer + code-reviewer |
| frontend | ui-engineer (+ ux-researcher for L/XL) |
| data | data-modeler → pipeline-engineer → warehouse-engineer |
| devops | ci-cd-engineer + observability-engineer + release-manager |

---

## Available Presets

### full-stack-app (18 agents)

For web/mobile applications with API backend, database, and frontend.

```
Architecture:  architect, security, tech-lead, spec-writer
Backend:       domain-logic, app-services, adapter-layer
Frontend:      ui-engineer, ux-researcher
Data:          data-modeler, pipeline-engineer
Quality:       test-engineer, code-reviewer
Operations:    ci-cd-engineer, observability-engineer, release-manager, tech-writer
Infrastructure: infra-engineer
```

### api-service (11 agents)

For backend APIs and microservices without frontend.

```
Architecture:  architect, security, spec-writer
Backend:       domain-logic, app-services, adapter-layer
Quality:       test-engineer, code-reviewer
Operations:    ci-cd-engineer, release-manager, tech-writer
```

### data-platform (11 agents)

For data warehouses, ETL/ELT pipelines, and analytics platforms.

```
Architecture:  architect, security, spec-writer
Data:          data-modeler, pipeline-engineer, warehouse-engineer, dba
Quality:       test-engineer
Operations:    ci-cd-engineer, observability-engineer, tech-writer
```

### ml-platform (10 agents)

For ML/AI systems: training pipelines, model serving, monitoring.

```
Architecture:  architect, security, spec-writer
ML:            ml-engineer, data-modeler, pipeline-engineer
Quality:       test-engineer
Operations:    ci-cd-engineer, observability-engineer, tech-writer
```

### frontend-app (10 agents)

For SPAs, mobile apps, and UI-heavy applications.

```
Architecture:  architect, security, spec-writer
Frontend:      ui-engineer, ux-researcher
Backend:       adapter-layer (API client layer)
Quality:       test-engineer, code-reviewer
Operations:    ci-cd-engineer, release-manager
```

### minimum-viable (6 agents)

For quick prototypes or MVPs with minimal ceremony.

```
Architecture:  architect, security
Backend:       domain-logic, adapter-layer
Quality:       test-engineer
Operations:    ci-cd-engineer
```

---

## Full Agent Roster (21 agents)

### Kept from Solo (4 — holistic vision needed)

| Agent | Model | Role |
|-------|-------|------|
| architect | opus | Solution design, ADD, C4, API contracts |
| security | opus | STRIDE, OWASP, veto power |
| spec-writer | sonnet | OpenAPI, DB schemas, wireframes |
| ml-engineer | opus | End-to-end ML pipeline |

### Decomposed from Builder (3)

| Agent | Model | Role |
|-------|-------|------|
| domain-logic | opus | Entities, value objects, aggregates, domain services |
| app-services | sonnet | Use cases, DTOs, orchestration |
| adapter-layer | sonnet | Repositories, controllers, external clients |

### Decomposed from QA (2)

| Agent | Model | Role |
|-------|-------|------|
| test-engineer | sonnet | Test strategy, implementation, execution |
| code-reviewer | sonnet | Code quality, architecture compliance |

### Decomposed from Frontend (2)

| Agent | Model | Role |
|-------|-------|------|
| ui-engineer | sonnet | Component implementation, accessibility, performance |
| ux-researcher | sonnet | UX research, journey mapping, interaction design |

### Decomposed from Data (3)

| Agent | Model | Role |
|-------|-------|------|
| data-modeler | sonnet | Domain-driven data modeling, schema design |
| pipeline-engineer | sonnet | ETL/ELT, Airflow, dbt, CDC |
| warehouse-engineer | sonnet | Snowflake/Databricks optimization, cost management |

### Decomposed from DevOps (3)

| Agent | Model | Role |
|-------|-------|------|
| ci-cd-engineer | sonnet | CI/CD pipelines, supply chain security, containers |
| observability-engineer | sonnet | Logs, metrics, traces, alerting, SLOs |
| release-manager | sonnet | Versioning, changelogs, rollback plans |

### New Team-Only (4)

| Agent | Model | Role |
|-------|-------|------|
| tech-lead | opus | Conflict resolution, tradeoff decisions, coherence |
| dba | sonnet | Query optimization, indexing, connection pooling |
| tech-writer | sonnet | Documentation, API docs, runbooks |
| infra-engineer | sonnet | IaC, cloud resources, networking, Kubernetes |

---

## Custom Agent Override

To use a preset but add/remove specific agents:

```yaml
mode: team
team:
  preset: "api-service"
  agents_override:
    - "+dba"            # Add DBA to the preset
    - "+infra-engineer"  # Add infra engineer
    - "-tech-writer"     # Remove tech writer
```

## Design Principles

- **Decompose when**: a solo agent covers multiple distinct disciplines, or parallel execution would help
- **Don't decompose when**: the agent needs holistic vision (architect, security) or end-to-end coherence (ml-engineer)
- **Same skills**: team agents reference the same 11 skills as solo — no new knowledge needed
- **Same commands**: `/build`, `/fix`, `/review`, etc. work in both modes — the orchestrator handles mapping
