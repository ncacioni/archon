## 1.0.0 (2026-03-27)

### Features

* adapt USDAF for solo developer use ([c1452b0](https://github.com/ncacioni/archon/commit/c1452b063cf1eb053ec05d6359f104a35f1af803))
* add semantic-release automation with conventional commits ([4d242b4](https://github.com/ncacioni/archon/commit/4d242b423a14218ea81cb1c76c83fc51815b743d))
* agent enhancements — observability, infra, PO, secrets, CI/CD, analytics, A/B testing, SOC 2 ([41b9911](https://github.com/ncacioni/archon/commit/41b991178a248f9a88d577d9564d53556a0eca53)), closes [#6](https://github.com/ncacioni/archon/issues/6) [#5](https://github.com/ncacioni/archon/issues/5)
* **cicd:** mandate rollback capability with explicit mechanisms for every deployment ([5a0837e](https://github.com/ncacioni/archon/commit/5a0837e0d6c5b86f30069c8fe1e8361f350a8fea))
* **compliance:** add SOC 2 Type 2 TSC controls mapping and vendor risk assessment ([b663b18](https://github.com/ncacioni/archon/commit/b663b186f9898e4878c380bdb146ddddeb953fc3))
* **frontend:** add feature flags and privacy-safe analytics instrumentation ([c7778f4](https://github.com/ncacioni/archon/commit/c7778f42c99a4551bfde38b7b0f67d205798b5b6))
* **infrastructure:** add FinOps as core responsibility and IaC fallback hierarchy ([140ac60](https://github.com/ncacioni/archon/commit/140ac60941d5e3b70230a0cc2204e240eb2c47dc))
* migrate to Claude Code native .claude/ system with agents, skills, and commands ([9734596](https://github.com/ncacioni/archon/commit/9734596cd58e9acbb1bce5d0b5964093286dd151))
* **observability:** add user analytics, error tracking, A/B metric segmentation, incident response, and availability SLO ([42bf241](https://github.com/ncacioni/archon/commit/42bf2414013e0b949240da3196e47fb665596e8e))
* **observability:** mandate runbook remediation content and proactive threshold response ([8adcd67](https://github.com/ncacioni/archon/commit/8adcd67489383300bf363de9a61dc28dfa5dff4c))
* **product-owner:** add change traceability requirement and release sign-off gate ([6d60330](https://github.com/ncacioni/archon/commit/6d6033093f5c848dc2d8b17cf1f6a56fee8e21f8))
* **product-owner:** add Experimentation as Core Responsibility [#5](https://github.com/ncacioni/archon/issues/5) ([bcba0f5](https://github.com/ncacioni/archon/commit/bcba0f5a6341d4811de3ceb6645ca407d05bd1a2))
* rebrand USDAF to Archon ([e37f107](https://github.com/ncacioni/archon/commit/e37f1073fe3d0a4fe5edc42dd9264da67f62133f))
* **secrets:** add mandatory review gate for PII, secrets, and cryptographic changes ([07b3013](https://github.com/ncacioni/archon/commit/07b30131c5cd9bcb2ad646f30fd06fbfd5cab1d8))
* **security:** add annual pen test, vulnerability SLA, quarterly risk review, and access lifecycle rules ([8ad92ed](https://github.com/ncacioni/archon/commit/8ad92ed91b881a4f611f9cb7bc8259928489242e))
* **usdaf:** v2.0 runtime — memory, toolkits, scout, estimator, registry, maintenance ([9af9bbc](https://github.com/ncacioni/archon/commit/9af9bbc57936ae425dbb91190525b343d32a9317))

### Bug Fixes

* add mandatory Output Protocol to all 10 commands ([781978a](https://github.com/ncacioni/archon/commit/781978a3ae44e925c6d228599a529e73bfbd890e))
* add progress reporting to all 10 commands ([0ea5461](https://github.com/ncacioni/archon/commit/0ea5461343d78a5ff00ea35904ec4f5ad9561e11)), closes [#4](https://github.com/ncacioni/archon/issues/4)
* **observability:** qualify threshold response by severity tier, improve rule ordering ([dd75f24](https://github.com/ncacioni/archon/commit/dd75f2498eef09910aa55a6f1903a48ba96049d6))
* **product-owner:** use #### heading for Release Sign-Off subsection ([081cae1](https://github.com/ncacioni/archon/commit/081cae112259322646d4e9d5098ab61b625000e4))
* use npx github:ncacioni/archon for installation instead of npm registry ([96574dd](https://github.com/ncacioni/archon/commit/96574ddf221068ad1a6be9ee298cdf034cd2a5ee))
