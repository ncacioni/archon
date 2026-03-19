Set up or manage CI/CD, Docker, infrastructure, and releases.

## Input
$ARGUMENTS

## Pipeline

### Phase 1: Assessment

Spawn the **devops** agent to:
- Assess current deployment state
- Identify what needs to be set up or changed
- Check existing CI/CD pipelines, Docker configs, infrastructure

### Phase 2: Implementation

The **devops** agent implements:

**CI/CD Pipeline** (if needed):
```
Pre-commit → Build → Test → Security → Container → Staging → Production
```
- Pipeline code is production code — reviewed, tested, versioned
- Never skip security gates
- Every deployment must be rollback-capable

**Containerization** (if needed):
- Multi-stage Docker builds
- Non-root user, distroless base
- Health checks, resource limits
- Image signing (cosign/sigstore)

**Release Management** (if releasing):
- SemVer versioning
- CHANGELOG.md update (Keep a Changelog format)
- Release checklist verification
- Rollback plan documented

**Infrastructure** (if needed):
- IaC (Terraform/Pulumi)
- GitOps principles
- Supply chain security (pin deps, SBOM, SLSA Level 2+)

### Phase 3: Documentation

Update relevant docs:
- Runbooks (WHEN → STEPS → VERIFY → ROLLBACK → ESCALATE)
- README setup instructions
- Environment configuration

Write to `.claude/scratchpad/implementation-log.md`.

## Rules

- All secrets from vault at runtime — never in code or env files
- Every deployment has a rollback plan
- Pipeline must include security scanning
- The 30-Minute Test: new developer zero to productive in under 30 minutes
