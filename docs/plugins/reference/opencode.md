---
summary: "Adds OpenCode model provider support to GrokBot."
read_when:
  - You are installing, configuring, or auditing the opencode plugin
title: "OpenCode plugin"
---

# OpenCode plugin

Adds OpenCode model provider support to GrokBot.

## Distribution

- Package: `@grokbot/opencode-provider`
- Install route: included in GrokBot

## Surface

providers: `opencode`; contracts: `mediaUnderstandingProviders`

<!-- grokbot-plugin-reference:manual-start -->

## Native sessions

GrokBot auto-detects the `opencode` CLI on the Gateway and paired nodes. Stored
sessions then appear in the **OpenCode** sessions-sidebar group, with read-only
transcript browsing through the official `opencode --pure db ... --format json`
and `opencode --pure export` commands. The restricted environment and `--pure`
mode prevent catalog browsing from loading project plugins or inheriting unrelated
Gateway credentials.

Turn **OpenCode Session Catalog** off under **Config > Plugins > OpenCode** to
disable discovery. It is enabled by default.

<!-- grokbot-plugin-reference:manual-end -->

## Related docs

- [opencode](/providers/opencode)
