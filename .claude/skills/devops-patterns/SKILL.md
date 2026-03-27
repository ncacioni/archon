---
name: devops-patterns
description: CI/CD pipelines, supply chain security, observability (logs/metrics/traces), alerting, containers, IaC, GitOps, incident response. Use when setting up deployment, monitoring, or infrastructure.
---

# DevOps Patterns

## 1. CI/CD Pipeline

```
Pre-commit → Build → Test → Security → Container → Staging → Production
```

| Stage | Actions | Gate |
|-------|---------|------|
| **Pre-commit** | Secrets detection, lint, type check, format | Block commit on secrets |
| **Build** | Install from lockfile, compile | Fail on build errors |
| **Test** | Unit (parallel), integration (testcontainers), contract | Fail below coverage thresholds |
| **Security** | SAST, SCA, secrets scan, container scan | Block on critical finding |
| **Container** | Multi-stage build, non-root user, distroless base, image signing | Fail on scan findings |
| **Staging** | Auto-deploy, DAST, E2E, performance tests | Block on DAST critical or E2E failure |
| **Production** | Blue-green or canary, health checks, auto-rollback | Rollback on failed health checks (5 min) |

### Pipeline Rules
- Pipeline code is production code — reviewed, tested, versioned
- NEVER skip security gates
- All secrets from vault at runtime
- Every deployment MUST be rollback-capable

---

## 2. Automated Releases (semantic-release)

Automate versioning, changelogs, and GitHub releases from conventional commits.

### Setup

```json
// .releaserc.json
{
  "branches": ["main"],
  "plugins": [
    ["@semantic-release/commit-analyzer", { "preset": "conventionalcommits" }],
    ["@semantic-release/release-notes-generator", { "preset": "conventionalcommits" }],
    ["@semantic-release/changelog", { "changelogFile": "CHANGELOG.md" }],
    ["@semantic-release/git", { "assets": ["CHANGELOG.md", "package.json"] }],
    "@semantic-release/github"
  ]
}
```

### Conventional Commits

```
<type>(<scope>): <description>

feat:     → minor bump (new feature)
fix:      → patch bump (bug fix)
perf:     → patch bump (performance)
refactor: → patch bump (code restructure)
docs:     → no release
chore:    → no release
ci:       → no release
test:     → no release

BREAKING CHANGE: in footer → major bump
```

### CI Workflow

- **On push to main**: `semantic-release` analyzes commits since last tag, bumps version, generates changelog, creates GitHub release
- **On PR**: `commitlint` validates all commit messages follow conventional format
- **Lockfile committed**: Required for `npm ci` in CI (reproducible builds)

### Rules

- Never bump versions manually — semantic-release owns the version
- Never edit CHANGELOG.md manually — it's auto-generated
- Commit messages are the release API — write them carefully
- Use `[skip ci]` in release commits to avoid infinite loops

---

## 3. Supply Chain Security

- **Pin dependencies**: Lockfile committed, exact versions
- **Verify integrity**: Checksums, signatures (npm `--ignore-scripts` for audit)
- **Sign images**: cosign/sigstore for container image signing
- **SBOM**: Generate with Syft/CycloneDX for every release
- **SLSA Level 2+**: Tamper-resistant build service, provenance attestation
- **Audit in CI**: `npm audit`, `pip audit`, `cargo audit` — fail on critical

---

## 4. Observability — Logs

- **Format**: Structured JSON, every entry includes correlation ID
- **Fields**: `level`, `message`, `timestamp`, `service`, `trace_id`, `span_id`, `request_id`
- **NEVER** log secrets, PII, tokens, passwords
- **Log levels**: ERROR (action needed), WARN (attention), INFO (business events), DEBUG (dev only)
- **Retention**: App logs 30d/90d, security audit 7 years, access logs 1 year
- **Aggregation**: ELK Stack, Grafana Loki, CloudWatch Logs

---

## 5. Observability — Metrics

