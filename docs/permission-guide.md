# Archon Permission Recommendation Guide

A practical guide to configuring Claude Code permissions for use with the Archon framework. Provides three copy-paste-ready permission tiers so you can choose the right balance of speed and safety for your workflow.

---

## How Permission Layering Works

Claude Code evaluates settings from four scopes, highest priority first:

| Priority | Scope | File | Shared? |
|----------|-------|------|---------|
| 1 (highest) | Managed | OS-level / server-managed | Yes (IT-deployed) |
| 2 | Local | `.claude/settings.local.json` | No (gitignored) |
| 3 | Project | `.claude/settings.json` | Yes (committed) |
| 4 (lowest) | User | `~/.claude/settings.json` | No (personal) |

Rules are evaluated **deny first, then ask, then allow**. The first matching rule wins.

### The critical rule

**If a tool is denied at any level, no other level can allow it.**

This means the deny list committed in Archon's `.claude/settings.json` cannot be overridden by your local or user settings. This is by design. The committed deny list protects against destructive operations and is non-negotiable regardless of which tier you choose.

### Where to put your tier configuration

- **Per-project (recommended):** `.claude/settings.local.json` in your Archon project root. This file is automatically gitignored and only affects you in this project.
- **Global (all projects):** `~/.claude/settings.json`. Applies everywhere, which means the allow rules will also apply to non-Archon projects. Use this if you work solo across all your repos.

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

**What this means:** Read, Glob, and Grep are auto-approved. Everything else (Write, Edit, every Bash command) requires manual approval on each invocation. The 13 deny patterns are enforced unconditionally.

---

## Tier 1: Conservative

**For:** Shared repositories, team environments, open-source projects, or any context where you want human review of all writes.

**Philosophy:** Allow read-only Bash operations that cannot modify state. Keep all file writes and destructive commands behind manual approval.

### Configuration

Create `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "Bash(git status*)",
      "Bash(git log*)",
      "Bash(git diff*)",
      "Bash(git branch*)",
      "Bash(git show*)",
      "Bash(git remote -v*)",
      "Bash(node --version*)",
      "Bash(npm --version*)",
      "Bash(npx --version*)",
      "Bash(python --version*)",
      "Bash(python3 --version*)",
      "Bash(* --version)",
      "Bash(* --help)",
      "Bash(* --help *)",
      "Bash(ls *)",
      "Bash(cat *)",
      "Bash(wc *)",
      "Bash(pwd)",
      "Bash(which *)",
      "Bash(type *)"
    ]
  }
}
```

### What this allows and why

| Pattern | Rationale |
|---------|-----------|
| `git status/log/diff/branch/show` | Read-only git operations. Cannot modify the working tree, index, or remote. |
| `git remote -v` | Shows remote URLs. Read-only. |
| `--version`, `--help` | Informational flags. No side effects. |
| `ls`, `cat`, `wc`, `pwd`, `which`, `type` | Read-only filesystem inspection. |

### What still requires approval

- **All file writes** (Write, Edit) -- every code change is reviewed.
- **All mutating Bash commands** -- `npm install`, `git commit`, `git push`, build scripts, anything that changes state.
- **Network commands** -- `curl`, `wget`, `fetch` all require approval.

### What is blocked (from committed deny list)

All 13 destructive patterns remain enforced. Cannot be overridden.

### Best agents for this tier

- **architect** and **spec-writer**: Primarily read and analyze code, produce documents. Minimal friction from Conservative since they mostly read.
- **security**: Read-only by design (its tool list is `Read, Glob, Grep, Bash`). Benefits from git read auto-approval for reviewing history.

---

## Tier 2: Developer

**For:** Solo developers working on their own projects. You trust Claude to write code and run build/test/lint commands, but you want guardrails on deployment and system-level operations.

**Philosophy:** Auto-approve file edits and safe development commands. Require approval for anything that touches the network, installs packages, or interacts with production systems.

### Configuration

