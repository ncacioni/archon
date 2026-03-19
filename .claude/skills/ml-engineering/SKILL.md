---
name: ml-engineering
description: ML engineering patterns — problem framing, EDA, feature engineering, modeling (tree-based/deep learning/probabilistic), rigorous evaluation (cross-validation, bias/variance, fairness), experiment tracking, reproducibility. Use when designing, building, or evaluating ML models.
---

# ML Engineering Patterns

## 1. Problem Framing

Translate business problems to ML tasks before touching data:

| Business Goal | ML Task | Key Metric |
|---------------|---------|------------|
| Reduce churn | Binary classification | Recall@k, AUC-PR |
| Revenue forecasting | Regression / time series | RMSE, MAPE |
| Content discovery | Recommendation | NDCG, MAP |
| Fraud detection | Anomaly detection | Precision@k, AUC-ROC |
| Document processing | NLP (classification/extraction) | F1, exact match |
| Visual inspection | Computer vision | mAP, IoU |

**Rules:**
- Always establish a baseline (heuristic, simple model, or random) before adding complexity
- Define business success metrics alongside ML metrics BEFORE modeling
- Start simple: logistic regression / decision tree before neural networks
- If a rule-based system achieves 80% of the goal, question whether ML is needed

---

## 2. Data Preparation & EDA

