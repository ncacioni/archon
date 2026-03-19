# Archon Permission Guide

A practical guide to configuring Claude Code permissions for use with the Archon framework. Provides three copy-paste-ready permission tiers with the right balance of speed and safety.

---

## Permission Syntax Reference

Claude Code permissions use three arrays in your settings JSON:

| Field | Behavior | Can override? |
|-------|----------|---------------|
| `allow` | Auto-approved without prompting | Yes — higher-priority scope wins |
| `ask` | Prompted each time, with "Always allow" option | Yes — higher-priority scope wins |
| `deny` | Unconditionally blocked | No — **deny at any level cannot be overridden** |

Evaluation order: **deny first, then ask, then allow**. The first matching rule wins.

### Pattern syntax

Patterns use glob-style matching against tool invocations:

| Pattern | Matches |
|---------|---------|
| `Bash(git status*)` | Any Bash call starting with `git status` |
| `Bash(* --version)` | Any command ending with `--version` |
| `Bash` | All Bash commands (no parentheses = match all) |
| `Write` | All Write tool invocations |
| `mcp_sentry_*` | All MCP tools starting with `mcp_sentry_` |

---

## How Permission Layering Works

Claude Code evaluates settings from four scopes, highest priority first:

| Priority | Scope | File | Shared? |
|----------|-------|------|---------|
| 1 (highest) | Managed | OS-level / server-managed | Yes (IT-deployed) |
| 2 | Local | `.claude/settings.local.json` | No (gitignored) |
| 3 | Project | `.claude/settings.json` | Yes (committed) |
| 4 (lowest) | User | `~/.claude/settings.json` | No (personal) |

### The critical rule

**If a tool is denied at any level, no other level can allow it.**

The deny list committed in Archon's `.claude/settings.json` cannot be overridden by local or user settings. This is by design.

### Where to put what

| What | Where | Why |
|------|-------|-----|
| Deny list (safety floor) | `.claude/settings.json` (committed) | Shared, non-negotiable for all contributors |
| Your permission tier | `.claude/settings.local.json` (gitignored) | Per-developer, per-project choice |
| Universal read-only utils | `~/.claude/settings.json` (user global) | Applies to all your projects |

**Recommendation:** Put your tier in `.claude/settings.local.json`. Only use global settings for universally safe patterns (like `ls`, `cat`, `--version`).

---

## Archon's Committed Baseline

The project ships with `.claude/settings.json`:

```json
{
  "permissions": {
    "allow": [
      "Read",
      "Glob",
      "Grep"
    ],
    "deny": [
      "Bash(rm -rf *)",
      "Bash(rm -r *)",
      "Bash(find * -delete*)",
      "Bash(git push --force*)",
      "Bash(git push -f*)",
      "Bash(git reset --hard*)",
      "Bash(git clean -f*)",
      "Bash(git checkout -- .)",
      "Bash(git checkout -- *)",
      "Bash(curl * | sh*)",
      "Bash(curl * | bash*)",
      "Bash(wget * | sh*)",
      "Bash(chmod 777*)"
    ]
  }
}
```

**What this means:** Read, Glob, and Grep are auto-approved. Everything else (Write, Edit, every Bash command) requires manual approval. The 13 deny patterns are enforced unconditionally.

**Without a local settings file, you will get a confirmation popup for every file edit and every Bash command.** This is why choosing a tier below is important.

---

## Tier 1: Conservative

**For:** Shared repositories, team environments, open-source projects, or any context where you want human review of all writes.

**Philosophy:** Auto-approve all read-only operations. Place file writes in `ask` so you can promote them to "Always allow" at runtime if desired.

### Configuration

Create `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "WebSearch",
      "Bash(git status*)",
      "Bash(git log*)",
      "Bash(git diff*)",
      "Bash(git branch*)",
      "Bash(git show*)",
      "Bash(git remote*)",
      "Bash(git fetch*)",
      "Bash(git rev-parse*)",
      "Bash(git ls-remote*)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(head *)",
      "Bash(tail *)",
      "Bash(wc *)",
      "Bash(pwd)",
      "Bash(which *)",
      "Bash(type *)",
      "Bash(find *)",
      "Bash(tree *)",
      "Bash(echo *)",
      "Bash(jq *)",
      "Bash(sort *)",
      "Bash(diff *)",
      "Bash(test *)",
      "Bash(* --version)",
      "Bash(* --help)",
      "Bash(* --help *)"
    ],
    "ask": [
      "Write",
      "Edit"
    ]
  }
}
```

### What this allows and why

