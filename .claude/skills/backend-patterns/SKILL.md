---
name: backend-patterns
description: Modern backend patterns — API design (REST/GraphQL), auth (JWT/OAuth2/RBAC), middleware, error handling, caching, async messaging, microservices, serverless. Use when building APIs, services, or server-side logic.
---

# Backend Patterns

## 1. API Design — REST

- **Resources are nouns**: `/users`, `/orders` (not `/getUsers`)
- **Versioning**: URL path preferred (`/api/v1/`)
- **Pagination**: Cursor-based preferred (stable, performant); offset for simple cases
- **Filtering/sorting**: Query params (`?status=active&sort=-created_at`)
- **Standard error format**: `{ error: { code, message, details[], request_id } }`
- **Status codes**: 200 OK, 201 Created, 204 No Content, 400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Unprocessable, 429 Too Many Requests, 500 Internal
- **Rate limiting headers**: `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `Retry-After`
- Never expose internal IDs or implementation details in responses

## 2. API Design — GraphQL

- Schema-first design (SDL before resolvers)
- DataLoader for N+1 prevention (batch + cache per request)
- Relay-style connections for pagination (`edges`, `node`, `pageInfo`)
- Depth limiting and query complexity analysis to prevent abuse
- Subscriptions via WebSocket for real-time updates
- Federation/schema stitching for microservices

---

## 3. Authentication & Authorization

### JWT Pattern
- **Access token**: Short-lived (15min), stored in memory only
- **Refresh token**: Long-lived (7d), httpOnly secure cookie
- Rotation: issue new refresh token on each use, invalidate old one
- Revocation: maintain blocklist in Redis (check on each request)
- Claims: `sub`, `iat`, `exp`, `roles`, `permissions` — minimal payload

### OAuth2 Flows
| Flow | Use Case |
|------|----------|
| Authorization Code + PKCE | SPAs, mobile apps |
| Client Credentials | Machine-to-machine (M2M) |
| Device Authorization | IoT, CLI tools |

### RBAC/ABAC
- RBAC: `user.roles.includes('admin')` → coarse-grained
- ABAC: `policy.evaluate({ user, resource, action, context })` → fine-grained
- Check authorization BEFORE business logic in every use case

### Session Management
- Secure, httpOnly, SameSite=Strict cookies
- Session ID: cryptographically random, rotated after auth state change
- Absolute timeout (24h) + idle timeout (30min)

---

## 4. Middleware Patterns

- **Request validation**: Schema-based (Zod, Joi, Pydantic) at API boundary
- **Rate limiting**: Token bucket (smooth) or sliding window (strict); per-user and per-IP
- **CORS**: Explicit allowlist (never `*` in production)
- **Request ID**: Generate `X-Request-Id`, propagate through all services
- **Compression**: gzip/brotli for responses > 1KB
- **Request logging**: method, path, status, duration, request_id (never log body with PII)

---

## 5. Error Handling

### Structured Error Responses
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": ["email: must be a valid email"],
    "request_id": "req_abc123"
  }
}
```

### Error Hierarchy
```
AppError (base)
├── DomainError (business rule violations)
│   ├── NotFoundError (404)
│   ├── ConflictError (409)
│   └── ValidationError (422)
├── AuthError (401/403)
└── InfrastructureError (500, not exposed to client)
```

### Retry Strategies
- **Exponential backoff**: `delay = baseDelay * 2^attempt + jitter`
- **Circuit breaker**: Closed → Open (on failure threshold) → Half-Open (probe) → Closed
- **Idempotency keys**: Client-generated UUID in `Idempotency-Key` header for safe retries

---

## 6. Caching Strategies

| Strategy | Pattern | Use Case |
|----------|---------|----------|
| Cache-aside | Read: check cache → miss → DB → populate cache | Most read-heavy workloads |
| Write-through | Write: DB + cache simultaneously | Strong consistency |
| Write-behind | Write: cache first, async persist to DB | High write throughput |

### Redis Patterns
- Key naming: `{service}:{entity}:{id}` (e.g., `users:profile:uuid`)
- TTL: Set always (prevent unbounded growth)
- Cache stampede prevention: probabilistic early expiry or mutex lock
- Pub/sub for cache invalidation across instances

### HTTP Caching
- `ETag` + `If-None-Match` for conditional requests
- `Cache-Control`: `public, max-age=3600` (static), `private, no-cache` (user-specific)
- `Vary` header for content negotiation

---

## 7. Database Patterns

- **Connection pooling**: min 2, max 10-20, idle timeout 30s
- **Query optimization**: EXPLAIN ANALYZE before shipping, index for WHERE/JOIN columns
- **N+1 detection**: Log query counts per request; alert on > 10 queries
- **Read replicas**: Route reads to replica, writes to primary; handle replication lag
- **Transaction isolation**: Read Committed (default), Serializable (for financial ops)

---

## 8. Async Patterns

### Message Queues
- Dead letter queue (DLQ) for failed messages after max retries
- Idempotency: deduplicate by message ID or idempotency key
- At-least-once delivery: design consumers to be idempotent
- Ordering: partition by entity ID when order matters

### Event-Driven Architecture
- Domain events for intra-service, integration events for inter-service
- Outbox pattern: write event to DB in same transaction, publish async
- Event schema versioning: backward-compatible additions only

### WebSocket & SSE
- WebSocket: heartbeat (30s ping), reconnection with exponential backoff, room/channel model
- SSE: simpler for server→client only, auto-reconnect built into browser API

---

## 9. Microservices

- **Start monolith**: Split only when you have clear bounded contexts and team/scale reasons
- **API Gateway**: Routing, auth, rate limiting, request aggregation
- **Service discovery**: DNS-based (K8s services) or registry (Consul)
- **Saga pattern**: Choreography (events) for simple flows, Orchestration (coordinator) for complex
- **Distributed tracing**: OpenTelemetry, propagate trace context across all calls
- **Bulkhead**: Isolate failure domains (separate thread pools/connection pools per dependency)

---

## 10. Serverless

- **Cold start mitigation**: Provisioned concurrency, keep-warm scheduled events, small bundles
- **Connection reuse**: Initialize DB connections outside handler, reuse across invocations
- **Idempotency**: Every function invocation must be safe to retry
- **Event-driven**: Trigger from queues, S3, API Gateway, schedules
- **Timeout design**: Set function timeout < queue visibility timeout to avoid duplicate processing
