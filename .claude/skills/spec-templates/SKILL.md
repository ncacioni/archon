---
name: spec-templates
description: Templates for OpenAPI 3.1, DB schemas (PostgreSQL DDL), domain models (Mermaid), AsyncAPI, state machines, UI wireframes, env config. Use when writing specifications or contracts.
---

# Specification Templates

> Specs define WHAT the system does. Implementation decides HOW. Never leak implementation details into specs.

---

## 1. API Specification (OpenAPI 3.1)

```yaml
openapi: 3.1.0
info:
  title: Service Name
  version: 1.0.0
servers:
  - url: /api/v1
paths:
  /users:
    get:
      summary: List users
      security: [bearerAuth: []]
      parameters:
        - $ref: '#/components/parameters/cursor'
        - $ref: '#/components/parameters/limit'
      responses:
        200:
          description: Paginated list
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/UserListResponse'
        401:
          $ref: '#/components/responses/Unauthorized'
components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  responses:
    Unauthorized:
      description: Missing or invalid authentication
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/Error'
  schemas:
    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code: { type: string }
            message: { type: string }
            details: { type: array, items: { type: string } }
            request_id: { type: string }
```

---

## 2. Database Schema (PostgreSQL DDL)

```sql
-- Mandatory columns for every table
CREATE TABLE users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       TEXT NOT NULL,
  name        TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active'
                CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by  UUID REFERENCES users(id),
  updated_by  UUID REFERENCES users(id),
  deleted_at  TIMESTAMPTZ  -- soft delete
);

-- Indexes
CREATE UNIQUE INDEX uq_users_email ON users(email) WHERE deleted_at IS NULL;
CREATE INDEX idx_users_status ON users(status) WHERE deleted_at IS NULL;
```

### Naming Conventions
- Tables: `snake_case`, plural (`users`, `order_lines`)
- Columns: `snake_case` (`created_at`, `user_id`)
- Indexes: `idx_{table}_{columns}`, Unique: `uq_{table}_{columns}`
- Constraints: `chk_{table}_{rule}`, `fk_{table}_{ref}`

### Schema Rules
- UUIDs for all primary keys (never sequential — information leakage risk)
- Soft delete by default (`deleted_at` column)
- 3NF minimum with strategic denormalization for proven performance needs
- Never store passwords in plaintext (bcrypt/argon2 hash)
- Index all foreign keys and frequently filtered columns

---

## 3. Domain Model (Mermaid Class Diagram)

```mermaid
classDiagram
    class User {
        +UUID id
        +Email email
        +String name
        +changeEmail(Email) UserEmailChanged
        +deactivate() UserDeactivated
    }
    class Email {
        +String value
        +validate()
        +equals(Email) bool
    }
    class Order {
        +UUID id
        +UUID userId
        +Money total
        +OrderStatus status
        +addLine(Product, int) OrderLine
        +submit() OrderSubmitted
    }
    User "1" --> "*" Order : places
    Order *-- OrderLine : contains
    User --> Email : has
```

---

## 4. AsyncAPI / Event Specification

```yaml
asyncapi: 3.0.0
info:
  title: Events
  version: 1.0.0
channels:
  user/created:
    messages:
      UserCreated:
        payload:
          type: object
          required: [userId, email, occurredAt]
          properties:
            userId: { type: string, format: uuid }
            email: { type: string, format: email }
            occurredAt: { type: string, format: date-time }
  order/submitted:
    messages:
      OrderSubmitted:
        payload:
          type: object
          required: [orderId, userId, total, occurredAt]
          properties:
            orderId: { type: string, format: uuid }
            userId: { type: string, format: uuid }
            total: { type: number }
            occurredAt: { type: string, format: date-time }
```

---

## 5. State Machine (Mermaid stateDiagram)

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Submitted : submit() [all lines valid]
    Submitted --> Approved : approve() [authorized]
    Submitted --> Rejected : reject() [reason required]
    Approved --> Shipped : ship() [inventory reserved]
    Rejected --> Draft : revise()
    Shipped --> Delivered : confirmDelivery()
    Shipped --> Returned : initiateReturn() [within 30 days]
    Delivered --> [*]
    Returned --> [*]
```

---

## 6. UI Wireframe (Screen Flows)

```mermaid
graph TD
    Login --> Dashboard
    Dashboard --> UserList
    Dashboard --> Settings
    UserList --> UserDetail
    UserDetail --> EditUser
    EditUser -->|save| UserDetail
    EditUser -->|cancel| UserDetail
    Settings --> Profile
    Settings --> Security
    Security --> ChangePassword
    Security --> Enable2FA
```

---

## 7. Environment Configuration

```yaml
# Database
DATABASE_URL: "postgresql://user:pass@host:5432/db"  # Connection string
DATABASE_POOL_MIN: 2
DATABASE_POOL_MAX: 10

# Authentication
JWT_SECRET: ""           # REQUIRED - from vault
JWT_EXPIRY: "15m"
REFRESH_TOKEN_EXPIRY: "7d"

# External Services
SMTP_HOST: ""
SMTP_PORT: 587
REDIS_URL: "redis://localhost:6379"

# Application
PORT: 3000
NODE_ENV: "development"  # development | staging | production
LOG_LEVEL: "info"        # debug | info | warn | error
```

---

## Spec Versioning

Every spec file starts with a version header:
```
# v1.0 — Initial specification
# v1.1 — Added pagination to /users endpoint
# v2.0 — Breaking: changed auth from API key to JWT
```

When requirements change: bump version, document what changed, flag if breaking.

---

## Quality Checklist

- [ ] All endpoints have request AND response schemas
- [ ] All schemas use `$ref` for reusable components
- [ ] Error responses follow consistent format across all endpoints
- [ ] Auth requirements specified per endpoint
- [ ] Database constraints and indexes defined for expected queries
- [ ] State machine transitions have guards where needed
- [ ] Environment template lists all required variables
- [ ] No implementation details in specs (no framework names, no code patterns)

## Pragmatic Scope

| Project Type | Minimum Specs |
|-------------|---------------|
| API project | OpenAPI + DB schema + env template |
| Full-stack app | OpenAPI + DB schema + domain model + wireframes + env |
| Data pipeline | DB schema + state machines + env template |
| Library/package | Domain model + API doc |