| Category | Patterns | Rationale |
|----------|----------|-----------|
| **Git read ops** | `status`, `log`, `diff`, `branch`, `show`, `remote`, `fetch`, `rev-parse`, `ls-remote` | Read-only. Cannot modify working tree, index, or remote. |
| **File inspection** | `ls`, `cat`, `head`, `tail`, `wc`, `pwd`, `which`, `type`, `find`, `tree` | Read-only filesystem inspection. |
| **Data utilities** | `jq`, `sort`, `diff`, `echo`, `test` | Read-only text processing and conditionals. |
| **Info flags** | `--version`, `--help` | Informational. No side effects. |
| **Web search** | `WebSearch` | Read-only information retrieval. |

### What `ask` does here

`Write` and `Edit` are in `ask`, not `allow`. This means Claude will prompt you each time, but with an **"Always allow"** option. If you find yourself approving every edit, click "Always allow" and it effectively becomes Tier 2 for that session.

### Best agents for this tier

- **architect**, **security**: Read-only by design. Near-zero friction.
- **spec-writer**: Mostly reads, occasional writes prompt for review.

---

## Tier 2: Developer

**For:** Solo developers working on their own projects. The "just works" tier for day-to-day development.

**Philosophy:** Auto-approve file edits and all safe development commands. Use `ask` for operations that touch the remote, install packages, or interact with containers — you get prompted but can "Always allow" if you trust the pattern.

### Configuration

Create `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "Write",
      "Edit",
      "WebSearch",
      "Bash(git status*)",
      "Bash(git log*)",
      "Bash(git diff*)",
      "Bash(git branch*)",
      "Bash(git show*)",
      "Bash(git remote*)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git stash*)",
      "Bash(git checkout *)",
      "Bash(git switch *)",
      "Bash(git fetch*)",
      "Bash(git pull*)",
      "Bash(git rev-parse*)",
      "Bash(git ls-remote*)",
      "Bash(gh *)",
      "Bash(npm run *)",
      "Bash(npm test*)",
      "Bash(npx *)",
      "Bash(node *)",
      "Bash(python *)",
      "Bash(python3 *)",
      "Bash(pytest *)",
      "Bash(cargo *)",
      "Bash(go *)",
      "Bash(make *)",
      "Bash(tsc *)",
      "Bash(eslint *)",
      "Bash(prettier *)",
      "Bash(jest *)",
      "Bash(vitest *)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(head *)",
      "Bash(tail *)",
      "Bash(wc *)",
      "Bash(pwd)",
      "Bash(which *)",
      "Bash(type *)",
      "Bash(find *)",
      "Bash(tree *)",
      "Bash(echo *)",
      "Bash(jq *)",
      "Bash(sort *)",
      "Bash(diff *)",
      "Bash(test *)",
      "Bash(mkdir *)",
      "Bash(cp *)",
      "Bash(mv *)",
      "Bash(touch *)",
      "Bash(rm *)",
      "Bash(docker ps*)",
      "Bash(docker logs*)",
      "Bash(* --version)",
      "Bash(* --help)",
      "Bash(* --help *)"
    ],
    "ask": [
      "Bash(git push *)",
      "Bash(git merge *)",
      "Bash(git rebase *)",
      "Bash(npm install*)",
      "Bash(pip install *)",
      "Bash(pip3 install *)",
      "Bash(curl *)",
      "Bash(wget *)",
      "Bash(docker compose*)",
      "Bash(docker exec *)",
      "Bash(docker build *)",
      "Bash(docker run *)"
    ]
  }
}
```

### What this allows and why

| Category | Patterns | Rationale |
|----------|----------|-----------|
| **File editing** | `Write`, `Edit` | Core dev workflow. No more "Make this edit?" popups. |
| **Git local ops** | `add`, `commit`, `stash`, `checkout`, `switch`, `fetch`, `pull` | Local-only or download-only. Nothing pushes to remote. |
| **GitHub CLI** | `gh *` | PRs, issues, checks. Useful for Archon command workflows. |
| **Build/test/lint** | `npm run`, `npx`, `node`, `python`, `pytest`, `cargo`, `go`, `make`, `tsc`, `eslint`, `prettier`, `jest`, `vitest` | Standard dev loop. Build artifacts are local. |
| **File inspection** | `ls`, `cat`, `head`, `tail`, `wc`, `find`, `tree`, `jq`, `sort`, `diff`, `echo`, `test` | Read-only utilities. |
| **Filesystem ops** | `mkdir`, `cp`, `mv`, `touch`, `rm` | Common file operations. Note: `rm -rf` and `rm -r` remain hard-denied. |
| **Container read** | `docker ps`, `docker logs` | Read-only container inspection. |

