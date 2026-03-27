Design, build, evaluate, and deploy an ML solution.

## Output Protocol

**MANDATORY**: You MUST output visible text to the user after completing each phase. This is not optional. The user must see real-time progress as the pipeline executes.

Between every phase:
1. Output a brief status update (3-5 lines) describing what was done, key decisions made, and issues found
2. If in plan mode, still output commentary — do not silently plan without explanation
3. Write artifacts to scratchpad AND summarize findings in visible text

**Silent execution is a bug.** If the user sees no output between agent spawns, the pipeline is broken.

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

## Progress Reporting

After each phase completes, report a concise status update to the user:

- **Phase 0**: Report problem framing (ML task type, success metrics, baseline approach, data requirements)
- **Phase 1**: Report EDA findings (data quality, distributions, key insights, feature inventory)
- **Phase 2**: Report feature engineering results (transformations applied, feature importance, validation gates)
- **Phase 3**: Report modeling results (baseline vs experiments, best model, evaluation metrics, fairness checks)
- **Phase 4**: Report security findings (privacy compliance, serving security, PII handling)
- **Phase 5**: Report MLOps setup (serving strategy, monitoring, retraining triggers)
- **Phase 6**: Report QA results (test coverage, reproducibility verified, monitoring validated)

## Rules

- Always start with a baseline before adding complexity
- Never ship a model without proper evaluation
- Feature engineering matters more than model complexity
- Reproducibility is non-negotiable: pin seeds, version data, log experiments
- Model complexity must be justified by measurable improvement over baseline
- Monitor in production — models degrade over time
