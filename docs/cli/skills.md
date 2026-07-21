---
summary: "CLI reference for `grokbot skills` (search/install/update/verify/list/info/check/workshop)"
read_when:
  - You want to see which skills are available and ready to run
  - You want to search ClawHub or install skills from ClawHub, Git, or local directories
  - You want to verify a ClawHub skill with ClawHub
  - You want to debug missing binaries/env/config for skills
title: "Skills"
---

# `grokbot skills`

Inspect local skills, search ClawHub, install skills from ClawHub/Git/local
directories, verify ClawHub skills, and update ClawHub-tracked installs.

Related:

- Skills system: [Skills](/tools/skills)
- Skill Workshop: [Skill Workshop](/tools/skill-workshop)
- Skills config: [Skills config](/tools/skills-config)
- ClawHub installs: [ClawHub](/clawhub/cli)

## Commands

```bash
grokbot skills search "calendar"
grokbot skills search --limit 20 --json
grokbot skills install @owner/<slug>
grokbot skills install @owner/<slug> --version <version>
grokbot skills install git:owner/repo
grokbot skills install git:owner/repo@main
grokbot skills install ./path/to/skill --as custom-name
grokbot skills install @owner/<slug> --force
grokbot skills install @owner/<slug> --force-install
grokbot skills install @owner/<slug> --acknowledge-clawhub-risk
grokbot skills install @owner/<slug> --agent <id>
grokbot skills install @owner/<slug> --global
grokbot skills update @owner/<slug>
grokbot skills update @owner/<slug> --force-install
grokbot skills update @owner/<slug> --acknowledge-clawhub-risk
grokbot skills update @owner/<slug> --global
grokbot skills update --all
grokbot skills update --all --agent <id>
grokbot skills update --all --global
grokbot skills verify @owner/<slug>
grokbot skills verify @owner/<slug> --version <version>
grokbot skills verify @owner/<slug> --tag <tag>
grokbot skills verify @owner/<slug> --card
grokbot skills verify @owner/<slug> --global
grokbot skills list
grokbot skills list --eligible
grokbot skills list --json
grokbot skills list --verbose
grokbot skills list --agent <id>
grokbot skills info <name>
grokbot skills info <name> --json
grokbot skills info <name> --agent <id>
grokbot skills check
grokbot skills check --agent <id>
grokbot skills check --json
grokbot skills workshop propose-create --name "qa-check" --description "QA checklist" --proposal ./PROPOSAL.md
grokbot skills workshop propose-update qa-check --proposal ./PROPOSAL.md
grokbot skills workshop list
grokbot skills workshop inspect <proposal-id>
grokbot skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
grokbot skills workshop apply <proposal-id>
grokbot skills workshop reject <proposal-id> --reason "Not reusable"
grokbot skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`search`, `update`, and `verify` use ClawHub directly. `install @owner/<slug>`
installs a ClawHub skill, `install git:owner/repo[@ref]` clones a Git skill,
and `install ./path` copies a local skill directory. By default, `install`,
`update`, and `verify` target the active workspace `skills/` directory; with
`--global`, they target the shared managed skills directory. `list`/`info`/`check`
still inspect the local skills visible to the current workspace and config.
Workspace-backed commands resolve the target workspace from `--agent <id>`,
then the current working directory when it is inside a configured agent
workspace, then the default agent.

Git and local directory installs expect `SKILL.md` at the source root. The
install slug comes from `SKILL.md` frontmatter `name` when it is valid, then
the source directory or repository name; use `--as <slug>` to override it.
`--version` is ClawHub-only. Skill installs do not support npm package specs
or zip/archive paths, and `grokbot skills update` updates ClawHub-tracked
installs only.

Gateway-backed skill dependency installs triggered from onboarding or Skills
settings use the separate `skills.install` request path instead.

Notes:

| Flag/behavior                    | Description                                                                                                                                                                                                                                                                       |
| -------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `search [query...]`              | Optional query; omit it to browse the default ClawHub search feed.                                                                                                                                                                                                                |
| `search --limit <n>`             | Caps returned results.                                                                                                                                                                                                                                                            |
| `install git:owner/repo[@ref]`   | Installs a Git skill. Branch refs may contain slashes, such as `git:owner/repo@feature/foo`.                                                                                                                                                                                      |
| `install ./path/to/skill`        | Installs a local directory whose root contains `SKILL.md`.                                                                                                                                                                                                                        |
| `install --as <slug>`            | Overrides the inferred slug for Git and local directory installs.                                                                                                                                                                                                                 |
| `install --version <version>`    | Applies only to ClawHub skill refs.                                                                                                                                                                                                                                               |
| `install --force`                | Overwrites an existing workspace skill folder for the same slug.                                                                                                                                                                                                                  |
| `install/update --force-install` | Installs a pending GitHub-backed ClawHub skill before ClawHub's scan completes.                                                                                                                                                                                                   |
| `--global`                       | Targets the shared managed skills directory; cannot combine with `--agent <id>`.                                                                                                                                                                                                  |
| `--agent <id>`                   | Targets one configured agent workspace; overrides current working directory inference.                                                                                                                                                                                            |
| `update @owner/<slug>`           | Updates a single tracked skill. Add `--global` to target the shared managed skills directory instead of the workspace.                                                                                                                                                            |
| `update --all`                   | Updates tracked ClawHub installs in the selected workspace, or the shared managed skills directory with `--global`.                                                                                                                                                               |
| `verify @owner/<slug>`           | Prints ClawHub's `clawhub.skill.verify.v1` JSON envelope by default. There is no `--json` flag because JSON is already the default. Bare slugs are accepted for compatibility when the skill is already installed or unambiguous; owner-qualified refs avoid publisher ambiguity. |
| `verify` provenance              | When ClawHub returns server-resolved source provenance, verify JSON also includes a commit-pinned `grokbot.verifiedSourceUrl`. Unavailable or self-declared source URLs stay only in the raw provenance envelope and are not promoted.                                           |
| `verify` version selector        | `verify` uses `.clawhub/origin.json` for installed ClawHub skills, so it verifies the installed version against the registry it came from. `--version` and `--tag` override the version selector but keep that installed registry when origin metadata exists.                    |
| `verify --card`                  | Prints the generated Skill Card Markdown instead of JSON. Exits non-zero when ClawHub returns `ok: false` or `decision: "fail"`; unsigned signatures are informational unless ClawHub policy changes.                                                                             |
| Skill Card fingerprint           | Installed ClawHub bundles can include a generated `skill-card.md`. GrokBot treats verification as a ClawHub server decision and does not reject an installed skill just because that generated card changes the bundle fingerprint.                                              |
| `check --agent <id>`             | Checks the selected agent's workspace and reports which ready skills are actually visible to that agent's prompt or command surface.                                                                                                                                              |
| `list`                           | Default action when no subcommand is provided.                                                                                                                                                                                                                                    |
| `list`/`info`/`check` output     | Rendered output goes to stdout. With `--json`, the machine-readable payload stays on stdout for pipes and scripts.                                                                                                                                                                |

Community ClawHub skill installs and updates check trust before downloading.
Versioned community archive releases use exact-release trust metadata.
Resolver-backed GitHub skills rely on ClawHub's install resolver to enforce
scan and force-install policy before it returns a pinned commit; use
`--force-install` to install a pending GitHub-backed skill before that scan
completes. Malicious or blocked community releases are refused. Risky
community releases require review and `--acknowledge-clawhub-risk` when a
non-interactive command should continue after that review. Official ClawHub
skill publishers and bundled GrokBot skill sources bypass this release-trust
prompt.

## Skill Workshop

`grokbot skills workshop` manages pending skill proposals in the selected
workspace. Proposals are not active skills until applied. For proposal
storage, support-file safeguards, Gateway methods, and approval policy, see
[Skill Workshop](/tools/skill-workshop).

```bash
grokbot skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal ./PROPOSAL.md
grokbot skills workshop propose-create \
  --name "qa-check" \
  --description "Repeatable QA checklist" \
  --proposal-dir ./qa-check-proposal
grokbot skills workshop propose-update qa-check --proposal ./PROPOSAL.md
grokbot skills workshop list
grokbot skills workshop inspect <proposal-id>
grokbot skills workshop revise <proposal-id> --proposal ./PROPOSAL.md
grokbot skills workshop apply <proposal-id>
grokbot skills workshop reject <proposal-id> --reason "Duplicate"
grokbot skills workshop quarantine <proposal-id> --reason "Needs security review"
```

`propose-create`, `propose-update`, and `revise` also accept `--goal <text>`
and `--evidence <text>` to record the proposal's motivation and supporting
notes alongside the `--proposal`/`--proposal-dir` content.

## Related

- [CLI reference](/cli)
- [Skills](/tools/skills)
