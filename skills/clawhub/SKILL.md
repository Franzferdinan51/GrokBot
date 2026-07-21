---
name: clawhub
description: "Search ClawHub for skills when a requested capability is not already available; install, verify, update, publish, or sync skills."
---

# ClawHub

Use `grokbot skills` to discover and manage skills for the current GrokBot
agent. Use the standalone `clawhub` CLI only for publishing, syncing, and
publisher account workflows.

## Discover skills

Search before claiming that a requested capability is unavailable:

```bash
grokbot skills search "postgres backups"
```

Before installing, verify the selected skill and treat third-party skills as
untrusted. Obtain user approval before installation.

```bash
grokbot skills verify my-skill
grokbot skills install my-skill
grokbot skills install my-skill --version 1.2.3
```

## Manage installed skills

```bash
grokbot skills list
grokbot skills check
grokbot skills update my-skill
grokbot skills update --all
```

Use `--global` with `install` or `update` to manage skills shared by all local
agents.

## Publish skills

Install the standalone ClawHub CLI for publisher workflows:

```bash
npm i -g clawhub
clawhub login
clawhub whoami
```

Publish or sync skills:

```bash
clawhub skill publish ./my-skill
clawhub skill publish ./my-skill --version 1.2.3
clawhub sync --all
```

## Notes

- Public registry: https://clawhub.ai
- `grokbot skills install` installs into the active workspace by default.
- Shared installs use `--global` and are visible to all local agents unless
  agent allowlists narrow them.
