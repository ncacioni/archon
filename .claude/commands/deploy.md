Set up or manage CI/CD, Docker, infrastructure, and releases.

## Output Protocol

**MANDATORY**: You MUST output visible text to the user after completing each phase. This is not optional. The user must see real-time progress as the pipeline executes.

Between every phase:
1. Output a brief status update (3-5 lines) describing what was done, key decisions made, and issues found
2. If in plan mode, still output commentary — do not silently plan without explanation
3. Write artifacts to scratchpad AND summarize findings in visible text

**Silent execution is a bug.** If the user sees no output between agent spawns, the pipeline is broken.

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

### Phase 3: Security Review

Spawn the **security** agent to review deployment artifacts:
- Scan pipeline configs for hardcoded secrets or tokens
- Verify container images use non-root user and minimal base
- Check IaC for excessive IAM permissions
- Validate no secrets in environment variables or code

**If security agent flags VETO triggers → STOP. Report blockers to user.**

Write to `.claude/scratchpad/security-review.md`.

### Phase 4: Documentation

Update relevant docs:
- Runbooks (WHEN → STEPS → VERIFY → ROLLBACK → ESCALATE)
- README setup instructions
- Environment configuration

Write to `.claude/scratchpad/implementation-log.md`.

## Progress Reporting

After each phase completes, report a concise status update to the user:

- **Phase 1**: Report current deployment state assessment (what exists, what's missing, what needs change)
- **Phase 2**: Report what was implemented (pipeline stages, Docker config, release artifacts, infra changes)
- **Phase 3**: Report security findings — blockers halt the pipeline, advisories are listed
- **Phase 4**: Report documentation updates (runbooks created, README changes, env config)

## Rules

- All secrets from vault at runtime — never in code or env files
- Every deployment has a rollback plan
- Pipeline must include security scanning
- The 30-Minute Test: new developer zero to productive in under 30 minutes