### What `ask` covers and why

| Pattern | Why prompted |
|---------|-------------|
| `git push *` | Pushes to remote. Review what and where. |
| `git merge *`, `git rebase *` | Can rewrite history or create conflicts. |
| `npm install*`, `pip install *` | Installs packages — supply chain risk. |
| `curl *`, `wget *` | Network requests. Could exfiltrate data. |
| `docker compose*`, `docker exec *`, `docker build *`, `docker run *` | Container mutations — start/stop services, run arbitrary commands. |

Everything in `ask` can be promoted to "Always allow" at runtime if you decide the pattern is safe in your context.

### What is blocked (from committed deny list)

All 13 destructive patterns. Cannot be overridden. Even with `git checkout *` allowed, the specific `git checkout -- .` and `git checkout -- *` patterns remain denied because deny takes precedence.

### Best agents for this tier

- **builder**: Zero friction for the write-test-commit loop.
- **frontend**: Writes components, runs dev server and linters smoothly.
- **qa**: Writes and runs tests without interruption.
- **data**: Writes migrations and scripts freely.
- **devops**: Build/test auto-approved; Docker and deploy prompted appropriately.

---

## Tier 3: Autonomous

**For:** Experienced developers in isolated environments (containers, VMs, disposable branches), or running CI/CD-like automation.

**Philosophy:** Auto-approve nearly everything. Rely on the hard deny list plus an extended deny list as your safety net.

### Configuration

Create `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "Write",
      "Edit",
      "Bash",
      "WebSearch",
      "WebFetch"
    ],
    "deny": [
      "Bash(sudo *)",
      "Bash(npm publish*)",
      "Bash(docker rm -f*)",
      "Bash(docker system prune*)",
      "Bash(DROP DATABASE*)",
      "Bash(DROP TABLE*)",
      "Bash(truncate *)",
      "Bash(> /dev/sda*)",
      "Bash(mkfs*)",
      "Bash(dd if=*)",
      "Bash(git push * --force*)",
      "Bash(git push * -f*)",
      "Bash(shutdown*)",
      "Bash(reboot*)",
      "Bash(rm -rf /)",
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Read(**/.env)",
      "Read(**/.env.*)",
      "Read(**/credentials*)"
    ]
  }
}
```

`Bash` without a specifier matches all Bash commands. The committed deny list (13 patterns) plus this extended deny list (21 patterns) create a comprehensive safety net.

### Extended deny list explained

| Category | Patterns | Threat |
|----------|----------|--------|
| **Privilege escalation** | `sudo *` | Root access. |
| **Irreversible publishing** | `npm publish*` | Distributes packages publicly. |
| **Container destruction** | `docker rm -f*`, `docker system prune*` | Destroys running containers or cached images. |
| **Database destruction** | `DROP DATABASE*`, `DROP TABLE*`, `truncate *` | Irreversible data loss. |
| **Disk destruction** | `> /dev/sda*`, `mkfs*`, `dd if=*` | Overwrites disk or partitions. |
| **Force-push variants** | `git push * --force*`, `git push * -f*` | Catches `git push origin -f` (flag after remote). |
| **System control** | `shutdown*`, `reboot*` | Machine shutdown. |
| **Root deletion** | `rm -rf /` | Destroys entire filesystem. |
| **Secret access** | `Read(.env*)`, `Read(credentials*)` | Prevents accidental reading of secrets. |

### Risk assessment

| Risk | Mitigation |
|------|------------|
| Accidental `git push` to wrong branch | Normal push is recoverable via revert; force-push is denied. |
| Package install of malicious dep | Low risk in solo context; use lockfiles. |
| Network exfiltration | Accept the risk or move `curl`/`wget` to a deny pattern. |
| Overwriting important files | Git tracks changes; `git diff` before committing. |

### Best agents for this tier

All agents run at maximum speed. Primary beneficiaries:
- **builder**: Zero friction for the full build-test-commit cycle.
- **devops**: Docker, deploy scripts, CI commands without interruption.
- **ml-engineer**: Package installs, training scripts, GPU resource management.
- **data**: Migrations, ETL scripts, database operations.

---

## Operations That Should ALWAYS Require Human Confirmation

Regardless of which tier you choose, these operations warrant a human in the loop. They are not all coverable by pattern matching:

