# @grokbot/openshell-sandbox

Official NVIDIA OpenShell sandbox backend for GrokBot.

This plugin lets GrokBot use OpenShell-managed sandboxes with mirrored local workspaces and SSH command execution.

## Install

```bash
grokbot plugins install @grokbot/openshell-sandbox
```

Restart the Gateway after installing or updating the plugin.

## Configure

Use the OpenShell docs for credentials, workspace mirroring, runtime selection, and troubleshooting:

- https://docs.grokbot.ai/gateway/openshell

## Package

- Plugin id: `openshell`
- Package: `@grokbot/openshell-sandbox`
- Minimum GrokBot host: `2026.5.12-beta.1`
