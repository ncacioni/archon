---
name: data-patterns
description: Data engineering patterns — Airflow, dbt, Snowflake, Databricks, Python (pandas/polars/PySpark), CDC, modern tools (dlt/DuckDB/Iceberg), legacy migration (SSIS/Informatica), data quality, governance. Use when building data pipelines or warehouse logic.
---

# Data Engineering Patterns

## 1. Pipeline Architecture

```
Sources → Extract → Load (raw) → Transform → Serve
           (Airflow)  (staging)    (dbt)      (marts)
```

- **ELT** (preferred): Load raw first, transform in warehouse (leverage warehouse compute)
- **Batch vs Streaming**: Batch for analytics (Airflow), streaming for real-time (Kafka, Spark Structured Streaming)
- **Lambda architecture**: Batch + speed layer for different latency needs
- **Kappa architecture**: Single streaming pipeline, replay from log for reprocessing

---

## 2. Airflow

- DAGs must be **idempotent** — re-running produces the same result
- Use `execution_date` / `data_interval_start` for partition-based processing
- Separate extraction, loading, and transformation into distinct tasks
- **XCom**: Pass references (file paths, table names), NOT data
- Retry logic: exponential backoff (`retry_delay`, `max_retry_delay`)
- **SLA monitoring**: Alert on missed SLAs, track historical completion times
- **Dynamic tasks**: `expand()` / `map()` for dynamic task generation
- **Task groups**: Organize related tasks visually
- **Cosmos**: dbt integration for Airflow (run dbt models as Airflow tasks)
- **Connections**: Store in Airflow's encrypted connection store, never in DAG code

---

## 3. dbt

### Layer Organization
| Layer | Convention | Purpose |
|-------|-----------|---------|
| Staging | `stg_{source}_{table}` | 1:1 with source, light transforms (rename, cast, filter) |
| Intermediate | `int_{domain}_{verb}` | Business logic joins and aggregations |
| Marts | `fct_` / `dim_` | Final consumption, organized by business domain |

### Key Patterns
- `ref()` for all model references (never hardcode table names)
- `source()` for raw data with freshness checks
- **Incremental models**: `is_incremental()` block, merge strategy or delete+insert
- **Snapshots**: SCD Type 2 with `check_cols` or `updated_at` strategy
- **Tests**: `unique`, `not_null`, `accepted_values`, `relationships` on every model
- **Documentation**: `schema.yml` for every model and column
- **Packages**: `dbt_utils` (surrogate_key, pivot), `dbt_expectations` (data quality)
- **Meta + tags**: Governance labels (`pii: true`, `team: finance`)
- **Hooks**: `pre-hook` / `post-hook` for grants, statements
- **Exposures**: Document downstream consumers (dashboards, ML models)

---

## 4. Snowflake

### Schema Organization
```
RAW          — Landing zone (append-only, ELT raw data)
STAGING      — Light transforms, 1:1 with sources
ANALYTICS    — Business logic, marts, aggregations
```

### Best Practices
- **Virtual warehouses**: Start XS, scale up for heavy jobs; auto-suspend after 1-5 min
- **Cluster keys**: On large tables filtered by common predicates
- **Time travel**: Point-in-time queries and undo mistakes (1-90 days retention)
- **Zero-copy clones**: Dev/staging environments at zero storage cost
- **Streams + Tasks**: Near-real-time CDC within Snowflake
- **Resource monitors**: Control compute costs with credit limits and alerts
- **VARIANT**: Semi-structured data (JSON, Parquet) with `LATERAL FLATTEN`
- **Snowpark**: Python UDFs and stored procedures in Snowflake
- **Data sharing**: Secure sharing across accounts without data movement
- **Multi-cluster warehouses**: For concurrency, not bigger warehouses
- **Result caching**: Automatic for identical queries within 24h

---

## 5. Python Data Engineering

