---
name: mlops-patterns
description: MLOps patterns — ML pipelines (Kubeflow/Vertex/SageMaker), model serving, monitoring/drift detection, retraining strategies, governance, cost optimization, integration with data engineering. Use when deploying or operationalizing ML models.
---

# MLOps Patterns

## 1. ML Pipeline Orchestration

### Three Pipeline Types
```
Feature Pipeline:  Raw Data → Validated Data → Features (offline + online store)
Training Pipeline: Features → Train → Evaluate → Register Model
Inference Pipeline: Features + Model → Predictions → Monitoring
```

### Orchestration Tools
| Tool | Strength |
|------|----------|
| **Kubeflow Pipelines** | K8s native, component-based, GPU scheduling |
| **Vertex AI Pipelines** | GCP managed, AutoML integration |
| **SageMaker Pipelines** | AWS managed, training jobs, endpoints |
| **ZenML** | Stack abstraction, vendor-neutral, local → cloud |
| **Airflow** | Existing data infra, DAG-based, broad ecosystem |

---

## 2. Model Serving

### Serving Patterns
| Pattern | Latency | Use Case |
|---------|---------|----------|
| **REST API** | 10-100ms | Real-time predictions, user-facing |
| **Batch** | Hours | Score entire dataset, reports |
| **Streaming** | 100ms-1s | Event-driven, Kafka consumer + model |
| **Edge** | 1-10ms | Mobile, IoT, browser (ONNX, TensorRT) |

### REST API Pattern (FastAPI)
```python
from fastapi import FastAPI
import mlflow

app = FastAPI()
model = mlflow.pyfunc.load_model("models:/churn-model/Production")

@app.post("/predict")
async def predict(features: FeatureRequest):
    prediction = model.predict(features.to_dataframe())
    return {"prediction": prediction.tolist(), "model_version": model.metadata.run_id}

@app.get("/health")
async def health():
    return {"status": "healthy", "model_loaded": model is not None}
```

### Model Compression
| Technique | Speedup | Quality Loss |
|-----------|---------|-------------|
| Pruning (structured) | 2-4x | 1-3% |
| Quantization (INT8) | 2-4x | < 1% |
| Knowledge distillation | Variable | 1-5% |
| ONNX export | 1.5-3x | ~0% |

---

## 3. Deployment Strategies

| Strategy | Description | When |
|----------|-------------|------|
| **Shadow mode** | Run new model alongside old, compare predictions | First deployment, high-risk models |
| **A/B testing** | Split traffic, measure business impact | Feature changes, UI-facing models |
| **Canary** | Gradual rollout (1% → 10% → 50% → 100%) | Production updates |
| **Blue-green** | Instant swap, instant rollback | Low-risk model swaps |

### A/B Testing
- Calculate required sample size before starting (power analysis)
- Run for full business cycle (min 1-2 weeks)
- Use statistical significance test (chi-square for classification, t-test for regression)
- Feature flags for model version selection

---

## 4. Monitoring & Observability

### Data Drift Detection
| Method | Type | Tool |
|--------|------|------|
| **PSI** (Population Stability Index) | Distribution shift | Evidently, custom |
| **KS test** | Distribution comparison | scipy, Evidently |
| **Chi-square** | Categorical drift | scipy |
| **Embedding drift** | Semantic shift | Evidently, Whylabs |

### What to Monitor
- **Input features**: Distribution, missing rate, outlier frequency → data drift
- **Predictions**: Output distribution, confidence scores → prediction drift
- **Performance**: Accuracy/F1 when ground truth available → concept drift
- **Latency**: p50, p95, p99 for serving endpoints
- **Throughput**: Predictions per second, queue depth

### Alert Thresholds
- PSI > 0.2 → Significant drift → trigger investigation
- PSI > 0.25 → Critical drift → trigger retraining pipeline
- Accuracy drop > 5% → Performance degradation → trigger retraining
- Latency p99 > 500ms → SLO violation → scale or optimize

---

## 5. Retraining Strategies

| Strategy | Trigger | Complexity |
|----------|---------|------------|
| **Scheduled** | Cron (daily/weekly) | Low |
| **Drift-triggered** | PSI/KS threshold exceeded | Medium |
| **Performance-triggered** | Metric below threshold | Medium |
| **Online learning** | Every N predictions | High |

### Champion/Challenger Pattern
1. Train new model (challenger)
2. Evaluate on holdout set
3. Compare to production model (champion) on same data
4. Promote only if challenger beats champion by margin
5. Automated rollback if production metrics degrade

### Retraining Pipeline
```
Data validation → Feature computation → Training → Evaluation →
Comparison with champion → Approval gate → Deployment → Monitoring
```

---

## 6. Model Governance

### Model Cards
```markdown
# Model: churn-prediction-v2
## Purpose
Predict customer churn probability within 30 days.
## Intended Use
Marketing team for retention campaigns. NOT for individual service decisions.
## Limitations
- Trained on US customers only
- Performance degrades for accounts < 30 days old
- Not validated for enterprise accounts
## Performance
| Segment | AUC-ROC | F1 |
|---------|---------|-----|
| All | 0.87 | 0.72 |
| Age 18-25 | 0.83 | 0.68 |
| Age 55+ | 0.89 | 0.76 |
## Ethical Considerations
No protected attributes used. Tested for demographic parity.
```

### Model Lineage
```
Raw Data (v2.1) → Features (v3.0) → Training (run_abc123) → Model (v2) → Endpoint (prod)
```

- Track data version, feature set, hyperparameters, code commit
- Audit trail: who trained, when, what data, what approval
- Reproducibility: any model version can be retrained from logged inputs

---

## 7. Cost Optimization

| Area | Strategy |
|------|----------|
| **Training** | Spot/preemptible instances (with checkpointing), right-size GPU |
| **Serving** | Scale-to-zero for low traffic, multi-model on shared GPU |
| **Inference** | Batching (dynamic batch for throughput), model compression |
| **Storage** | Prune old model versions, archive training artifacts |
| **Experiments** | Early stopping + pruning (Optuna) to kill bad trials fast |

---

## 8. Integration with Data Engineering

### Feature Store as Bridge
```
Data Pipelines (Airflow/dbt) → Feature Store (Feast/Tecton) → ML Training/Serving
                                 ├── Offline Store (training, batch)
                                 └── Online Store (real-time serving)
```

- **Point-in-time correctness**: Prevent future leakage in training features
- **Consistency**: Same feature computation for training and serving
- **Data quality gates**: Validate features (Great Expectations) before training
- **End-to-end lineage**: Raw data → features → model → predictions

### Shared Scheduling
- Airflow orchestrating both data pipelines and ML pipelines
- Data freshness check before triggering training
- Feature computation DAG → Training DAG → Deployment DAG

---

## 9. Reliability Patterns

- **Model fallback**: Rule-based default when model fails or times out
- **Graceful degradation**: Serve cached predictions during outage
- **Circuit breaker**: Trip after N consecutive failures, serve fallback
- **Health checks**: Model loaded? Warm? Responsive? Correct output schema?
- **Load testing**: Benchmark throughput and latency under expected load before production
- **Chaos testing**: Kill model server, verify fallback activates correctly