- **RED method** (services): Rate, Error rate, Duration
- **USE method** (resources): Utilization, Saturation, Errors
- **Business KPIs**: Conversion, feature adoption, user engagement
- **Prometheus/Grafana**: Counters (requests_total), histograms (request_duration), gauges (connections_active)
- **Custom metrics**: Instrument business-critical paths
- Segment by experiment variant label for A/B tests

---

## 6. Observability — Traces

- **OpenTelemetry SDK**: Auto-instrumentation + manual spans for business logic
- **W3C Trace Context**: Propagate `traceparent` header across all services
- **Span naming**: `{service}.{operation}` (e.g., `user-service.createUser`)
- **Sampling**: 100% for errors, 10% for normal traffic (head-based or tail-based)
- **Trace-to-log correlation**: Include `trace_id` in every log entry

---

## 7. Alerting

| Severity | Channel | Response Time |
|----------|---------|---------------|
| P1 Critical | PagerDuty | 5 min (auto-page) |
| P2 High | Slack #alerts | 15 min |
| P3 Medium | Ticket | 4 hours |
| P4 Low | Backlog | Next sprint |

### Triggers
- Error rate > 5% or p95 latency > 5s → P1
- Error rate > 1% or CPU > 80% → P2
- Auth failure spike, unusual access patterns → P2

### Best Practices
- Every alert has a runbook
- Threshold breaches trigger automated responses (auto-scaling, circuit breaker)
- Suppress flapping alerts, group related alerts
- Review alert volume monthly — alert fatigue = no alerts at all

---

## 8. SLO Tracking

- **SLI**: Measurable indicator (success rate, latency p99)
- **SLO**: Target (99.9% availability, p99 < 500ms)
- **SLA**: Contractual commitment with consequences
- **Error budgets**: Track remaining budget, slow down releases when budget is low
- **Burn rate alerts**: Predict SLO violation before it happens

---

## 9. Containers

```dockerfile
# Multi-stage build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM gcr.io/distroless/nodejs20
COPY --from=builder /app/dist /app
WORKDIR /app
USER nonroot
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=3s CMD ["/nodejs/bin/node", "healthcheck.js"]
CMD ["server.js"]
```

- **Distroless/slim** base images (minimal attack surface)
- **Non-root user** always
- **Health checks**: Liveness (is it running?), readiness (can it serve?), startup (is it ready yet?)
- **Resource limits**: CPU + memory limits in orchestrator
- `.dockerignore`: Exclude `node_modules`, `.git`, tests, docs

---

## 10. Infrastructure as Code

- **Terraform**: Modules for reuse, remote state backend (S3 + DynamoDB lock), `plan` → review → `apply`
- **Pulumi**: Same patterns but in programming languages (TypeScript, Python, Go)
- **Environment parity**: dev ≈ staging ≈ prod (same IaC, different vars)
- **Drift detection**: Scheduled plan runs to detect manual changes
- **Secret management**: Vault, AWS Secrets Manager, GCP Secret Manager — never in IaC state

---

## 11. GitOps

- **ArgoCD/Flux**: Watch git repo, sync cluster state to match declarative config
- **Git as source of truth**: All changes through PRs, never `kubectl apply` manually
- **Rollback**: `git revert` the deployment commit
- **Promotion**: dev → staging → prod via PR to environment branches or overlays

---

## 12. Incident Response

### Classification
- **P1**: System down, data breach, security incident → page immediately
- **P2**: Major feature broken, significant degradation → page on-call
- **P3**: Minor issue, degraded experience → ticket, next business day

### Post-Mortem Template
```markdown
# Incident: [Title]
**Severity**: P1/P2  **Duration**: X hours  **Impact**: Y users
## Timeline
- HH:MM — [event]
## Root Cause
[5 Whys analysis]
## Action Items
- [ ] [Preventive measure] — Owner — Due date
## Lessons Learned
[What went well, what didn't]
```

- Blameless culture — focus on systems, not people
- Required for every P1/P2, within 5 business days
