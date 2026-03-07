# Design: Agent Enhancements — Observability, Infrastructure, Product Owner, Secrets, CI/CD, Code Review

**Date:** 2026-03-03
**Status:** Approved

## Summary

Seven targeted additions across six agent files. Each addition fills a verified gap — changes already present in the agents were excluded.

---

## Changes by Agent

### Agent 22 — Observability

**1. Incident mitigation and remediation in runbooks**

Current state: "Every alert has a runbook" exists as a rule, but runbooks have no mandated content.

Addition: Mandate that every runbook includes (a) immediate mitigation steps, (b) root cause investigation steps, and (c) remediation/recovery actions. This makes runbooks actionable rather than just present.

**2. Proactive automated reaction at thresholds**

Current state: Alerting thresholds and burn rate alerts exist (passive notification only).

Addition: Add a rule requiring automated response actions — not just alerts — when thresholds are breached. Examples: trigger auto-scaling, open circuit breakers, notify on-call with pre-selected runbook, initiate auto-rollback. Distinguishes "alert fired" from "system responded."

---

### Agent 07 — Infrastructure Architect

**3. FinOps as a core responsibility**

Current state: FinOps (cost allocation tags, reserved instances, spot) appears only in the certification footnote — not a Core Responsibility.

Addition: Promote cost monitoring to Core Responsibility #6: track and report operational costs across compute, data transfer, storage, and observability tooling. Include cost budgets and anomaly alerting.

**4. IaC → scripted → documented fallback hierarchy**

Current state: Principle #1 states "EVERYTHING codified" — absolute, no fallback guidance.

Addition: Replace with a tiered mandate: (1) all infrastructure must be codified as IaC; (2) where IaC tooling cannot manage a resource, it must be scripted (shell, CLI, automation); (3) where scripting is not possible, it must be documented as a manual runbook. Nothing is exempt from traceability.

---

### Agent 26 — Product Owner

**5. Change traceability**

Current state: No requirement linking changes to originating requests.

Addition: Mandate that every backlog item, PR, and deployment must be traceable to an originating request (user story, bug report, or stakeholder decision). No change proceeds without a linked backlog item.

**6. Release sign-off**

Current state: Sprint deliverable sign-off exists ("Sign off on sprint deliverables during Sprint Review"). Releases are not mentioned.

Addition: The PO must explicitly sign off on every release before it proceeds to production. Sprint review acceptance and release sign-off are separate gates. Release sign-off confirms scope, version, and release notes are accurate.

---

### Agent 10 — Secrets & Crypto

**7. Mandatory review gate for PII/secrets changes**

Current state: Agent defines standards and has VETO/FORBIDDEN lists, but has no explicit review gate role — it's consulted on design, not on every change.

Addition: Any PR or change that handles PII, sensitive personal data, system secrets, or cryptographic operations requires review by Agent 10 before merge. This makes the agent a mandatory reviewer, not just a standards setter.

---

### Agent 21 — CI/CD

**8. Rollback capability as a hard requirement**

Current state: Blue-green/canary and auto-rollback are mentioned in Stage 7 (Production) as deployment tactics, but not as mandatory requirements.

Addition: Add an explicit rule: every deployment must be rollback-capable. This requires: (a) blue-green or canary deployment strategy, (b) database migrations must be backward-compatible, (c) auto-rollback triggers on failed health checks within a defined window, (d) rollback procedure tested before promotion to production.

---

### Agent 19 — Code Review

**9. Readability as an explicit mandate**

Current state: Readability is implicit in metrics (functions < 20 lines, max 3 nesting levels) but not stated as a principle.

Addition: Add "Code must be readable" as an explicit review criterion: prefer clarity over cleverness, meaningful names, no unexplained complexity. Existing metrics remain as supporting enforcement.

---

## Excluded (Already Present)

| Suggestion | Reason Excluded |
|---|---|
| Infrastructure owns DR plan | Already Core Responsibility #5: "PLAN disaster recovery" |
| PO: all features prioritized | Already Core Responsibility #1: MoSCoW + business value scoring |
| All code must be tested | Agent 17 already has explicit coverage targets (90/80/70% by layer) |

---

## Implementation Plan

One PR with all seven changes across six files:

- `agents/22-observability.md`
- `agents/07-infrastructure-architect.md`
- `agents/26-product-owner.md`
- `agents/10-secrets-crypto.md`
- `agents/21-cicd.md`
- `agents/19-code-review.md`
