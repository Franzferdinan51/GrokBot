# @grokbot/acpx

Official ACP runtime backend for GrokBot.

ACPx lets GrokBot run external coding harnesses through the Agent Client Protocol while GrokBot still owns sessions, channels, delivery, permissions, and Gateway state.

## Install

```bash
grokbot plugins install @grokbot/acpx
```

Restart the Gateway after installing or updating the plugin.

## What it provides

- ACP-backed agent runtime sessions.
- Plugin-owned session and transport management.
- MCP bridge helpers for GrokBot tools and plugin tools.
- Static runtime assets used by the ACP process bridge.

## Configure

Use the ACP docs for harness-specific setup, permission modes, and model/runtime selection:

- https://docs.grokbot.ai/tools/acp-agents-setup
- https://docs.grokbot.ai/tools/acp-agents

## Package

- Plugin id: `acpx`
- Package: `@grokbot/acpx`
- Minimum GrokBot host: `2026.4.25`
