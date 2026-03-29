Perform a comprehensive codebase audit covering security, quality, and architecture.

## Output Protocol

**MANDATORY**: You MUST output visible text to the user after completing each phase. This is not optional. The user must see real-time progress as the pipeline executes.

Between every phase:
1. Output a brief status update (3-5 lines) describing what was done, key decisions made, and issues found
2. If in plan mode, still output commentary — do not silently plan without explanation
3. Write artifacts to scratchpad AND summarize findings in visible text

**Silent execution is a bug.** If the user sees no output between agent spawns, the pipeline is broken.

## Input
$ARGUMENTS

Optional flag: `--framework` — also audit Archon framework internals (agent configs, commands, toolkits, runtime integrity).

## Pipeline

### Pre-phase: Agent Resolution

Resolve all agents needed for this pipeline upfront.

Run:
```
node .archon/runtime/config-loader.js resolve-all security qa architect --output .claude/scratchpad/agent-map.json
```

Read `.claude/scratchpad/agent-map.json` for ALL subsequent phases. When a phase says "spawn the **X**", look up `agents["X"]` in the map and spawn using the listed `agents`, `strategy`, and `agents_dir`.

**Do NOT call resolve individually during later phases. The agent map is the single source of truth.**

### Phase 1: Security Audit

Spawn the **security** agent to perform a full security audit:
- **STRIDE threat modeling** across the entire codebase (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
- **OWASP Top 10** scan for all applicable vulnerability classes
- **Veto trigger scan**: hardcoded secrets, SQL injection, auth bypass, deprecated crypto, missing input validation
- **Dependency audit**: known CVEs in direct and transitive dependencies, outdated packages, supply chain risks
- **Authentication & authorization review**: token handling, session management, privilege escalation paths
- **Data exposure check**: PII in logs, unencrypted sensitive fields, overly permissive API responses

Write findings to `.claude/scratchpad/audit-security.md` with each finding containing: file path, line number, severity (P0/P1/P2), category, description, and recommended fix.

### Phase 2: Quality Audit

Spawn the **qa** agent to perform a full quality audit:
- **Test assessment**: coverage gaps, missing edge cases, test quality (are tests actually asserting meaningful behavior?), test pyramid balance (unit vs integration vs E2E)
- **Code quality**: cyclomatic complexity, duplication, dead code, naming conventions, error handling patterns, function length, nesting depth
- **Documentation**: missing or outdated doc comments, undocumented public APIs, stale README sections
- **Architecture compliance**: Clean Architecture dependency direction (inner layers must not import outer layers), port/adapter contract adherence, domain layer purity (zero external dependencies)
- **SAST quality gates**: CVSS >= 9.0, hardcoded secrets, injection vulnerabilities, dependencies with CVE >= 7.0

Write findings to `.claude/scratchpad/audit-quality.md` with each finding containing: file path, line number, severity (P0/P1/P2), category, description, and recommended fix.

### Phase 3: Architecture Audit

Spawn the **architect** agent to perform a full architecture audit:
- **Pattern compliance**: verify adherence to declared architecture style (Clean Architecture, hexagonal, etc.), check SOLID principle violations, confirm aggregate boundaries
- **Coupling analysis**: identify tight coupling between modules, circular dependencies, god classes/modules, inappropriate intimacy between layers
- **Capability gaps**: missing error handling strategies, absent retry/circuit-breaker patterns where needed, missing observability (logging, metrics, tracing), absent health checks
- **Scalability review**: identify bottlenecks (synchronous calls that should be async, missing caching, N+1 queries), evaluate horizontal scaling readiness, assess state management
- **API design review**: REST/GraphQL convention adherence, versioning strategy, pagination patterns, error response consistency

Write findings to `.claude/scratchpad/audit-architecture.md` with each finding containing: file path, line number (if applicable), severity (P0/P1/P2), category, description, and recommended fix.

### Phase 4: Consolidated Report

Merge findings from all three audit phases into a single prioritized report.

1. **Read** `.claude/scratchpad/audit-security.md`, `.claude/scratchpad/audit-quality.md`, and `.claude/scratchpad/audit-architecture.md`

2. **Deduplicate**: if multiple phases flagged the same issue, keep the highest severity and merge context

3. **Produce the consolidated report** with this structure:
   - **Executive Summary**: 3-5 sentence overview of codebase health, critical risk areas, and overall recommendation
   - **Metrics Table**:
     | Category | P0 (Critical) | P1 (High) | P2 (Medium) | Total |
     |----------|---------------|-----------|-------------|-------|
     | Security | count | count | count | count |
     | Quality | count | count | count | count |
     | Architecture | count | count | count | count |
     | **Total** | count | count | count | count |
   - **P0 Findings (Critical)**: must fix immediately — security veto triggers, CVSS >= 9.0, data exposure, auth bypass
   - **P1 Findings (High)**: should fix before next release — architecture violations, significant quality issues, medium-severity vulnerabilities
   - **P2 Findings (Medium)**: fix when possible — code quality improvements, minor pattern deviations, documentation gaps
   - **Recommendations**: ordered action plan with estimated effort (S/M/L) for each item

4. **Write** the consolidated report to `.claude/scratchpad/audit-report.md`

5. **If `--framework` flag is present**, also perform Archon framework audit:
   - Run `node .archon/runtime/integrity.js check` and report results
   - Audit agent configs: verify all agents have valid frontmatter (model, tools, description), check for orphaned or missing agent files
   - Command coverage: verify all commands listed in CLAUDE.md exist as files, check for undocumented commands
   - Toolkit integrity: verify toolkit indices reference valid tool definitions, check for broken references
   - Config consistency: verify `.archon/config.yml` settings are valid, check mode-specific agent availability
   - Append framework findings to the consolidated report under a **Framework Integrity** section, using the same P0/P1/P2 severity system

## Progress Reporting

After each phase completes, report a concise status update to the user:

- **Phase 1**: Report security audit summary (veto triggers found, dependency CVE count, top risk areas)
- **Phase 2**: Report quality audit summary (test coverage gaps, architecture violations, code quality hotspots)
- **Phase 3**: Report architecture audit summary (pattern compliance score, coupling issues, capability gaps)
- **Phase 4**: Present the consolidated report — this IS the primary deliverable to the user

Keep updates concise (3-5 lines per phase). Focus on findings, severity counts, and critical items — not process narration.

## Rules

- Security veto triggers are always P0 — no exceptions, no downgrading
- Be concrete: provide file paths and line numbers for every finding
- Never suggest disabling security features as a fix (e.g., "turn off CORS", "disable auth")
- Prioritize by exploitability and real-world impact, not theoretical risk
- The consolidated report in `.claude/scratchpad/audit-report.md` is the primary artifact
- Framework issues (when `--framework` is used) follow the same P0/P1/P2 severity system
- Present findings by severity, not by audit phase — the user cares about priority, not process
- If no issues are found in a category, say so explicitly — do not omit the section
