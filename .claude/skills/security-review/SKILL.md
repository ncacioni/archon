---
name: security-review
description: STRIDE threat modeling, OWASP Top 10 checklist, veto triggers, security controls matrix, Zero Trust principles. Use when reviewing code, APIs, or architecture for security.
---

# Security Review

## STRIDE Threat Model

For each component or feature under review:

| Category | Question | Standard Mitigations |
|----------|----------|---------------------|
| **Spoofing** | Can an attacker impersonate a user or system? | MFA, strong auth, certificate pinning, API keys |
| **Tampering** | Can data be modified in transit or at rest? | TLS 1.3, HMAC, digital signatures, checksums |
| **Repudiation** | Can actions be performed without audit trail? | Audit logs, timestamps, immutable event log |
| **Information Disclosure** | Can sensitive data leak through errors, logs, or APIs? | Encryption, minimal error messages, log scrubbing |
| **Denial of Service** | Can the system be overwhelmed? | Rate limiting, circuit breakers, auto-scaling, WAF |
| **Elevation of Privilege** | Can a user gain unauthorized access? | RBAC, least privilege, input validation, sandboxing |

### Finding Output Format
```
Threat:      Description of the threat
Category:    STRIDE category
Severity:    critical | high | medium | low
Impact:      What happens if exploited
Control:     Recommended mitigation
Status:      blocker | advisory
```

---

## Veto Triggers (Non-Negotiable Blockers)

These MUST be fixed before code ships. No exceptions:

- **Secrets in code** — API keys, passwords, tokens committed to repo or hardcoded
- **Deprecated cryptography** — MD5, SHA1 for security purposes, DES, RC4
- **Injection vulnerabilities** — SQL injection, command injection, XSS
- **Authentication/authorization bypass** — missing auth checks, broken access control
- **OWASP Top 10 critical findings** — by design, not just implementation
- **Internal details in API errors** — stack traces, DB errors, file paths
- **HTTP for data in transit** — must be HTTPS everywhere
- **Missing input validation** — at trust boundaries
- **Excessive permissions** — overly broad IAM roles, DB superuser in app

Format: "This is a blocker. [Specific issue] must be fixed because [concrete risk]."

---

## Advisory Mode (Non-Critical)

Present as recommendations with severity:

```
[HIGH] Rate limiting not configured on /api/v1/auth/login
  Risk: Brute force attacks against authentication
  Fix: Add rate limiting (e.g., 5 attempts per minute per IP)

[MEDIUM] No CORS policy defined
  Risk: Cross-origin requests from untrusted domains
  Fix: Configure CORS allowlist for known frontend origins

[LOW] API responses include server version header
  Risk: Information disclosure aids reconnaissance
  Fix: Remove X-Powered-By and Server headers
```

Developer decides priority. Do not block on advisory findings.

---

## Security Controls Matrix

| Layer | Control | Status |
|-------|---------|--------|
| **Network** | TLS 1.3 everywhere | Required |
| **Network** | WAF for public endpoints | Recommended |
| **Auth** | JWT with short expiry + refresh token | Required |
| **Auth** | MFA for admin accounts | Recommended |
| **Data** | Encryption at rest (AES-256) | Required |
| **Data** | Field-level encryption for PII | Recommended |
| **API** | Input validation (schema-based) | Required |
| **API** | Rate limiting | Required |
| **API** | CORS allowlist | Required |
| **Logging** | Audit trail for sensitive operations | Required |
| **Logging** | No sensitive data in logs | Required |
| **Secrets** | Vault-based secret management | Required |
| **Secrets** | Rotation policy | Recommended |
| **Deps** | Dependency vulnerability scanning in CI | Required |
| **Deps** | SBOM generation per release | Recommended |

---

## OWASP Top 10 Checklist

| ID | Category | Check For |
|----|----------|-----------|
| A01 | Broken Access Control | Missing authz checks, CORS wildcards, CSRF gaps, IDOR |
| A02 | Cryptographic Failures | Weak algorithms, hardcoded keys, missing encryption, plaintext passwords |
| A03 | Injection | SQL concatenation, unsanitized input, command injection, XSS |
| A04 | Insecure Design | No rate limiting, predictable IDs, missing abuse cases |
| A05 | Security Misconfiguration | Debug mode in prod, default credentials, missing security headers |
| A06 | Vulnerable Components | Known CVEs in dependencies, outdated frameworks |
| A07 | Auth Failures | Weak password policy, tokens in localStorage, no brute-force protection |
| A08 | Data Integrity Failures | Missing integrity checks, insecure deserialization |
| A09 | Logging & Monitoring Failures | Secrets in logs, no audit trail, no alerting |
| A10 | SSRF | User-controlled URLs without validation |

---

## Zero Trust Principles

1. **Never trust, always verify** — authenticate and authorize every request
2. **Assume breach** — design as if attackers are already inside
3. **Verify explicitly** — validate identity, device, location, behavior
4. **Least privilege** — minimum permissions for the task at hand
5. **Micro-segmentation** — isolate workloads, limit blast radius

---

## Vulnerability Remediation SLAs

| Severity | Remediation SLA | Metric |
|----------|----------------|--------|
| Critical (CVSS ≥ 9.0) | 24 hours | Block deployment |
| High (CVSS 7.0-8.9) | 7 days | Block deployment |
| Medium (CVSS 4.0-6.9) | 30 days | Track |
| Low (CVSS < 4.0) | 90 days | Track |

---

## Quality Gates (Block Deployment)

- Any CVSS ≥ 9.0 → **BLOCKED**
- Any hardcoded secret → **BLOCKED**
- Any injection vulnerability → **BLOCKED**
- Any dependency with CVE ≥ 7.0 → **BLOCKED**
- Failing security test = P0 vulnerability
