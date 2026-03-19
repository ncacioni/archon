---
name: clean-architecture
description: Clean Architecture layer rules, dependency direction, domain zero-deps, ports/adapters pattern, DI composition root, SOLID principles. Use when implementing or reviewing backend systems.
---

# Clean Architecture

Dependencies always point **inward**: Adapters → Application → Domain. The domain layer has ZERO external dependencies.

```
┌─────────────────────────────────────────┐
│           Adapters (outermost)          │  ← Frameworks, DB, HTTP, UI
│  ┌───────────────────────────────────┐  │
│  │     Application Services          │  │  ← Use cases, orchestration
│  │  ┌─────────────────────────────┐  │  │
│  │  │     Domain (innermost)      │  │  │  ← Entities, Value Objects, Ports
│  │  └─────────────────────────────┘  │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

---

## Layer 1: Domain (Innermost)

**The absolute rule: ZERO external dependencies.** No imports from frameworks, ORMs, HTTP libraries, or databases. Only language primitives and other domain objects.

### Entities
Identity-based objects with lifecycle and invariants:
```javascript
class User {
  constructor({ id, email, name }) {
    this.#validateEmail(email);
    this.id = id;
    this.email = email;
    this.name = name;
  }
  changeEmail(newEmail) {
    this.#validateEmail(newEmail);
    const oldEmail = this.email;
    this.email = newEmail;
    return new UserEmailChanged({ userId: this.id, oldEmail, newEmail });
  }
}
```

### Value Objects
Immutable, equality by value:
```javascript
class Money {
  constructor(amount, currency) {
    if (amount < 0) throw new DomainError('Amount cannot be negative');
    this.amount = amount;
    this.currency = currency;
  }
  add(other) {
    if (this.currency !== other.currency) throw new DomainError('Currency mismatch');
    return new Money(this.amount + other.amount, this.currency);
  }
  equals(other) {
    return this.amount === other.amount && this.currency === other.currency;
  }
}
```

### Aggregates
Consistency boundaries. Access only through the root entity. Reference other aggregates by ID only. One aggregate per transaction.

### Domain Events
Immutable facts about things that happened — not commands. Example: `UserCreated`, `OrderShipped`.

### Ports (Interfaces)
Define what the domain needs from the outside world:
```javascript
// Port — defined in domain layer
interface UserRepository {
  findByEmail(email: string): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

### Domain Rules
- If importing from `node_modules` or `pip` → wrong layer
- Entity methods enforce their own invariants
- Domain errors must not leak implementation details
- 100% testable without mocks for external dependencies

---

## Layer 2: Application Services (Middle)

Thin orchestrators that coordinate use cases. Business logic lives in Domain, NOT here.

```javascript
class CreateUserUseCase {
  constructor({ userRepository, passwordHasher, eventPublisher }) {
    // These are INTERFACES (ports), not implementations
  }
  async execute({ email, name, password }) {
    const existing = await this.userRepository.findByEmail(email);
    if (existing) throw new BusinessError('EMAIL_TAKEN', 'Email already registered');
    const hashedPassword = await this.passwordHasher.hash(password);
    const user = User.create({ email, name, passwordHash: hashedPassword });
    await this.userRepository.save(user);
    await this.eventPublisher.publish(new UserCreated({ userId: user.id }));
    return user;
  }
}
```

### Application Service Rules
- Services are thin orchestrators — if writing business `if/else`, move it to domain
- Always check authorization BEFORE executing business logic
- DTOs are dumb data containers with no business logic
- Input DTOs validate format; domain validates business rules
- Output DTOs never expose passwords, internal IDs, or security metadata

### Patterns at This Layer
- **CQRS**: Separate read and write models when needed
- **Saga**: Manage distributed transactions (choreography or orchestration)
- **Outbox**: Reliable event publishing with DB transactions
- **Circuit Breaker**: Resilience for external service calls
- **Idempotency keys**: Safe retries

---

## Layer 3: Adapters (Outermost)

Concrete implementations connecting the domain to the real world. Implement the ports from Layer 1.

```javascript
class PostgresUserRepository implements UserRepository {
  constructor(pool, encryption) {
    this.pool = pool;
    this.encryption = encryption;
  }
  async findByEmail(email) {
    const result = await this.pool.query(
      'SELECT * FROM users WHERE email_hash = $1',
      [this.encryption.hash(email)]
    );
    return result.rows[0] ? this.#toDomain(result.rows[0]) : null;
  }
  async save(user) {
    await this.pool.query(
      'INSERT INTO users (id, email_encrypted, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO UPDATE SET email_encrypted = $2, name = $3',
      [user.id, this.encryption.encrypt(user.email), user.name]
    );
  }
}
```

### Adapter Security Rules
- ALWAYS parameterized queries — never string concatenation
- ALWAYS encrypt sensitive fields before storage
- ALWAYS use connection pooling with limits
- ALWAYS set timeouts on external connections (10s default)
- NEVER log sensitive data (passwords, tokens, PII)
- Secrets from vault or environment, never committed to repo

---

## Composition Root

Wire everything at the outermost layer — the ONLY place where concrete implementations are chosen:

```javascript
// composition-root.js
const pool = new Pool(config.database);
const encryption = new AESEncryption(config.encryptionKey);
const userRepo = new PostgresUserRepository(pool, encryption);
const passwordHasher = new BcryptHasher(12);
const eventPublisher = new EventEmitterPublisher();

const createUser = new CreateUserUseCase({
  userRepository: userRepo,
  passwordHasher,
  eventPublisher
});
```

---

## SOLID Principles

| Principle | Rule | Clean Architecture Context |
|-----------|------|---------------------------|
| **S** — Single Responsibility | One reason to change per class | Entities own invariants, use cases own orchestration, adapters own integration |
| **O** — Open/Closed | Extend behavior without modifying existing code | Add new adapters without changing domain; add use cases without changing entities |
| **L** — Liskov Substitution | Subtypes must be substitutable | Any repository implementation satisfies the port contract |
| **I** — Interface Segregation | Clients depend only on methods they use | Small, focused ports (ReadRepository vs WriteRepository) |
| **D** — Dependency Inversion | Depend on abstractions, not concretions | Domain defines ports; adapters implement them. Never the reverse. |

---

## Dependency Validation

```
VALID:   Adapter imports from Application, Application imports from Domain
INVALID: Domain imports from Application, Domain imports from Adapters, Application imports from Adapters
```

Detection method: Check imports in each layer. Inner layers must NEVER import from outer layers.
