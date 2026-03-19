---
name: tdd-patterns
description: Test pyramid, coverage targets per layer, TDD red-green-refactor workflow, test design techniques, security test patterns. Use when writing tests or reviewing test strategy.
---

# TDD & Testing Patterns

## Test Pyramid

| Level | Share | Scope | Speed |
|-------|-------|-------|-------|
| Unit | 70% | Domain logic, pure functions, value objects | < 10ms each |
| Integration | 20% | Repos with real DB, API endpoints, external service mocks | < 1s each |
| E2E | 10% | Top 10 critical user journeys | < 30s each |
| Security | Cross-cutting | At every level + dedicated OWASP tests | Varies |

## Coverage Targets

| Layer | Line | Branch | Mutation |
|-------|------|--------|----------|
| Domain | 90%+ | 85%+ | 70%+ |
| Application services | 80%+ | 75%+ | — |
| Adapters | 60%+ | 65%+ | — |
| Security (abuse cases) | 100% | — | — |

---

## TDD Workflow

1. **Red** — Write a failing test for the next behavior
2. **Green** — Write the minimum code to make it pass
3. **Refactor** — Clean up while keeping tests green
4. Repeat

---

## Testing by Layer

### Domain (Unit Tests)
Pure tests, no mocks needed (domain has zero external deps):
```javascript
describe('Money', () => {
  it('adds same currency', () => {
    const a = new Money(10, 'USD');
    const b = new Money(20, 'USD');
    expect(a.add(b).equals(new Money(30, 'USD'))).toBe(true);
  });
  it('rejects different currencies', () => {
    const a = new Money(10, 'USD');
    const b = new Money(20, 'EUR');
    expect(() => a.add(b)).toThrow('Currency mismatch');
  });
  it('rejects negative amounts', () => {
    expect(() => new Money(-5, 'USD')).toThrow('Amount cannot be negative');
  });
});
```

### Application (Unit + Mocked Ports)
```javascript
describe('CreateUserUseCase', () => {
  it('creates user when email is available', async () => {
    const repo = { findByEmail: () => null, save: vi.fn() };
    const hasher = { hash: (p) => `hashed_${p}` };
    const events = { publish: vi.fn() };
    const useCase = new CreateUserUseCase({ userRepository: repo, passwordHasher: hasher, eventPublisher: events });

    const user = await useCase.execute({ email: 'a@b.com', name: 'Test', password: 'pass' });
    expect(repo.save).toHaveBeenCalledWith(expect.objectContaining({ email: 'a@b.com' }));
    expect(events.publish).toHaveBeenCalled();
  });
  it('throws when email is taken', async () => {
    const repo = { findByEmail: () => ({ id: '1' }) };
    const useCase = new CreateUserUseCase({ userRepository: repo, passwordHasher: {}, eventPublisher: {} });
    await expect(useCase.execute({ email: 'taken@b.com', name: 'Test', password: 'pass' })).rejects.toThrow('EMAIL_TAKEN');
  });
});
```

### Adapters (Integration with Real Dependencies)
- Use testcontainers for real database instances
- Database seeding and cleanup per test (transaction rollback or truncate)
- Mock external services at the HTTP boundary only
- Test full middleware chain for API endpoints

---

## Test Design Techniques

| Technique | When to Use | Example |
|-----------|-------------|---------|
| **Equivalence Partitioning** | Reduce test cases for ranges | Age: <0, 0-17, 18-65, >65 |
| **Boundary Value Analysis** | Test edges of partitions | Age: -1, 0, 17, 18, 65, 66 |
| **State Transition Testing** | Entity lifecycles | Order: Draft → Submitted → Approved → Shipped |
| **Decision Table Testing** | Complex business rules | Discount rules based on membership + order total |

---

## Security Test Patterns

| Vulnerability | Test Approach |
|---------------|---------------|
| SQL Injection | Send `'; DROP TABLE--`, verify 400 (not SQL error leakage) |
| XSS | Send `<script>alert(1)</script>`, verify sanitized output |
| Broken AuthZ | User A tries to access User B's resources (horizontal escalation) |
| Rate Limiting | Burst requests, verify 429 after threshold |
| IDOR | Access resource by ID without ownership check |
| JWT Tampering | Expired, tampered, missing claims — verify rejection |
| CORS Bypass | Wildcard, null origin — verify blocked |

Every abuse case maps to a security test. Failing security test = P0 vulnerability.

---

## Code Review Checklist

**Architecture**
- Dependencies point inward only (Domain has zero external deps)
- Adapters implement domain ports (interface segregation)
- No business logic in controllers/adapters

**Code Quality**
- Functions < 20 lines, max 3 nesting levels
- No magic numbers — use named constants
- No swallowed exceptions, no `console.log` in production
- Cyclomatic complexity within threshold

**Security**
- No hardcoded secrets, tokens, or API keys
- No SQL string concatenation — parameterized queries only
- No `eval()` or equivalent dynamic execution
- Error messages don't leak internals
- Input validation: allowlisting over denylisting

**Supply Chain**
- Dependencies pinned (lockfile committed)
- No unnecessary new dependencies
- SBOM can be generated

---

## SAST Quality Gates

- Any CVSS ≥ 9.0 → **BLOCKED**
- Any hardcoded secret → **BLOCKED**
- Any injection vulnerability → **BLOCKED**
- Any dependency with CVE ≥ 7.0 → **BLOCKED**

---

## Test Data Management

- Factory pattern with faker for realistic synthetic data
- Seed profiles: minimal, full, demo
- NEVER use production data in tests — use anonymized/synthetic
- Test data respects all constraints and relationships
- Every acceptance criterion maps to at least one test