Create `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "Write",
      "Edit",
      "Bash(git status*)",
      "Bash(git log*)",
      "Bash(git diff*)",
      "Bash(git branch*)",
      "Bash(git show*)",
      "Bash(git remote -v*)",
      "Bash(git add *)",
      "Bash(git commit *)",
      "Bash(git stash*)",
      "Bash(git checkout *)",
      "Bash(git switch *)",
      "Bash(git merge *)",
      "Bash(git rebase *)",
      "Bash(npm run *)",
      "Bash(npm test*)",
      "Bash(npm run build*)",
      "Bash(npm run lint*)",
      "Bash(npm run format*)",
      "Bash(npx *)",
      "Bash(node *)",
      "Bash(node --test*)",
      "Bash(python *)",
      "Bash(python3 *)",
      "Bash(pytest *)",
      "Bash(pip install *)",
      "Bash(pip3 install *)",
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
      "Bash(wc *)",
      "Bash(pwd)",
      "Bash(which *)",
      "Bash(type *)",
      "Bash(mkdir *)",
      "Bash(cp *)",
      "Bash(mv *)",
      "Bash(touch *)",
      "Bash(* --version)",
      "Bash(* --help)",
      "Bash(* --help *)"
    ]
  }
}
```

### What this allows and why

| Category | Patterns | Rationale |
|----------|----------|-----------|
| **File editing** | `Write`, `Edit` | Core development workflow. Solo dev reviews the diff in Claude's output. |
| **Git local ops** | `add`, `commit`, `stash`, `checkout`, `switch`, `merge`, `rebase` | All local-only. Nothing touches the remote. |
| **Build/test/lint** | `npm run *`, `npm test`, `node`, `pytest`, `cargo`, `go`, `make`, etc. | Standard dev loop. Build artifacts are local. |
| **Package install** | `pip install`, `npm` via `npx` | Needed for dependency management during development. |
| **Filesystem** | `mkdir`, `cp`, `mv`, `touch` | Common file operations for scaffolding. |

### What still requires approval

| Operation | Why |
|-----------|-----|
| `git push *` | Pushes to remote. You should review what is being pushed and where. |
| `git push --tags*` | Tag pushes can trigger CI/CD pipelines and releases. |
| `npm publish *` | Publishes packages. Irreversible in practice. |
| `npm install *` (bare) | Note: `npm run *` is allowed but bare `npm install` is not listed -- add it explicitly if you want it auto-approved. |
| `docker *` | Container operations can affect system state. |
| `curl *`, `wget *` | Network requests. Could exfiltrate data or download malicious content. |
| `ssh *`, `scp *` | Remote system access. |
| `sudo *` | Privilege escalation. |
| `rm *` (single files) | Simple `rm` is not in the deny list but is also not auto-approved here. Add `Bash(rm *)` to allow if you want. Note: `rm -rf` and `rm -r` remain denied regardless. |
| `chmod *`, `chown *` | Permission changes (except `chmod 777` which is hard-denied). |

### What is blocked (from committed deny list)

All 13 destructive patterns. Cannot be overridden. Even with `git checkout *` allowed, the specific `git checkout -- .` and `git checkout -- *` patterns (which discard all unstaged changes) remain denied because the deny list takes precedence.

### Best agents for this tier

- **builder**: Writes domain logic, runs tests, commits. Maximum benefit -- nearly friction-free development loop.
- **frontend**: Writes components, runs dev server, runs linters. Smooth workflow.
- **qa**: Writes tests, runs test suites, runs linters. Can execute the full test pipeline uninterrupted.
- **data**: Writes migrations, runs scripts. Good productivity boost.
- **devops**: Benefits from build/test auto-approval but will still be prompted for Docker and deployment commands, which is appropriate.

---

## Tier 3: Autonomous

**For:** Experienced developers who understand the risks, working in isolated environments (containers, VMs, disposable branches), or running CI/CD-like automation.

**Philosophy:** Auto-approve nearly everything. Rely on the hard deny list as the safety net. You are trading review friction for speed.

### Configuration

Create `.claude/settings.local.json`:

```json
{
  "permissions": {
    "allow": [
      "Write",
      "Edit",
      "Bash"
    ]
  }
}
```

Yes, that is the entire configuration. `Bash` without a specifier matches all Bash commands. The committed deny list still applies.

