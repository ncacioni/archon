Design, build, evaluate, and deploy an ML solution.

## Input
$ARGUMENTS

## Pipeline

### Phase 0: Problem Framing

Spawn the **ml-engineer** agent to:
- Translate business problem to ML task (classification, regression, ranking, recommendation, NLP, CV, etc.)
- Define success metrics: business KPIs → ML metrics mapping
- Establish baseline approach (heuristic or simple model)
- Identify data requirements

Write to `.claude/scratchpad/ml-problem.md`.

### Phase 1: Data Exploration

The **ml-engineer** agent performs:
- EDA: distributions, correlations, missing patterns, outliers
- Data quality assessment (completeness, accuracy, consistency)
- Feature inventory: what's available, what's needed
- Data volume and storage assessment

Write to `.claude/scratchpad/ml-eda.md`.

### Phase 2: Feature Engineering

The **ml-engineer** agent designs and implements:
- Feature transformations (numerical, categorical, temporal, text)
- Feature selection and importance analysis
- Feature store design (if appropriate)
- Data validation gates: schema, distribution drift, completeness

Write to `.claude/scratchpad/ml-features.md`.

### Phase 3: Modeling & Evaluation

The **ml-engineer** agent:
- Starts with baseline model
- Experiments with appropriate models (tree-based, deep learning, probabilistic)
- Rigorous evaluation: cross-validation, test set, fairness checks
- Experiment tracking (MLflow/W&B)
- Model comparison and selection

Write to `.claude/scratchpad/ml-model.md`.

### Phase 4: Security Review

Spawn the **security** agent to review:
- Data privacy and classification compliance
- Model serving security (API auth, rate limiting)
- Input validation and adversarial robustness
- PII handling in features and predictions

**If blockers found → STOP and report.**

Write to `.claude/scratchpad/security-review.md`.

### Phase 5: MLOps Setup

The **ml-engineer** agent implements:
- Model serving (REST API, batch, or real-time)
- Deployment strategy (A/B test, canary, shadow mode)
- Monitoring: data drift, prediction drift, performance degradation
- Retraining triggers and pipeline
- Model card documentation

Write to `.claude/scratchpad/ml-deploy.md`.

### Phase 6: QA

Spawn the **qa** agent to:
- Verify test coverage on ML pipeline code
- Check reproducibility (seeds, data versions, environment)
- Validate monitoring and alerting setup
- Review model card completeness

Write to `.claude/scratchpad/qa-review.md`.

## Rules

- Always start with a baseline before adding complexity
- Never ship a model without proper evaluation
- Feature engineering matters more than model complexity
- Reproducibility is non-negotiable: pin seeds, version data, log experiments
- Model complexity must be justified by measurable improvement over baseline
- Monitor in production — models degrade over time