1. **Pushing to `main`/`master`/`production` branches** -- Even normal push to protected branches.
2. **Publishing packages** (`npm publish`, `pip upload`, `cargo publish`) -- Irreversible distribution.
3. **Deploying to production** -- Any command that affects live users.
4. **Deleting cloud resources** -- Terraform destroy, AWS resource deletion.
5. **Modifying authentication/authorization** -- Changing access controls.
6. **Running database migrations on production** -- Schema changes on live data.
7. **Generating or rotating secrets** -- Key material handling.
8. **Modifying CI/CD pipeline definitions** -- Changes to automated processes.

For Tiers 1 and 2, most of these are already behind prompts. For Tier 3, the extended deny list covers several, and CLAUDE.md instructions handle the rest.

---

## Customizing for Your Stack

The tiers above cover common development tools. Add patterns for your specific stack:

### Docker-heavy projects

```json
"allow": [
  "Bash(docker ps*)",
  "Bash(docker logs*)",
  "Bash(docker images*)",
  "Bash(docker inspect*)"
],
"ask": [
  "Bash(docker compose*)",
  "Bash(docker exec *)",
  "Bash(docker build *)",
  "Bash(docker run *)",
  "Bash(docker stop *)"
]
```

### Cloud CLI (AWS/GCP/Azure)

```json
"ask": [
  "Bash(aws *)",
  "Bash(gcloud *)",
  "Bash(az *)",
  "Bash(terraform plan*)"
],
"deny": [
  "Bash(terraform destroy*)",
  "Bash(aws s3 rm *)",
  "Bash(gcloud * delete*)"
]
```

### MCP tools

If you use MCP servers (e.g., Sentry, database tools), add their prefixes:

```json
"allow": [
  "mcp_sentry_*",
  "mcp_postgres_query*"
],
"deny": [
  "mcp_postgres_execute*"
]
```

### Data engineering (dbt, Airflow, Snowflake)

```json
"allow": [
  "Bash(dbt run*)",
  "Bash(dbt test*)",
  "Bash(dbt build*)",
  "Bash(dbt compile*)",
  "Bash(dbt ls*)"
],
"ask": [
  "Bash(dbt seed*)",
  "Bash(airflow *)",
  "Bash(snowsql *)"
]
```

---

## Troubleshooting: Still Getting Prompts?

If you configured a tier but still see confirmation popups:

1. **Check file location.** The file must be `.claude/settings.local.json` in the project root (not inside `docs/` or `.archon/`).

2. **Check JSON syntax.** A malformed JSON file is silently ignored. Validate with:
   ```bash
   node -e "JSON.parse(require('fs').readFileSync('.claude/settings.local.json','utf-8'))" && echo "Valid" || echo "Invalid"
   ```

3. **Restart the session.** Permission changes take effect on new sessions, not mid-conversation.

4. **Check for deny conflicts.** If a pattern is in the committed deny list, your local allow cannot override it. Run `/permissions` in Claude Code to see the merged rule set.

5. **Check the exact command.** The pattern must match. `Bash(npm run *)` matches `npm run test` but not bare `npm run`. Add both if needed.

6. **Check scope priority.** A managed or local deny overrides a project allow. Use `/permissions` to see which rules are active and from which scope.

---

## Quick Reference: Choosing Your Tier

| Question | Tier 1 | Tier 2 | Tier 3 |
|----------|--------|--------|--------|
| Is this a shared/team repo? | Yes | -- | -- |
| Am I the sole developer? | -- | Yes | Yes |
| Do I review every code change? | Yes | Diff in output | Trust agent |
| Am I in a disposable environment? | -- | -- | Yes |
| Do I want maximum speed? | -- | -- | Yes |
| Am I comfortable with network access? | -- | -- | Yes |

**Recommendation for most Archon users:** Start with **Tier 2**. It removes the friction from the core development loop (write code, run tests, commit) while keeping guardrails on deployment and network operations. Move to Tier 3 only after you are comfortable with how the agents behave in your project.

---

## Applying Your Configuration

1. Choose your tier from above.
2. Create `.claude/settings.local.json` in your project root.
   - Alternatively, use `~/.claude/settings.json` for global settings.
   - If you ran `npx archon init`, rename `.claude/settings.local.json.example` to `.claude/settings.local.json`.
3. Paste the JSON block for your chosen tier.
4. Restart Claude Code or start a new session.
5. Verify with `/permissions` to see the merged rule set.

The committed `.claude/settings.json` deny list is always enforced. Your local settings add allow/ask rules on top. You never need to duplicate the deny list in your local settings (though you can extend it, as shown in Tier 3).
