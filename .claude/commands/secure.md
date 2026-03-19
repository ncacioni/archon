Perform a focused security audit on the codebase or specific components.

## Input
$ARGUMENTS

If no specific scope provided, audit the entire project.

## Pipeline

### Phase 1: Security Audit

Spawn the **security** agent to perform a comprehensive review:

1. **STRIDE Threat Modeling** — for each component under review:
   - Spoofing: authentication weaknesses
   - Tampering: data integrity issues
   - Repudiation: missing audit trails
   - Information Disclosure: data leakage risks
   - Denial of Service: resource exhaustion
   - Elevation of Privilege: authorization gaps

2. **OWASP Top 10 Scan** — check for all categories

3. **Veto Trigger Scan**:
   - Secrets in code or committed config
   - Deprecated cryptography (MD5, SHA1 for security, DES, RC4)
   - Injection vulnerabilities (SQL, command, XSS)
   - Authentication/authorization bypass
   - Missing input validation at trust boundaries
   - Internal details in API error responses
   - HTTP instead of HTTPS
   - Excessive permissions

4. **Dependency Audit** — check for known CVEs in dependencies

Write findings to `.claude/scratchpad/security-review.md`.

### Phase 2: Architecture Review (if structural issues found)

Spawn the **architect** agent to review:
- Trust boundaries and attack surface
- Data flow security (encryption in transit/at rest)
- Authentication/authorization architecture
- API security patterns

Write to `.claude/scratchpad/add.md`.

### Phase 3: Remediation Plan

Consolidate all findings with:
- **BLOCKED** items (veto triggers — must fix immediately)
- **HIGH** (should fix within 7 days)
- **MEDIUM** (fix within 30 days)
- **LOW** (fix within 90 days)
- Concrete fix suggestions with code examples for each finding

## Rules

- Veto triggers are non-negotiable blockers
- Be concrete: "Use bcrypt with cost factor 12" not "use a strong hashing algorithm"
- Provide code examples for fixes when possible
- Never suggest disabling security features for convenience
- Prioritize by exploitability and impact, not theoretical risk
