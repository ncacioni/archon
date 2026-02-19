# Application Transformation Plan

## From Non-Standard to Framework-Compliant Architecture

**Companion to:** Multi-Agent System Framework v1.0 (TOGAF + Clean Architecture + Security-by-Design)
**Purpose:** Transform existing applications built without standards into compliant, secure, well-architected systems — incrementally, without full rewrites.
**Philosophy:** Strangler Fig Pattern — wrap, replace, retire. Never big-bang.

---

## Table of Contents

1. [Transformation Philosophy](#1-transformation-philosophy)
2. [Assessment Phase — Discovery Agents](#2-assessment-phase--discovery-agents)
3. [Maturity Model — Where Are You Now?](#3-maturity-model--where-are-you-now)
4. [Transformation Roadmap — 6 Waves](#4-transformation-roadmap--6-waves)
5. [Wave 0: Emergency Security Hardening](#5-wave-0-emergency-security-hardening)
6. [Wave 1: Observability & Documentation](#6-wave-1-observability--documentation)
7. [Wave 2: Architecture Boundary Extraction](#7-wave-2-architecture-boundary-extraction)
8. [Wave 3: Domain & Data Restructuring](#8-wave-3-domain--data-restructuring)
9. [Wave 4: Security Architecture Implementation](#9-wave-4-security-architecture-implementation)
10. [Wave 5: Quality & Automation](#10-wave-5-quality--automation)
11. [Agent Roles in Transformation](#11-agent-roles-in-transformation)
12. [Anti-Patterns to Detect](#12-anti-patterns-to-detect)
13. [Decision Trees](#13-decision-trees)
14. [Transformation Tracking](#14-transformation-tracking)
15. [Prompts for Each Wave](#15-prompts-for-each-wave)

---

## 1. Transformation Philosophy

### Core Principles

1. **Never rewrite from scratch** — Rewrites fail. Transform incrementally using the Strangler Fig Pattern: build the new alongside the old, redirect traffic gradually, retire the old.

2. **Security first, always** — The first wave is ALWAYS emergency security hardening. A non-standard app likely has critical vulnerabilities. Fix those before anything else.

3. **Value at every step** — Each wave delivers tangible improvement. The app gets better after every wave, even if you stop mid-transformation.

4. **Tests before refactoring** — Never refactor without tests. If there are no tests, Wave 1 includes adding characterization tests that capture current behavior.

5. **Compliance as a driver** — Use compliance requirements (GDPR, ISO 27001, TPN) as business justification for transformation work.

6. **Document as you go** — Every transformation decision becomes an ADR. This builds the Architecture Repository naturally.

### The Strangler Fig Strategy

```
Phase 1: WRAP                    Phase 2: REPLACE               Phase 3: RETIRE
┌────────────────────┐           ┌────────────────────┐         ┌────────────────────┐
│ ┌────────────────┐ │           │ ┌──────┐ ┌───────┐ │         │ ┌────────────────┐ │
│ │                │ │           │ │ New  │ │       │ │         │ │                │ │
│ │  Old Monolith  │ │    →      │ │ Code │ │  Old  │ │   →     │ │   New System   │ │
│ │                │ │           │ │      │ │       │ │         │ │  (Compliant)   │ │
│ └────────────────┘ │           │ └──────┘ └───────┘ │         │ └────────────────┘ │
│   + API Facade     │           │   Facade routes     │         │   Old retired      │
└────────────────────┘           └────────────────────┘         └────────────────────┘
```

---

## 2. Assessment Phase — Discovery Agents

Before transforming anything, you need to know what you have. This assessment phase uses 5 agents from the framework to audit the current application.

### 2.1 Assessment Agent Assignments

| Assessment Area | Agent(s) | What They Analyze | Output |
|---|---|---|---|
| Current State Architecture | 04-Enterprise Architect | Codebase structure, dependencies, components, integrations | As-Is Architecture Document |
| Data & Domain Analysis | 05-Data Architect | Database schema, data flows, data classification, PII exposure | Data Audit Report |
| Security Posture | 08-Security Architect + 11-Threat Intel + 20-SAST | Vulnerabilities, attack surface, secrets exposure, OWASP compliance | Security Audit Report |
| Auth & Access | 09-IAM Agent | Current auth mechanism, session management, permission model | IAM Gap Analysis |
| Code Quality | 19-Code Review | Architecture violations, code smells, dependency analysis, tech debt | Technical Debt Inventory |
| Compliance | 03-Compliance Agent | Regulation applicability, current gaps, data handling violations | Compliance Gap Report |

### 2.2 Assessment Prompt

Use this prompt to start the assessment:

```
You are performing an Application Assessment for transformation. Analyze the provided codebase/documentation and produce a structured report covering:

## 1. Architecture Assessment
- Current architecture pattern (monolith, accidental microservices, spaghetti?)
- Dependency map (what depends on what)
- Clean Architecture compliance score (0-100)
- External integrations and their security posture
- Technology stack inventory

## 2. Security Assessment (CRITICAL — do this first)
- Hardcoded secrets scan (credentials, API keys, tokens in code/config)
- OWASP Top 10 vulnerability check
- Authentication mechanism review (how robust? what type?)
- Authorization model review (exists? enforced? bypassable?)
- Input validation coverage (which inputs are unvalidated?)
- Encryption status (data at rest, in transit)
- Dependency vulnerabilities (known CVEs)
- Error handling (do errors leak internals?)

## 3. Data Assessment
- Database schema analysis (normalization, indexing, constraints)
- PII identification (what personal data exists and where)
- Data classification (public/internal/confidential/restricted per field)
- Backup and retention status
- Encryption at rest status per table/field

## 4. Code Quality Assessment
- Test coverage (% and which layers)
- Code duplication
- Function complexity (cyclomatic complexity)
- Dependency direction violations (inner layers importing outer)
- Dead code percentage
- Documentation coverage

## 5. Operations Assessment
- CI/CD pipeline exists? What stages?
- Monitoring/logging in place?
- Deployment process (manual? automated?)
- Incident response procedures exist?
- Disaster recovery plan exists?

## Output Format
For each finding:
{
  "id": "FINDING-NNN",
  "area": "security | architecture | data | quality | operations",
  "severity": "critical | high | medium | low",
  "finding": "description",
  "current_state": "what exists now",
  "target_state": "what it should be per framework",
  "remediation_wave": "0 | 1 | 2 | 3 | 4 | 5",
  "effort_estimate": "hours | days | weeks",
  "risk_if_deferred": "what happens if we don't fix this"
}
```

### 2.3 Assessment Scoring Matrix

After the assessment, score the app on each dimension:

| Dimension | Score 0 (Non-existent) | Score 1 (Minimal) | Score 2 (Partial) | Score 3 (Adequate) | Score 4 (Compliant) | Score 5 (Exemplary) |
|---|---|---|---|---|---|---|
| **Security** | Hardcoded secrets, no auth | Basic auth, no encryption | Auth exists, some encryption | OWASP Top 10 addressed | Full threat model, ZSP | Continuous security testing |
| **Architecture** | Spaghetti, no layers | Some separation | Layers exist but leak | Clean Architecture mostly | Full Clean Architecture | DDD + event-driven |
| **Data** | No schema design, raw SQL | Basic schema, no classification | Classification exists | Encrypted PII, audit trail | Full DDD domain model | CQRS/Event sourcing |
| **Auth/IAM** | Plaintext passwords | Hashed passwords, sessions | OAuth/JWT basic | RBAC, MFA available | ABAC, ZSP, federation | Continuous auth monitoring |
| **Testing** | Zero tests | Some unit tests | Unit + some integration | Pyramid coverage targets | Security tests included | Mutation testing, chaos |
| **CI/CD** | Manual deployment | Basic CI (build + test) | CI + some security scans | Full pipeline with gates | Signed artifacts, SBOM | Canary + auto-rollback |
| **Observability** | Console.log | Basic logging | Structured logs + metrics | Three pillars implemented | Security monitoring | Anomaly detection + AI |
| **Documentation** | README only (maybe) | Setup instructions | API docs exist | Runbooks + ADRs | Full documentation suite | Living docs, auto-sync |
| **Compliance** | No awareness | Knows regulations apply | Some controls in place | Compliance matrix exists | Audit-ready | Continuous compliance |

**Total Score: ___/45**

| Range | Maturity Level | Transformation Approach |
|---|---|---|
| 0-9 | Level 0: Chaotic | Start from Wave 0. Expect 6+ months. |
| 10-18 | Level 1: Ad-hoc | Likely start from Wave 0 or 1. 4-6 months. |
| 19-27 | Level 2: Developing | May skip Wave 0. Start from Wave 1 or 2. 3-4 months. |
| 28-36 | Level 3: Defined | Selective waves. Focus on gaps. 1-3 months. |
| 37-45 | Level 4: Optimized | Fine-tuning only. Continuous improvement. |

---

## 3. Maturity Model — Where Are You Now?

### Typical Non-Standard App Patterns

Most apps built without standards share these characteristics. Check which apply:

```
□ Business logic mixed with route handlers / controllers
□ SQL queries built with string concatenation
□ Passwords stored as MD5/SHA1 or plaintext
□ Secrets hardcoded in source code or .env committed to repo
□ No input validation or only client-side validation
□ No authorization checks (or easily bypassable)
□ Single database user with full permissions for the app
□ No tests or only manual testing
□ Console.log for "logging"
□ Manual deployment via SSH/FTP
□ No error handling (or generic try/catch that swallows errors)
□ Frontend directly queries database
□ No HTTPS in production
□ Dependencies never updated
□ No documentation
□ God objects / God functions (1000+ line files)
□ No environment separation (dev = prod)
□ Secrets in localStorage / tokens in URL parameters
□ No audit trail for sensitive operations
□ Framework-specific code everywhere (no abstraction)
```

**Count your checkmarks:**
- 15-20: Level 0 — This app is a security incident waiting to happen. Start Wave 0 immediately.
- 10-14: Level 1 — Significant work needed. Wave 0 likely required.
- 5-9: Level 2 — Foundation exists but gaps are dangerous. Selective waves.
- 1-4: Level 3 — Mostly there. Targeted fixes.
- 0: Congratulations, you probably don't need this document.

---

## 4. Transformation Roadmap — 6 Waves

### Overview

```
Wave 0: 🚨 Emergency Security Hardening        [1-2 weeks]
  ↓     Stop the bleeding. Fix critical vulns NOW.
Wave 1: 👁️ Observability & Documentation        [1-2 weeks]
  ↓     See what's happening. Document what exists.
Wave 2: 🏗️ Architecture Boundary Extraction      [2-4 weeks]
  ↓     Separate layers. Introduce Clean Architecture.
Wave 3: 🗄️ Domain & Data Restructuring           [2-4 weeks]
  ↓     Extract domain model. Secure the data layer.
Wave 4: 🔐 Security Architecture Implementation  [2-3 weeks]
  ↓     Proper IAM, encryption, threat model.
Wave 5: ✅ Quality & Automation                   [2-3 weeks]
        Full test suite, CI/CD pipeline, security gates.
```

### Wave Dependencies

```
Wave 0 ────► Wave 1 ────► Wave 2 ────► Wave 3
                                  ↓         ↓
                              Wave 4 ◄──────┘
                                  ↓
                              Wave 5
```

Wave 0 and 1 are sequential. Waves 2-3 can partially overlap. Wave 4 needs output from both 2 and 3. Wave 5 wraps everything.

### Decision: Which Waves Do I Need?

```
Assessment Score 0-9:   All waves (0 → 1 → 2 → 3 → 4 → 5)
Assessment Score 10-18: Waves 0 → 1 → 2 → 3 → 4 → 5 (0 might be lighter)
Assessment Score 19-27: Waves 1 → 2 → 3 → 4 → 5 (skip 0 if no critical vulns)
Assessment Score 28-36: Cherry-pick from Waves 2-5 based on gaps
Assessment Score 37-45: Continuous improvement, no transformation needed
```

---

## 5. Wave 0: Emergency Security Hardening

**Duration:** 1-2 weeks
**Priority:** CRITICAL — Do this before anything else
**Agents Involved:** 08-Security Architect, 09-IAM, 10-Secrets & Crypto, 20-SAST
**Goal:** Eliminate critical vulnerabilities that could lead to immediate breach

### 5.1 Actions (in priority order)

#### P0: Do TODAY (hours)

| # | Action | Agent | How to Detect | How to Fix |
|---|--------|-------|--------------|------------|
| 1 | Remove hardcoded secrets | 10-Secrets | `grep -r "password\|secret\|api_key\|token" --include="*.{js,ts,py,env,json,yaml}"` | Move to vault/env injection. Rotate ALL exposed secrets immediately. |
| 2 | Fix SQL injection | 20-SAST | Find string concatenation in queries: `query("SELECT * FROM " + table)` | Replace with parameterized queries. Every single one. |
| 3 | Fix plaintext passwords | 09-IAM | Check user table: `SELECT password FROM users LIMIT 1` — if readable, it's plaintext or reversible | Implement Argon2id hashing. Force password reset for all users. |
| 4 | Enable HTTPS | 07-Infra | Check if HTTP is served on production | Add TLS certificate (Let's Encrypt). Redirect all HTTP → HTTPS. |
| 5 | Remove .env from repo | 10-Secrets | `git log --all -- '*.env'` | Add to .gitignore. Use `git filter-branch` or BFG to purge history. Rotate all secrets in .env. |

#### P1: Do THIS WEEK (days)

| # | Action | Agent | Details |
|---|--------|-------|---------|
| 6 | Add input validation on auth endpoints | 06-Integration | Validate email format, password length. Rate limit login to 5/min per IP. |
| 7 | Fix error messages | 19-Code Review | Replace stack traces with generic errors. Never expose DB structure. |
| 8 | Add CSRF protection | 08-Security | Add CSRF tokens to all state-changing forms/endpoints. |
| 9 | Set security headers | 07-Infra | CSP, HSTS, X-Frame-Options, X-Content-Type-Options. |
| 10 | Update critical dependencies | 20-SAST | Run `npm audit` / `pip audit`. Fix any CVSS ≥ 7.0. |

#### P2: Do THIS SPRINT (1-2 weeks)

| # | Action | Agent | Details |
|---|--------|-------|---------|
| 11 | Implement proper session management | 09-IAM | HttpOnly cookies, secure flag, SameSite, idle timeout. |
| 12 | Add basic authorization checks | 09-IAM | At minimum: is user authenticated? Is user accessing their own data? |
| 13 | Encrypt sensitive data at rest | 10-Secrets | Identify PII fields. Encrypt with AES-256-GCM. |
| 14 | Add audit logging for auth events | 22-Observability | Log: login, logout, failed attempts, password changes. |
| 15 | Disable debug mode in production | 07-Infra | Remove DEBUG=true, verbose error output, development configs. |

### 5.2 Wave 0 Exit Criteria

```
□ Zero hardcoded secrets in codebase
□ Zero SQL injection vectors
□ Passwords hashed with Argon2id/bcrypt
□ HTTPS enforced
□ .env not in repository (and history cleaned)
□ Auth endpoints rate-limited
□ Error messages don't leak internals
□ CSRF protection enabled
□ Security headers set
□ No CVSS ≥ 9.0 dependency vulnerabilities
□ Basic authorization on all endpoints
□ Audit log for authentication events
```

### 5.3 Wave 0 Agent Prompt

```
You are performing Emergency Security Hardening (Wave 0) on an existing application.
This is the HIGHEST PRIORITY transformation wave. You must find and fix critical
security vulnerabilities that could lead to immediate breach.

Analyze the provided codebase and:

1. SCAN for hardcoded secrets (passwords, API keys, tokens, connection strings)
   in ALL files including config, docker, CI/CD, and documentation files.

2. SCAN for injection vulnerabilities (SQL, NoSQL, command, XSS) by finding:
   - String concatenation in database queries
   - Unescaped user input in HTML templates
   - User input passed to exec/eval/system calls

3. CHECK authentication security:
   - How are passwords stored? (plaintext, MD5, SHA1 = CRITICAL)
   - Session management (tokens in localStorage = HIGH)
   - Missing rate limiting on auth endpoints

4. CHECK authorization:
   - Are there endpoints with no auth checks?
   - Can user A access user B's data? (IDOR)
   - Are admin functions protected?

5. CHECK infrastructure:
   - HTTPS enabled?
   - Security headers present?
   - Debug mode disabled in production?
   - Dependencies with known CVEs?

For each finding, output:
{
  "id": "W0-NNN",
  "severity": "critical | high",
  "category": "secrets | injection | auth | authz | infra | crypto",
  "file": "path/to/file:line",
  "finding": "what's wrong",
  "exploit_scenario": "how an attacker would use this",
  "fix": "exact code change or configuration",
  "effort": "minutes | hours | days"
}

Sort findings by severity (critical first) then by effort (quick wins first).
```

---

## 6. Wave 1: Observability & Documentation

**Duration:** 1-2 weeks
**Agents Involved:** 22-Observability, 23-Documentation, 19-Code Review, 17-Test Architect
**Goal:** Gain visibility into the system and document what exists before changing it

### 6.1 Why This Comes Before Architecture Changes

You cannot safely refactor what you cannot see. This wave establishes:
- **Characterization tests** — Tests that capture the current behavior (not desired behavior). If these fail during refactoring, you broke something.
- **Structured logging** — See what the app is actually doing in production.
- **As-Is documentation** — You can't plan a journey without knowing the starting point.
- **Error tracking** — Understand where the system is failing today.

### 6.2 Actions

#### Observability

| # | Action | Details |
|---|--------|---------|
| 1 | Replace console.log with structured logger | Use Winston/Pino (Node) or structlog (Python). JSON format. |
| 2 | Add request correlation IDs | Generate UUID per request, propagate through all logs. |
| 3 | Add basic metrics | Request count, duration, error rate per endpoint. |
| 4 | Add error tracking | Sentry or similar. Capture unhandled exceptions with context. |
| 5 | Add health check endpoint | `/health` returns 200 with basic system status. |
| 6 | Create basic dashboard | Visualize: request rate, error rate, response times. |

#### Characterization Tests

| # | Action | Details |
|---|--------|---------|
| 7 | Identify critical paths | Top 10 most used features/endpoints based on logs or business knowledge. |
| 8 | Write API characterization tests | For each critical endpoint: send real-world inputs, snapshot the response. Test CURRENT behavior, not desired behavior. |
| 9 | Write database state tests | Snapshot current schema. Test will fail if schema changes unexpectedly. |
| 10 | Set up test infrastructure | Test runner, test database, CI integration (even if basic). |

#### Documentation

| # | Action | Details |
|---|--------|---------|
| 11 | Document current architecture (As-Is) | Draw what actually exists: components, data flows, integrations. Ugly is fine. Accurate matters. |
| 12 | Inventory all endpoints | Method, path, auth required?, input, output. Even undocumented ones. |
| 13 | Inventory all data stores | Tables, schemas, what data lives where, who writes/reads. |
| 14 | Document known technical debt | Create a prioritized list. This becomes the transformation backlog. |
| 15 | Create ADR-001 | "Decision to transform this application following Multi-Agent Framework v1.0" |

### 6.3 Wave 1 Exit Criteria

```
□ Structured logging on all API endpoints
□ Request correlation IDs in all logs
□ Error tracking configured (Sentry or equivalent)
□ Health check endpoint responding
□ Characterization tests for top 10 critical paths
□ Test runner configured and passing in CI
□ As-Is architecture documented (diagram + description)
□ All endpoints inventoried
□ All data stores inventoried
□ Technical debt backlog created
□ ADR-001 written
```

### 6.4 Wave 1 Agent Prompt

```
You are performing Wave 1: Observability & Documentation on an existing application
that is being transformed to comply with the Multi-Agent Framework standards.

Wave 0 (Emergency Security) has been completed. Now we need to:
1. SEE what the system is doing (observability)
2. CAPTURE current behavior before changing it (characterization tests)
3. DOCUMENT what exists (as-is architecture)

## Your Tasks

### Observability
- Replace all console.log/print statements with a structured JSON logger
- Add middleware that: generates a request_id UUID, logs request start (method, path, user_id), logs request end (status, duration_ms), catches and logs unhandled errors
- Add a /health endpoint
- Configure error tracking (Sentry integration)

### Characterization Tests
- For each endpoint provided, write a test that:
  - Sends a realistic request
  - Captures the response (status, body structure, headers)
  - Asserts on the CURRENT behavior (even if wrong)
  - Documents any side effects (DB writes, emails sent, etc.)
- These tests are our safety net for refactoring

### Documentation
- Analyze the codebase structure and produce:
  - Component diagram (what modules/files/classes exist)
  - Data flow diagram (how data moves through the system)
  - Integration map (external APIs, databases, message queues)
  - Endpoint inventory table
  - Data store inventory table

Output all documentation in markdown format.
Prefix any assumptions with [ASSUMPTION].
Flag any areas where behavior is unclear with [NEEDS INVESTIGATION].
```

---

## 7. Wave 2: Architecture Boundary Extraction

**Duration:** 2-4 weeks
**Agents Involved:** 04-Enterprise Architect, 12-Domain Logic, 13-App Services, 06-Integration
**Goal:** Introduce Clean Architecture boundaries without rewriting business logic

### 7.1 The Extraction Strategy

This is the most delicate wave. You're separating layers in a running system.

```
BEFORE (typical non-standard app):
┌─────────────────────────────────┐
│ route('/users', (req, res) => { │
│   const query = "SELECT...";    │  ← Everything in one place:
│   db.query(query).then(data =>  │     routing, validation, business
│     if (data.age > 18) {        │     logic, data access, response
│       res.json(data);           │     formatting
│     }                           │
│   });                           │
│ });                             │
└─────────────────────────────────┘

AFTER (Clean Architecture boundaries):
┌─────────────────────────┐
│ Route Handler            │  ← Frameworks & Drivers
│   validates input        │
│   calls service          │
│   formats response       │
├─────────────────────────┤
│ Application Service      │  ← Use Cases
│   orchestrates           │
│   handles authorization  │
│   manages transactions   │
├─────────────────────────┤
│ Domain Entity            │  ← Entities (pure logic)
│   age validation         │
│   business rules         │
│   no external deps       │
├─────────────────────────┤
│ Repository               │  ← Interface Adapters
│   actual DB queries      │
│   parameterized          │
│   maps to domain         │
└─────────────────────────┘
```

### 7.2 Step-by-Step Extraction Process

#### Step 1: Create the directory structure

```
src/
├── domain/                    ← NEW: Pure business logic
│   ├── entities/
│   ├── value-objects/
│   ├── events/
│   └── errors/
├── application/               ← NEW: Use cases & orchestration
│   ├── services/
│   ├── ports/                 ← Interfaces that adapters implement
│   └── dtos/
├── infrastructure/            ← NEW: External world adapters
│   ├── repositories/
│   ├── clients/
│   └── config/
├── interfaces/                ← NEW: HTTP/CLI/GraphQL entry points
│   ├── http/
│   │   ├── routes/
│   │   ├── middleware/
│   │   └── validators/
│   └── cli/
└── legacy/                    ← EXISTING: Move old code here first
    └── (original files)
```

#### Step 2: Extract domain entities (one at a time)

For each core business concept:
1. Identify the business rules scattered across the codebase
2. Create a pure entity class with those rules
3. Write unit tests for the entity (no mocks needed — it's pure logic)
4. The entity has ZERO imports from frameworks/databases

#### Step 3: Create port interfaces

Define what the domain NEEDS from the outside world:
```
// src/application/ports/user-repository.port.ts
interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

#### Step 4: Extract repository implementations

Move database queries into repository classes that implement the ports:
1. Copy the existing query logic into a repository class
2. Make it implement the port interface
3. Replace raw SQL string concatenation with parameterized queries
4. Add domain-to-database mapping

#### Step 5: Create application services

Extract orchestration logic:
1. Create a service that receives the repository port (dependency injection)
2. Move the "workflow" from the route handler into the service
3. Add authorization checks
4. Add audit logging

#### Step 6: Slim down route handlers

Route handlers should ONLY:
1. Extract and validate input
2. Call the application service
3. Format the response
4. Handle HTTP-specific errors

#### Step 7: Verify with characterization tests

After each extraction, run the characterization tests from Wave 1. If they pass, the behavior is preserved.

### 7.3 Migration Order (by risk)

**ALWAYS migrate the most critical/dangerous code first:**

| Priority | What to Extract First | Why |
|---|---|---|
| 1 | Authentication endpoints | Highest security risk |
| 2 | Authorization logic | Prevents privilege escalation |
| 3 | Payment/financial operations | Highest business risk |
| 4 | User data management (CRUD) | PII handling, compliance |
| 5 | Core business operations | Revenue-generating features |
| 6 | Reporting/read operations | Lower risk, good for practice |
| 7 | Admin/internal tools | Lowest priority but still needed |

### 7.4 Wave 2 Exit Criteria

```
□ Directory structure follows Clean Architecture layout
□ At least core entities extracted to domain layer with zero external deps
□ Port interfaces defined for all repository access
□ Repository implementations use parameterized queries
□ Route handlers are thin (validate, delegate, respond)
□ Application services handle orchestration and authorization
□ Dependency direction validated: domain ← application ← infrastructure
□ All characterization tests still passing
□ New unit tests for extracted domain entities (≥80% coverage)
□ ADRs written for key extraction decisions
```

### 7.5 Wave 2 Agent Prompt

```
You are performing Wave 2: Architecture Boundary Extraction on an existing application.

The app currently has business logic, data access, and HTTP handling mixed together.
Your goal is to introduce Clean Architecture boundaries WITHOUT rewriting business logic.

## Context
- Wave 0 (Security) and Wave 1 (Observability) are complete
- Characterization tests exist for critical paths
- As-Is architecture is documented

## Clean Architecture Rules (ABSOLUTE)
- Domain layer: ZERO external dependencies. Pure business logic.
- Application layer: Orchestrates domain. Depends only on domain + port interfaces.
- Infrastructure layer: Implements ports. Contains DB, HTTP, external service code.
- Interfaces layer: HTTP routes, CLI commands. Thin — validate, delegate, respond.
- Dependencies ALWAYS point inward: Interfaces → Infrastructure → Application → Domain

## Your Process
For each component/endpoint being extracted:

1. IDENTIFY the business rules buried in the current code
2. CREATE a domain entity with those rules (pure class, no imports)
3. WRITE unit tests for the entity
4. DEFINE the port interface the domain needs
5. CREATE a repository implementing the port (move existing queries)
6. CREATE an application service (move orchestration logic)
7. SLIM the route handler to: validate → call service → respond
8. RUN characterization tests to verify behavior is preserved

## Output for Each Extraction
{
  "component": "User Management",
  "entities_extracted": ["User", "Email (VO)", "Password (VO)"],
  "ports_defined": ["UserRepository", "PasswordHasher"],
  "services_created": ["UserService"],
  "routes_refactored": ["POST /users", "GET /users/:id", "PUT /users/:id"],
  "tests_added": 15,
  "characterization_tests_status": "all passing",
  "dependency_violations": "none"
}

## Critical Rules
- NEVER change business behavior during extraction
- If you find a bug, DOCUMENT it but don't fix it yet (fix in a separate PR)
- Every extraction must be atomic — the app works at every step
- Run characterization tests after EVERY change
```

---

## 8. Wave 3: Domain & Data Restructuring

**Duration:** 2-4 weeks
**Agents Involved:** 05-Data Architect, 03-Compliance, 10-Secrets & Crypto, 12-Domain Logic
**Goal:** Restructure the data layer for security, compliance, and proper domain modeling

### 8.1 Actions

#### Data Classification & Encryption

| # | Action | Details |
|---|--------|---------|
| 1 | Classify every database field | Apply schema from Compliance Agent: public/internal/confidential/restricted |
| 2 | Implement field-level encryption | Encrypt all confidential/restricted fields with AES-256-GCM |
| 3 | Separate PII tables | Move PII into dedicated tables with stricter access controls |
| 4 | Add audit columns | created_at, updated_at, created_by, updated_by on all tables |
| 5 | Switch to UUIDs | Replace sequential IDs with UUIDs (prevents enumeration) |
| 6 | Implement soft deletes | Add deleted_at column. Never hard-delete unless compliance requires. |

#### Domain Model Enrichment

| # | Action | Details |
|---|--------|---------|
| 7 | Refine entity validation | Move all validation into entities. Add value objects for: Email, Password, PhoneNumber, etc. |
| 8 | Define aggregate boundaries | Which entities change together? Those are aggregates. |
| 9 | Add domain events | Every significant state change emits an event: UserCreated, OrderPlaced, etc. |
| 10 | Implement invariants | Business rules that must ALWAYS be true, enforced in entity methods. |

#### Database Schema Migration

| # | Action | Details |
|---|--------|---------|
| 11 | Create migration scripts | Versioned, reversible database migrations for all schema changes. |
| 12 | Add proper indexes | Foreign keys, frequently queried fields, unique constraints. |
| 13 | Add constraints | NOT NULL, CHECK, UNIQUE at the database level (defense in depth). |
| 14 | Implement data retention policies | Automate deletion/archival per compliance requirements. |

### 8.2 Wave 3 Exit Criteria

```
□ All database fields classified (public/internal/confidential/restricted)
□ PII fields encrypted at rest
□ PII in separate tables where feasible
□ Audit columns on all tables
□ UUIDs for primary keys (or migration planned)
□ Soft deletes implemented
□ Domain entities enforce their own invariants
□ Value objects for all structured data (Email, Money, etc.)
□ Domain events emitted for significant state changes
□ Database migrations versioned and reversible
□ Proper indexes and constraints
□ Data retention policies implemented
□ Characterization tests still passing
```

---

## 9. Wave 4: Security Architecture Implementation

**Duration:** 2-3 weeks
**Agents Involved:** 08-Security Architect, 09-IAM, 10-Secrets, 11-Threat Intel
**Goal:** Implement proper security architecture on top of the clean boundaries from Wave 2-3

### 9.1 Actions

#### Authentication Overhaul

| # | Action | Details |
|---|--------|---------|
| 1 | Implement OAuth 2.1 / OIDC | Replace custom auth with standard flows. Authorization Code + PKCE. |
| 2 | Token strategy | Access tokens (15 min, in-memory). Refresh tokens (7 days, httpOnly cookie, rotating). |
| 3 | MFA implementation | TOTP / WebAuthn for admin and sensitive operations. |
| 4 | Password policy | 12+ chars, HaveIBeenPwned check, Argon2id hashing, progressive lockout. |
| 5 | Session management | Absolute timeout 24h, idle timeout 30min, secure cookie attributes. |

#### Authorization Implementation

| # | Action | Details |
|---|--------|---------|
| 6 | Implement RBAC | Define roles, permissions, role-permission mapping. |
| 7 | Resource-based authorization | User can only access their own resources (ABAC overlay). |
| 8 | Authorization middleware | Check permissions BEFORE business logic executes. |
| 9 | Zero Standing Privileges | For admin operations: JIT access with approval and time limits. |

#### Secrets Management

| # | Action | Details |
|---|--------|---------|
| 10 | Deploy secrets vault | HashiCorp Vault / AWS Secrets Manager / Azure Key Vault. |
| 11 | Migrate all secrets to vault | Remove from .env, config files, CI/CD variables. |
| 12 | Implement automatic rotation | Database passwords (90 days), API keys (180 days). |
| 13 | Add secret access auditing | Log who accessed which secret, when. |

#### Threat Model

| # | Action | Details |
|---|--------|---------|
| 14 | STRIDE analysis | Model threats for every component using the extracted architecture. |
| 15 | Abuse case library | Create abuse cases for every feature. |
| 16 | Penetration test plan | Based on threat model and abuse cases. |
| 17 | Security Controls Matrix | Map every threat to a control to a test. |

### 9.2 Wave 4 Exit Criteria

```
□ OAuth 2.1 / OIDC authentication implemented
□ JWT tokens with proper security (short TTL, rotation, httpOnly)
□ MFA available for admin and sensitive operations
□ RBAC + resource-based authorization on all endpoints
□ Authorization checked before business logic
□ All secrets in vault (zero in code/config)
□ Automatic secret rotation configured
□ STRIDE threat model documented
□ Abuse cases for all features
□ Security Controls Matrix complete
□ Penetration test plan ready
```

---

## 10. Wave 5: Quality & Automation

**Duration:** 2-3 weeks
**Agents Involved:** 17-Test Architect, 18-Test Impl, 21-CI/CD, 22-Observability, 23-Documentation
**Goal:** Full test coverage, automated pipeline with security gates, production-ready operations

### 10.1 Actions

#### Testing

| # | Action | Details |
|---|--------|---------|
| 1 | Complete unit test suite | Domain layer: 90%+ coverage |
| 2 | Integration tests | Repository + API endpoint tests with test containers |
| 3 | Security tests | One test per abuse case. OWASP Top 10 regression tests. |
| 4 | E2E tests | Top 10 user journeys automated |
| 5 | Contract tests | API contract verification against OpenAPI spec |

#### CI/CD Pipeline

| # | Action | Details |
|---|--------|---------|
| 6 | Build stage | Install from lockfile, compile, type-check |
| 7 | Test stage | Unit (parallel), integration, contract |
| 8 | Security gate | SAST + SCA + secrets scan + container scan |
| 9 | Deploy to staging | Automated, with DAST + E2E |
| 10 | Deploy to production | Manual approval, blue-green/canary, health checks |
| 11 | Rollback automation | Auto-rollback on health check failure |

#### Observability Enhancement

| # | Action | Details |
|---|--------|---------|
| 12 | Distributed tracing | OpenTelemetry integration |
| 13 | Security monitoring | Auth failure alerting, anomaly detection |
| 14 | Audit log immutability | Append-only storage for compliance |
| 15 | Dashboards | Operational + security + business metrics |
| 16 | Runbooks | One per alert, tested quarterly |

#### Documentation Completion

| # | Action | Details |
|---|--------|---------|
| 17 | API documentation | OpenAPI spec, generated from code |
| 18 | Architecture documentation | C4 diagrams, ADRs, data model |
| 19 | Security documentation | Policies, incident response, vulnerability disclosure |
| 20 | Operational runbooks | Deployment, rollback, incident response, disaster recovery |

### 10.2 Wave 5 Exit Criteria (= Transformation Complete)

```
□ Domain layer test coverage ≥ 90%
□ Application layer test coverage ≥ 80%
□ All abuse cases have security tests
□ E2E tests for top 10 user journeys
□ CI/CD pipeline with all security gates
□ SAST/SCA integrated and blocking on critical findings
□ Blue-green or canary deployment configured
□ Auto-rollback on health check failure
□ Distributed tracing operational
□ Security monitoring with alerting
□ Audit logs immutable and compliant
□ All runbooks written and tested
□ API documentation complete
□ Architecture documentation complete (To-Be state)
□ ADRs for all transformation decisions
```

---

## 11. Agent Roles in Transformation

### Mapping: Framework Agents → Transformation Waves

| Agent | Wave 0 | Wave 1 | Wave 2 | Wave 3 | Wave 4 | Wave 5 |
|-------|--------|--------|--------|--------|--------|--------|
| 01-Architecture Board | | | Review | Review | Review | Final |
| 02-Requirements | | | | | | |
| 03-Compliance | Assess | | | Classify | | Verify |
| 04-Enterprise Architect | | Doc As-Is | Design To-Be | | | |
| 05-Data Architect | | Inventory | | Restructure | | |
| 06-Integration Architect | Fix endpoints | | API design | | | Contract |
| 07-Infrastructure | Fix infra | | | | | Pipeline |
| 08-Security Architect | **LEAD** | | Review | | **LEAD** | Verify |
| 09-IAM Agent | Fix auth | | | | **LEAD** | |
| 10-Secrets & Crypto | Fix secrets | | | Encrypt | **LEAD** | |
| 11-Threat Intel | Assess | | | | Model | Test |
| 12-Domain Logic | | | Extract | Enrich | | |
| 13-App Services | | | Extract | | AuthZ | |
| 14-Adapter Agent | | | Extract | Repos | | |
| 15-Frontend Architect | | | | | Secure | |
| 16-UI Builder | | | | | Tokens | |
| 17-Test Architect | | Strategy | | | | **LEAD** |
| 18-Test Implementation | | Char. tests | Unit tests | | Security | Complete |
| 19-Code Review | Audit | | Validate | Validate | Validate | Final |
| 20-SAST | **SCAN** | | Rescan | Rescan | Rescan | Gate |
| 21-CI/CD | | Basic CI | | | | **LEAD** |
| 22-Observability | | **LEAD** | | | Monitor | Enhance |
| 23-Documentation | | **LEAD** | ADRs | ADRs | Security | Complete |
| 24-Orchestrator | Coordinate | Coordinate | Coordinate | Coordinate | Coordinate | Deliver |

---

## 12. Anti-Patterns to Detect

### Architecture Anti-Patterns

| Anti-Pattern | What It Looks Like | Target State | Wave |
|---|---|---|---|
| **God Object** | One class with 50+ methods, 1000+ lines | Split into domain entities with single responsibility | 2 |
| **Spaghetti Routing** | Business logic in route handlers | Thin routes → services → domain | 2 |
| **Anemic Domain Model** | Entities are just data bags, logic in services | Rich entities with behavior and invariants | 3 |
| **Database-Driven Design** | ORM models ARE the domain model | Separate domain entities from persistence | 2-3 |
| **Framework Coupling** | Business logic imports Express/Django/Spring | Domain layer has zero framework imports | 2 |
| **Circular Dependencies** | Module A imports B imports C imports A | Dependency inversion via ports/interfaces | 2 |

### Security Anti-Patterns

| Anti-Pattern | What It Looks Like | Target State | Wave |
|---|---|---|---|
| **Trust the Client** | No server-side validation, only frontend checks | Validate at every trust boundary | 0 |
| **Security by Obscurity** | No auth on "hidden" admin endpoints | Explicit authentication + authorization everywhere | 0-4 |
| **Shared Credentials** | All services use same DB password | Per-service credentials from vault, rotated | 4 |
| **Log Everything** | Passwords and tokens in log files | Structured logging with PII filtering | 1 |
| **Catch and Ignore** | Empty catch blocks swallow errors | Proper error handling with monitoring | 1 |
| **Implicit Trust** | Backend trusts other internal services | Zero Trust: verify every request | 4 |

### Data Anti-Patterns

| Anti-Pattern | What It Looks Like | Target State | Wave |
|---|---|---|---|
| **PII Everywhere** | Name, email, phone in 15 different tables | PII in dedicated tables, encrypted | 3 |
| **No Audit Trail** | No created_by, updated_at fields | Full audit columns + audit event log | 3 |
| **Sequential IDs** | User IDs: 1, 2, 3... (enumerable) | UUIDs for all primary keys | 3 |
| **Hard Delete** | `DELETE FROM users WHERE id = ?` | Soft delete (deleted_at) or crypto-shred | 3 |
| **Shared Database** | Multiple apps read/write same tables | API boundaries between services | 2 |

---

## 13. Decision Trees

### Should I Refactor or Rewrite This Component?

```
Is the component < 200 lines?
├── YES → Refactor in place (extract to Clean Architecture)
└── NO
    ├── Does it have characterization tests?
    │   ├── YES → Refactor incrementally (safe to change)
    │   └── NO
    │       ├── Can you add tests in < 1 day?
    │       │   ├── YES → Add tests, then refactor
    │       │   └── NO → Write a new version alongside (Strangler Fig)
    └── Is it a security-critical component?
        ├── YES → Rewrite with security agent review (high risk of hidden vulns)
        └── NO → Refactor incrementally
```

### Should This Logic Be In Domain or Application Layer?

```
Does this logic involve business rules?
├── YES
│   ├── Does it involve a single entity? → Domain Entity method
│   ├── Does it involve multiple entities? → Domain Service
│   └── Does it require external data? → Application Service (calls port)
└── NO
    ├── Is it orchestration (call A then B)? → Application Service
    ├── Is it authorization? → Application Service (cross-cutting)
    ├── Is it validation of input format? → Interface layer (validator)
    └── Is it database/API specific? → Infrastructure (adapter)
```

### Which Wave Should Fix This Issue?

```
Is it a security vulnerability?
├── CRITICAL/HIGH → Wave 0 (NOW)
├── MEDIUM → Wave 4
└── LOW → Wave 5

Is it an architecture issue?
├── Causes bugs/instability → Wave 2
├── Makes code unmaintainable → Wave 2-3
└── Cosmetic/style → Wave 5

Is it a data issue?
├── PII exposure → Wave 0 (if critical) or Wave 3
├── Missing encryption → Wave 3
├── Schema improvement → Wave 3
└── Performance optimization → Wave 5

Is it an operational issue?
├── No monitoring → Wave 1
├── Manual deployment → Wave 5
├── No documentation → Wave 1
└── No tests → Wave 1 (characterization) + Wave 5 (full)
```

---

## 14. Transformation Tracking

### Progress Dashboard Template

```
APPLICATION: [Name]
ASSESSMENT DATE: [Date]
INITIAL SCORE: [X/45]
CURRENT WAVE: [0-5]
TARGET COMPLETION: [Date]

WAVE STATUS:
  Wave 0 (Security):      [🔴 Not Started | 🟡 In Progress | 🟢 Complete]
  Wave 1 (Observability):  [🔴 | 🟡 | 🟢]
  Wave 2 (Architecture):   [🔴 | 🟡 | 🟢]
  Wave 3 (Data):           [🔴 | 🟡 | 🟢]
  Wave 4 (Security Arch):  [🔴 | 🟡 | 🟢]
  Wave 5 (Quality):        [🔴 | 🟡 | 🟢]

SECURITY POSTURE:
  Critical findings:  [count] (target: 0)
  High findings:      [count] (target: 0)
  Medium findings:    [count]
  Low findings:       [count]

ARCHITECTURE COMPLIANCE:
  Clean Architecture score:  [0-100]%
  Dependency violations:     [count]
  Test coverage (domain):    [X]%
  Test coverage (overall):   [X]%

COMPLIANCE:
  Regulations applicable:    [list]
  Controls implemented:      [X/Y]
  Last audit:                [date]
```

### Per-Wave Completion Checklist

Use the exit criteria from each wave section as your checklist. Track completion percentage:

```
Wave [N] Progress: [completed items] / [total items] = [X]%
Blocked items: [list with reasons]
Deferred items: [list with justification and target wave]
```

---

## 15. Prompts for Each Wave

### Master Transformation Prompt

Use this to start a transformation session with the full context:

```
You are the Transformation Orchestrator, coordinating the transformation of an
existing application to comply with the Multi-Agent Framework standards
(TOGAF + Clean Architecture + Security-by-Design).

## Transformation Context
- Application: [NAME]
- Current State: [paste assessment results or describe]
- Current Wave: [0-5]
- Previous Waves Completed: [list]

## Framework Reference
The target architecture follows Clean Architecture with these layers:
1. Domain (innermost): Pure business logic, zero external dependencies
2. Application: Use cases, orchestration, DTOs, port interfaces
3. Infrastructure: Repository implementations, external clients, adapters
4. Interfaces: HTTP routes, CLI, validators (thin layer)

Dependencies ALWAYS point inward: Interfaces → Infrastructure → Application → Domain

## Security Principles
1. Defense in depth at every layer
2. Zero Trust: verify every request
3. Security Architect has VETO power
4. OWASP Top 10 must be addressed
5. All secrets in vault, all data classified, all PII encrypted

## Current Wave: [N] - [Name]
[Paste the relevant wave section from this document]

## Instructions
1. Analyze the provided code/architecture
2. Identify what needs to change for this wave
3. Propose changes in priority order
4. For each change:
   - Show the current code (what exists)
   - Show the target code (what it should be)
   - Explain the security/architecture improvement
   - Estimate effort
5. Verify changes don't break characterization tests
6. Document decisions as ADRs
```

---

## Appendix A: Transformation Effort Estimator

| Application Size | Lines of Code | Wave 0 | Wave 1 | Wave 2 | Wave 3 | Wave 4 | Wave 5 | Total |
|---|---|---|---|---|---|---|---|---|
| Small | < 5,000 | 2-3 days | 2-3 days | 1 week | 1 week | 1 week | 1 week | 5-6 weeks |
| Medium | 5,000-20,000 | 1 week | 1 week | 2-3 weeks | 2 weeks | 2 weeks | 2 weeks | 10-12 weeks |
| Large | 20,000-100,000 | 1-2 weeks | 1-2 weeks | 4-6 weeks | 3-4 weeks | 3 weeks | 3 weeks | 16-20 weeks |
| Very Large | > 100,000 | 2 weeks | 2 weeks | 8+ weeks | 4-6 weeks | 4 weeks | 4 weeks | 24-30 weeks |

These are estimates for a single developer with AI agent assistance. Multiply by 0.6-0.7 for each additional developer.

## Appendix B: Quick Command Reference

```bash
# Wave 0: Find hardcoded secrets
grep -rn "password\|secret\|api_key\|token\|private_key" --include="*.{js,ts,py,java,go,rb,php,env,json,yaml,yml,xml,conf,cfg}" .

# Wave 0: Find SQL injection
grep -rn "query.*+\|execute.*+\|raw.*+" --include="*.{js,ts,py,java}" .

# Wave 0: Check for .env in git history
git log --all --diff-filter=A -- '*.env' '.env*'

# Wave 1: Count test coverage
npx jest --coverage  # Node
pytest --cov=src     # Python

# Wave 2: Find dependency direction violations
# In domain/ files, there should be ZERO imports from infrastructure/ or interfaces/
grep -rn "import.*infrastructure\|import.*interfaces\|import.*adapters\|require.*infrastructure" src/domain/

# Wave 5: Run full security scan
npm audit                    # Node dependencies
pip audit                    # Python dependencies
npx eslint --ext .ts,.js .   # Static analysis
```

---

*Transformation Plan v1.0 — Companion to Multi-Agent Framework v1.0*
*Designed for incremental, security-first transformation of existing applications*