- **pandas**: Chunked reading (`chunksize`), memory optimization (`astype`, `category` dtype)
- **polars**: Lazy evaluation (build query plan, execute once), streaming for large-than-memory
- **PySpark**: Transformations (map, filter, groupBy), partitioning strategy, broadcast joins for small tables
- **Data validation**: Great Expectations (expectation suites, data docs), Pandera (DataFrame schemas)
- **CLI tools**: Click/Typer for data pipeline scripts
- **Logging**: `structlog` for structured JSON logs, correlation IDs
- **Packaging**: `pyproject.toml`, src layout, `uv` / `poetry` for dependency management

---

## 6. Databricks

- **Unity Catalog**: Three-level namespace (catalog.schema.table), lineage tracking, fine-grained access control
- **Delta Lake**: ACID transactions, time travel (`VERSION AS OF`), Z-ordering for query optimization, `OPTIMIZE` + `VACUUM`
- **Notebooks → Production**: Git repos integration, Workflows (jobs with schedules/triggers), parameterized notebooks
- **MLflow integration**: Experiment tracking, model registry, model serving endpoints
- **Spark Structured Streaming**: Watermarks for late data, output modes (append, complete, update), trigger intervals
- **Delta Live Tables**: Declarative pipeline definitions, quality expectations, auto-scaling

---

## 7. CDC (Change Data Capture)

| Method | Tool | Use Case |
|--------|------|----------|
| WAL-based | Debezium + Kafka Connect | Low-latency, no DB impact |
| Trigger-based | Custom triggers | Legacy systems without WAL access |
| Snowflake streams | Native Snowflake | Intra-Snowflake CDC |
| Query-based | `updated_at` polling | Simple, works everywhere |

- Handle schema evolution (new columns, type changes)
- Track inserts, updates, AND deletes (soft delete markers)
- Handle late-arriving data and out-of-order events

---

## 8. Modern Tools

| Tool | Category | Strength |
|------|----------|----------|
| **Fivetran/Airbyte** | Managed ingestion | 300+ connectors, minimal code |
| **dlt** | Python-first EL | Schema evolution, declarative, pip install |
| **DuckDB** | Local OLAP | Zero-copy from Parquet/CSV, SQL on files |
| **Apache Iceberg** | Open table format | Time travel, schema evolution, vendor-neutral |
| **Dagster** | Orchestration | Software-defined assets, observability, partitions |
| **SQLMesh** | Transformation | Virtual data environments, incremental by default |

---

## 9. Legacy Integration

- **SSIS → Airflow**: Map SSIS data flows to DAG tasks, control flow to task dependencies
- **Informatica → dbt**: Map mappings to dbt models, sessions to dbt runs
- **Talend → Python/Airflow**: Map jobs to Python scripts orchestrated by Airflow
- **Stored procedures → dbt**: Incremental migration, run both in parallel during transition
- **Gradual modernization**: New pipelines in modern stack, migrate legacy on modification

---

## 10. Data Quality

### Six Dimensions
| Dimension | Check | Tool |
|-----------|-------|------|
| Completeness | NOT NULL, row count validation | dbt tests, Great Expectations |
| Accuracy | Range checks, cross-reference | Custom expectations |
| Consistency | Reconciliation across systems | dbt tests, data contracts |
| Timeliness | SLA monitoring, freshness checks | dbt source freshness |
| Uniqueness | Dedup queries, unique constraints | dbt unique test |
| Validity | Regex, enum, format validation | Great Expectations, Pandera |

### Data Contracts
- Schema definition (column names, types, nullability)
- SLA (freshness, availability)
- Ownership (team, contact)
- Breaking change process (versioned, communicated)

---

## 11. Data Governance

- **Classification**: Public, Internal, Confidential, Restricted
- **Lineage**: Column-level tracking (dbt, Unity Catalog, DataHub)
- **Catalog**: Searchable inventory with business definitions (Atlan, DataHub, Unity Catalog)
- **PII handling**: Masking (dynamic), pseudonymization (hash), anonymization (irreversible)
- **GDPR**: Right to erasure, data portability, consent tracking
- **Crypto-shredding**: Delete encryption key to render data unreadable
- **Retention policies**: Automated purge after retention period
- **Access control**: Role-based, column-level security for sensitive fields
