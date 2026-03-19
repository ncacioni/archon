Review code for quality, architecture compliance, and security issues.

## Input
$ARGUMENTS

If no specific files/PR provided, review recent changes (git diff, staged files).

## Pipeline

### Phase 1: Code Review

Spawn the **qa** agent to perform:
- Clean Architecture compliance (dependency direction check)
- Code quality (complexity, duplication, naming, error handling)
- Test coverage assessment
- SAST quality gate checks

Write findings to `.claude/scratchpad/qa-review.md`.

### Phase 2: Security Review

Spawn the **security** agent to perform:
- STRIDE threat modeling on changed components
- OWASP Top 10 check
- Veto trigger scan (hardcoded secrets, injection, auth bypass, deprecated crypto)
- Advisory findings with severity levels

Write findings to `.claude/scratchpad/security-review.md`.

### Phase 3: Summary

Present consolidated review with:
- **Blockers** (must fix before shipping)
- **High** (should fix)
- **Medium/Low** (advisory)
- Each finding: file, line, severity, category, description, suggested fix

## Progress Reporting

After each phase completes, report a concise status update to the user:

- **Phase 1**: Report QA findings summary (number of issues by severity, key patterns found)
- **Phase 2**: Report security findings summary (blockers, high/medium/low counts, critical items)
- **Phase 3**: Present consolidated review — this IS the final output to the user

## Rules

- Be concrete: provide file paths, line numbers, and fix suggestions
- Security veto triggers are always blockers — no exceptions
- Architecture violations (inner layer importing outer) are always flagged
- Present findings by severity, not by agent