### Exploration Checklist
- Distribution analysis (histograms, box plots, KDE)
- Correlation matrix (Pearson for numeric, Cramér's V for categorical, mutual information for mixed)
- Missing data patterns: MCAR (random), MAR (depends on observed), MNAR (depends on missing)
- Outlier detection: IQR method, Z-score, Isolation Forest
- **Target leakage detection**: Features that won't exist at prediction time

### Class Imbalance Strategies
| Technique | When |
|-----------|------|
| Stratified sampling | Always for train/val/test split |
| Class weights | First approach, modify loss function |
| SMOTE / ADASYN | Moderate imbalance (1:10) |
| Threshold tuning | Adjust decision threshold post-training |
| Focal loss | Severe imbalance in deep learning |

### Data Validation Gates
- Schema checks (column names, types, ranges)
- Distribution drift detection (KS test, PSI)
- Completeness thresholds (< 5% missing for critical features)
- Data versioning: DVC or Delta Lake snapshots

---

## 3. Feature Engineering

| Type | Techniques |
|------|-----------|
| **Numerical** | Scaling (StandardScaler, MinMax), log transform, binning, polynomial features |
| **Categorical** | One-hot (low cardinality), target encoding (high cardinality), frequency, embeddings |
| **Temporal** | Lag features, rolling statistics (mean, std, min, max), cyclical encoding (sin/cos for hour/month) |
| **Text** | TF-IDF, sentence embeddings (sentence-transformers), token counts, sentiment scores |
| **Interaction** | Feature crosses, ratios, differences between related features |

### Feature Selection
- **Filter**: Mutual information, variance threshold, correlation cutoff
- **Wrapper**: Recursive Feature Elimination (RFE)
- **Embedded**: L1 regularization (Lasso), tree feature importance

### Feature Stores
- **Feast**: Open-source, offline + online serving, point-in-time joins
- **Tecton**: Managed, real-time features, streaming
- **Databricks Feature Store**: Unity Catalog integrated, auto-logging

---

## 4. Modeling — Tree-Based

```python
import optuna
from xgboost import XGBClassifier

def objective(trial):
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 100, 1000),
        'max_depth': trial.suggest_int('max_depth', 3, 10),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.3, log=True),
        'subsample': trial.suggest_float('subsample', 0.6, 1.0),
        'colsample_bytree': trial.suggest_float('colsample_bytree', 0.6, 1.0),
        'reg_alpha': trial.suggest_float('reg_alpha', 1e-8, 10.0, log=True),
        'reg_lambda': trial.suggest_float('reg_lambda', 1e-8, 10.0, log=True),
    }
    model = XGBClassifier(**params, eval_metric='auc', early_stopping_rounds=50)
    model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)
    return model.best_score

study = optuna.create_study(direction='maximize')
study.optimize(objective, n_trials=100)
```

| Library | Strength |
|---------|----------|
| **XGBoost** | Robustness, GPU support, wide adoption |
| **LightGBM** | Speed, memory efficiency, leaf-wise growth |
| **CatBoost** | Native categorical handling, ordered boosting |

### Interpretability
- SHAP values (global and local explanations)
- Permutation importance (model-agnostic)
- Feature gain/split importance (model-specific)

---

## 5. Modeling — Deep Learning

```python
import torch
import torch.nn as nn

class Model(nn.Module):
    def __init__(self, input_dim, hidden_dim, output_dim):
        super().__init__()
        self.layers = nn.Sequential(
            nn.Linear(input_dim, hidden_dim), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(hidden_dim, hidden_dim), nn.ReLU(), nn.Dropout(0.3),
            nn.Linear(hidden_dim, output_dim)
        )
    def forward(self, x):
        return self.layers(x)

# Training loop
optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3, weight_decay=1e-4)
scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)

for epoch in range(epochs):
    model.train()
    for batch in dataloader:
        optimizer.zero_grad()
        loss = criterion(model(batch.x), batch.y)
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        optimizer.step()
    scheduler.step()
```

### Transfer Learning
1. Load pretrained model (freeze base layers)
2. Replace final layer(s) for your task
3. Train final layers on your data
4. Optionally fine-tune all layers with small learning rate

### Architecture Selection
| Problem | Architecture |
|---------|-------------|
| Tabular | MLP, TabNet, FT-Transformer |
| Images | CNN (ResNet, EfficientNet), ViT |
| NLP | Transformer (BERT, GPT), sentence-transformers |
| Time series | Temporal Fusion Transformer, N-BEATS, PatchTST |
| Graphs | GNN (GCN, GAT, GraphSAGE) |

---

## 6. NLP & LLMs

- **Embeddings**: sentence-transformers for semantic search, OpenAI/Cohere for production
- **RAG**: Chunking strategies (recursive, semantic), vector stores (Chroma, Pinecone, pgvector), reranking
- **Fine-tuning**: LoRA/QLoRA with PEFT (parameter-efficient, 4-bit quantization), dataset preparation (instruction format)
- **Evaluation**: Exact match, F1-token, BLEU/ROUGE (generation), human evaluation for quality

---

## 7. Probabilistic Models

- **Bayesian inference**: PyMC/Stan for uncertainty quantification, prior specification, posterior analysis
- **Gaussian Processes**: Small data, need prediction intervals, automatic relevance determination
- **When to use**: Small data, domain knowledge as priors, uncertainty estimates critical (medical, financial)

---

## 8. Evaluation — Rigorous

### Cross-Validation Strategies
| Strategy | Use Case |
|----------|----------|
| K-fold | Standard, sufficient data |
| Stratified K-fold | Imbalanced classes |
| Time-series split (with gap) | Temporal data, prevent leakage |
| Group K-fold | Clustered data (same patient, same user) |

### Metric Selection
| Problem | Primary | Secondary |
|---------|---------|-----------|
| Classification (balanced) | F1-macro, AUC-ROC | Precision, Recall per class |
| Classification (imbalanced) | AUC-PR, F1 minority | Precision@k, Recall@k |
| Regression | RMSE | MAE, MAPE, R² |
| Ranking | NDCG | MAP, MRR |

### Bias/Variance Analysis
- **Learning curves**: Plot train/val error vs. training size → diagnose underfitting/overfitting
- **Validation curves**: Plot train/val error vs. hyperparameter → find optimal complexity
- High bias → more features, less regularization, more complex model
- High variance → more data, more regularization, simpler model, dropout

### Fairness & Calibration
- **Demographic parity**: P(ŷ=1|A=0) ≈ P(ŷ=1|A=1)
- **Equalized odds**: Equal TPR and FPR across groups
- **Calibration**: Reliability diagrams, Platt scaling, isotonic regression
- **Statistical significance**: Bootstrap confidence intervals, paired t-test, McNemar's test

---

## 9. Experiment Tracking & Reproducibility

```python
import mlflow

mlflow.set_experiment("churn-prediction")
with mlflow.start_run(run_name="xgboost-v2"):
    mlflow.log_params(best_params)
    mlflow.log_metric("auc_roc", auc_score)
    mlflow.log_metric("f1", f1_score)
    mlflow.sklearn.log_model(model, "model")
    mlflow.log_artifact("feature_importance.png")
```

### Reproducibility Checklist
- [ ] Random seeds fixed (`random`, `numpy`, `torch`, `PYTHONHASHSEED`)
- [ ] Library versions pinned (`requirements.txt` or `pyproject.toml`)
- [ ] Training data versioned (DVC, Delta Lake snapshot)
- [ ] Git commit hash logged with experiment
- [ ] Training environment containerized (Docker)
- [ ] Hyperparameters logged (not just best — all trials)
