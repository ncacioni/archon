Design, build, and validate data infrastructure — schemas, migrations, pipelines, and quality gates.

## Input
$ARGUMENTS

## Pipeline

### Phase 0: Scope Assessment

Classify the data work and determine which phases to run:

| Scope | Phases |
|-------|--------|
| **Schema only** (new table, modify columns) | 0 → 1 → 2 → 4 → 6 |
| **Migration only** (alter existing schema) | 0 → 2 → 4 → 6 |
| **Pipeline** (ETL/ELT, Airflow DAG, dbt models) | 0 → 3 → 4 → 5 → 6 |
| **Full data feature** (model + schema + pipeline + quality) | All phases |

### Phase 1: Data Modeling

Spawn the **data** agent to:
- Design domain model (entities, value objects, aggregates, domain events)
- Map to logical model (attributes, types, constraints)
- Produce ERD (Mermaid)
- Classify data (public/internal/confidential/restricted)

Write to `.claude/scratchpad/data-model.md`.

### Phase 2: Schema & Migration

The **data** agent produces:
- Physical schema (PostgreSQL DDL or Snowflake DDL)
- Migration files (UP + DOWN, idempotent, reversible)
- Zero-downtime migration strategy if modifying existing tables
- Indexing strategy (foreign keys, WHERE clause columns, GIN for JSONB)

Write to `.claude/scratchpad/migration.md`.

### Phase 3: Pipeline Design

The **data** agent designs and implements:
- **Airflow**: DAG structure, idempotent tasks, partition-based processing, retry with backoff
- **dbt**: staging → intermediate → marts layers, `ref()` everywhere, tests per model
- **Snowflake**: warehouse sizing, cluster keys, streams + tasks for CDC
- **Python**: pandas/polars/PySpark transformations, data validation (Great Expectations/Pandera)

Write to `.claude/scratchpad/pipeline.md`.

### Phase 4: Security Review

Spawn the **security** agent to review:
- Data classification compliance (PII in correct tier?)
- Encryption at rest for confidential/restricted data
- Access control (least privilege, no superuser in app)
- Privacy engineering (GDPR export/delete, retention policies, crypto-shredding)

**If blockers found (unclassified PII, missing encryption, excessive permissions) → STOP.**

Write to `.claude/scratchpad/security-review.md`.

### Phase 5: Quality Gates

The **data** agent implements:
- Data quality checks: completeness, accuracy, consistency, timeliness, uniqueness, validity
- dbt tests: `unique`, `not_null`, `accepted_values`, `relationships`, custom tests
- SLA monitoring and freshness checks
- Data lineage documentation

Write to `.claude/scratchpad/data-quality.md`.

### Phase 6: QA

Spawn the **qa** agent to:
- Verify migration reversibility (UP then DOWN produces original state)
- Check pipeline idempotency (re-run produces same result)
- Validate test coverage on pipeline code
- Review naming conventions and schema standards

Write to `.claude/scratchpad/qa-review.md`.

## Rules

- Every table has mandatory audit columns (id, created_at, updated_at, created_by, updated_by, deleted_at)
- UUIDs for all primary keys — never sequential
- Soft delete by default
- Every migration has UP and DOWN
- PII is always classified and protected
- dbt models always use `ref()` — never hardcode table names
- Data quality checks run on every pipeline execution
