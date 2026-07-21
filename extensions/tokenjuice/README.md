# @grokbot/tokenjuice

Official Tokenjuice output compaction plugin for GrokBot.

Tokenjuice compacts noisy `exec` and `bash` tool results after commands run, before the result is fed back into the active agent session. It does not rewrite commands, rerun commands, or change exit codes.

## Install

```bash
grokbot plugins install @grokbot/tokenjuice
```

Restart the Gateway after installing or updating the plugin.

## Enable

```bash
grokbot config set plugins.entries.tokenjuice.enabled true
```

Equivalent:

```bash
grokbot plugins enable tokenjuice
```

## Docs

- https://docs.grokbot.ai/tools/tokenjuice

## Package

- Plugin id: `tokenjuice`
- Package: `@grokbot/tokenjuice`
- Minimum GrokBot host: `2026.5.28`