### What this allows

Everything except what the deny list blocks. All file writes, all Bash commands, all git operations, all network commands, all package management.

### The non-negotiable deny list

These 13 patterns remain enforced. They cannot be overridden by any allow rule at any scope level. This is your safety net.

| Pattern | Threat |
|---------|--------|
| `rm -rf *` | Recursive forced deletion. Can destroy entire directory trees. |
| `rm -r *` | Recursive deletion. Same risk without force flag. |
| `find * -delete*` | Mass deletion via find. Can target thousands of files. |
| `git push --force*` | Force-push rewrites remote history. Can destroy teammates' work. |
| `git push -f*` | Short form of force-push. Same risk. |
| `git reset --hard*` | Discards all uncommitted changes irreversibly. |
| `git clean -f*` | Deletes untracked files. Cannot be undone. |
| `git checkout -- .` | Discards all unstaged changes in the working tree. |
| `git checkout -- *` | Discards unstaged changes for specific paths. |
| `curl * \| sh*` | Pipe-to-shell. Remote code execution. |
| `curl * \| bash*` | Pipe-to-bash. Remote code execution. |
| `wget * \| sh*` | Pipe-to-shell via wget. Remote code execution. |
| `chmod 777*` | World-writable permissions. Security anti-pattern. |

### Additional deny patterns to consider

If you use Tier 3, consider adding these to your local deny list for defense-in-depth:

```json
{
  "permissions": {
    "allow": [
      "Write",
      "Edit",
      "Bash"
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

These cover: privilege escalation (`sudo`), irreversible publishing (`npm publish`), database destruction (`DROP`), disk destruction (`dd`, `mkfs`), additional force-push variants with remote names (`git push origin -f`), system control (`shutdown`, `reboot`), and secret file access (`.env`, credentials).

### Risk assessment

| Risk | Mitigation |
|------|------------|
| Accidental `git push` to wrong branch | Committed deny blocks force-push; normal push is recoverable via revert. |
| Package install of malicious dep | Low risk in solo context; use lockfiles. |
| Network exfiltration | Accept the risk or add `Bash(curl *)` to deny. |
| Overwriting important files | Git tracks changes; `git diff` before committing. |
| Running destructive DB commands | Add DB-specific deny patterns (see above). |

### Best agents for this tier

All agents run at maximum speed. The primary beneficiaries are:
- **builder**: Zero friction for the full build-test-commit cycle.
- **devops**: Can run Docker, deploy scripts, CI commands without interruption.
- **ml-engineer**: Can install packages, run training scripts, manage GPU resources.
- **data**: Can run migrations, ETL scripts, database operations.

---

## Operations That Should ALWAYS Require Human Confirmation

Regardless of which tier you choose, certain operations warrant a human in the loop. These are not all covered by the committed deny list (which is syntactic pattern matching), so this is a judgment guide:

1. **Pushing to `main`/`master`/`production` branches** -- Even normal push (not force) to protected branches deserves review.
2. **Publishing packages** (`npm publish`, `pip upload`, `cargo publish`) -- Irreversible distribution of code.
3. **Deploying to production** -- Any command that affects live users.
4. **Deleting cloud resources** -- Terraform destroy, AWS resource deletion, etc.
5. **Modifying authentication/authorization** -- Changing who can access what.
6. **Running database migrations on production** -- Schema changes on live data.
7. **Generating or rotating secrets** -- Key material handling.
8. **Modifying CI/CD pipeline definitions** -- Changes that affect what runs automatically.

For Tiers 1 and 2, most of these are already behind approval prompts. For Tier 3, add explicit deny patterns or rely on your CLAUDE.md instructions to flag these for review.

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
2. Create the file:
   - Per-project: `.claude/settings.local.json` in your Archon project
   - Global: `~/.claude/settings.json`
3. Paste the JSON block for your chosen tier.
4. Restart Claude Code or start a new session.
5. Verify with `/permissions` to see the merged rule set.

The committed `.claude/settings.json` deny list is always enforced. Your local settings add allow rules on top. You never need to duplicate the deny list in your local settings (though you can add to it, as shown in the Tier 3 extended deny list).
