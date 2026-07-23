# GrokBot — Personal AI Assistant

<p align="center">
    <picture>
        <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/Franzferdinan51/GrokBot/main/docs/assets/grokbot-banner-light.png">
        <img src="https://raw.githubusercontent.com/Franzferdinan51/GrokBot/main/docs/assets/grokbot-banner-dark.png" alt="GrokBot — Your personal AI assistant, running on your own devices.">
    </picture>
</p>

<p align="center">
  <a href="https://github.com/Franzferdinan51/GrokBot/actions/workflows/ci.yml?branch=main"><img src="https://img.shields.io/github/actions/workflow/status/Franzferdinan51/GrokBot/ci.yml?branch=main&style=for-the-badge" alt="CI status"></a>
  <a href="https://github.com/Franzferdinan51/GrokBot/releases"><img src="https://img.shields.io/github/v/release/Franzferdinan51/GrokBot?include_prereleases&style=for-the-badge" alt="GitHub release"></a>
  <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge" alt="MIT License"></a>
  <a href="https://github.com/xai-org/grok-build"><img src="https://img.shields.io/badge/harness-Grok%20Build%20CLI-D4A017?style=for-the-badge" alt="Harness: Grok Build CLI"></a>
</p>

**GrokBot** is a self-hosted AI gateway that connects messaging channels to AI model providers. It runs locally on your machine (macOS, Linux, Windows via WSL2), speaks to your configured models via their APIs, and delivers responses back through your connected channels — WhatsApp, Telegram, Slack, Discord, Google Chat, Signal, iMessage, IRC, Microsoft Teams, Matrix, Feishu, LINE, Mattermost, Nextcloud Talk, Nostr, Synology Chat, Tlon, Twitch, Zalo, WeChat, QQ, WebChat, plus macOS / iOS / Android voice and canvas surfaces.

## Install

Runtime: **Node 24.15+ (recommended), Node 22.22.3+, or Node 25.9+**.

```bash
npm install -g grokbot@latest
# or: pnpm add -g grokbot@latest

grokbot onboard --install-daemon
```

`grokbot onboard` installs the Gateway daemon (launchd / systemd user service) so it stays running. Works on macOS, Linux, and Windows (WSL2).

## Quick start

```bash
# Daemon mode (recommended for everyday use)
grokbot onboard --install-daemon
grokbot gateway status

# Foreground / debug mode
grokbot gateway stop
grokbot gateway --port 18789 --verbose

# Send a test message
grokbot message send --target +1234567890 --message "Hello from GrokBot"

# Talk to the assistant
grokbot agent --message "Ship checklist" --thinking high
```

Upgrading? See the [Updating guide](https://docs.grokbot.ai/install/updating) and run `grokbot doctor` after upgrade.

## Harness

GrokBot uses the [Grok Build CLI](https://github.com/xai-org/grok-build) (`grok agent stdio`) as its primary agent harness — an actively maintained xAI product with first-class tool-call streaming and OAuth support.

The harness is selected via `runtimePolicy` in your config:

```json5
{
  agent: {
    model: "<provider>/<model-id>",
    runtime: "auto"   // or "grok-cli" (force Grok Build CLI), or "grokbot" (embedded fallback)
  }
}
```

| Runtime | Harness | Use it when |
|---------|---------|-------------|
| `auto` (default) | Grok Build CLI if installed, else embedded | Everyday use |
| `grok-cli` | Forces Grok Build CLI | You want strict xAI-only sessions |
| `grokbot` | Forces embedded | Zero external dependencies |

### Installing Grok Build CLI

```bash
# macOS / Linux
curl -fsSL https://x.ai/cli/install.sh | bash

# Or grab a release binary from
# https://github.com/xai-org/grok-build/releases
```

Verify with `grok agent --version` and `which grok`.

## Channels

GrokBot connects to these surfaces out of the box:

**Messaging:** WhatsApp · Telegram · Slack · Discord · Google Chat · Signal · iMessage · IRC · Microsoft Teams · Matrix · Feishu · LINE · Mattermost · Nextcloud Talk · Nostr · Synology Chat · Tlon · Twitch · Zalo · WeChat · QQ · WebChat.

**Voice / canvas:** Voice Wake + Talk Mode on macOS / iOS / Android, Live Canvas on macOS with A2UI support.

Channel setup guides: <https://docs.grokbot.ai/channels>.

## Security defaults

GrokBot connects to real messaging surfaces. Treat inbound DMs as **untrusted input**.

- **DM pairing** (`dmPolicy="pairing"`): unknown senders receive a short pairing code and the bot does not process their message until approved.
- Approve with: `grokbot pairing approve <channel> <code>`.
- Open DMs require an explicit opt-in: `dmPolicy="open"` plus `"*"` in `allowFrom`.

Security guide: <https://docs.grokbot.ai/gateway/security>. Run `grokbot doctor` to surface risky DM policies.

## Highlights

- **Local-first Gateway** — single control plane for sessions, channels, tools, and events.
- **Multi-channel inbox** — all messaging channels listed above, plus macOS / iOS / Android voice and canvas.
- **Multi-agent routing** — isolate agents by workspace and route channels/accounts/peers per agent.
- **Voice Wake + Talk Mode** — wake words on macOS / iOS and continuous voice on Android.
- **Live Canvas** — agent-driven visual workspace with A2UI support.
- **First-class tools** — browser, canvas, nodes, cron, sessions, Discord/Slack actions.
- **Companion apps** — Windows Hub, macOS menu bar, iOS / Android nodes.
- **Onboarding + skills** — guided setup with bundled and workspace skills.

## Security model

- Default: tools run on the host for the `main` session.
- Group / channel safety: set `agents.defaults.sandbox.mode: "non-main"` to run non-`main` sessions inside sandboxes. Docker is the default backend; SSH and OpenShell are also available.
- Before exposing anything remotely, read the [Security](https://docs.grokbot.ai/gateway/security), [Exposure runbook](https://docs.grokbot.ai/gateway/security/exposure-runbook), and [Sandboxing](https://docs.grokbot.ai/gateway/sandboxing) guides.

## Operator quick refs

- Chat commands: `/status`, `/new`, `/reset`, `/compact`, `/think <level>`, `/verbose on|off`, `/trace on|off`, `/usage off|tokens|full`, `/restart`, `/activation mention|always`
- Session tools: `sessions_list`, `sessions_history`, `sessions_send`
- Architecture overview: [Architecture](https://docs.grokbot.ai/concepts/architecture)

## Docs by goal

- **New here:** [Getting started](https://docs.grokbot.ai/start/getting-started), [Onboarding](https://docs.grokbot.ai/start/wizard), [Updating](https://docs.grokbot.ai/install/updating)
- **Channel setup:** [Channels index](https://docs.grokbot.ai/channels), [WhatsApp](https://docs.grokbot.ai/channels/whatsapp), [Telegram](https://docs.grokbot.ai/channels/telegram), [Discord](https://docs.grokbot.ai/channels/discord), [Slack](https://docs.grokbot.ai/channels/slack)
- **Apps + nodes:** [Windows Hub](https://docs.grokbot.ai/platforms/windows), [macOS](https://docs.grokbot.ai/platforms/macos), [iOS](https://docs.grokbot.ai/platforms/ios), [Android](https://docs.grokbot.ai/platforms/android), [Nodes](https://docs.grokbot.ai/nodes)
- **Config + security:** [Configuration](https://docs.grokbot.ai/gateway/configuration), [Security](https://docs.grokbot.ai/gateway/security), [Exposure runbook](https://docs.grokbot.ai/gateway/security/exposure-runbook), [Sandboxing](https://docs.grokbot.ai/gateway/sandboxing)
- **Remote + web:** [Gateway](https://docs.grokbot.ai/gateway), [Remote access](https://docs.grokbot.ai/gateway/remote), [Tailscale](https://docs.grokbot.ai/gateway/tailscale), [Web surfaces](https://docs.grokbot.ai/web)
- **Tools + automation:** [Tools](https://docs.grokbot.ai/tools), [Skills](https://docs.grokbot.ai/tools/skills), [Cron jobs](https://docs.grokbot.ai/automation/cron-jobs), [Webhooks](https://docs.grokbot.ai/automation/webhook), [Gmail Pub/Sub](https://docs.grokbot.ai/automation/gmail-pubsub)
- **Internals:** [Architecture](https://docs.grokbot.ai/concepts/architecture), [Agent](https://docs.grokbot.ai/concepts/agent), [Session model](https://docs.grokbot.ai/concepts/session), [Gateway protocol](https://docs.grokbot.ai/reference/rpc)
- **Troubleshooting:** [Channel troubleshooting](https://docs.grokbot.ai/channels/troubleshooting), [Logging](https://docs.grokbot.ai/logging), [Docs home](https://docs.grokbot.ai)

## Apps (optional)

All apps are optional and add extra features on top of the Gateway.

### macOS — GrokBot.app (optional)

- Menu bar control for the Gateway and health.
- Voice Wake + push-to-talk overlay.
- WebChat + debug tools.
- Remote gateway control over SSH.

Signed builds required for macOS permissions to stick across rebuilds (see [macOS Permissions](https://docs.grokbot.ai/platforms/mac/permissions)).

### iOS node (optional)

- Pairs as a node over the Gateway WebSocket.
- Voice trigger forwarding + Canvas surface.
- Controlled via `grokbot nodes …`.

Runbook: [iOS connect](https://docs.grokbot.ai/platforms/ios).

### Android node (optional)

- Pairs as a WS node via device pairing.
- Exposes Connect / Chat / Voice tabs plus Canvas, Camera, Screen capture, and device command families.

Runbook: [Android connect](https://docs.grokbot.ai/platforms/android).

### Windows Hub (optional)

- Native Windows companion for setup, tray status, chat, node mode, and local MCP mode.

## From source (development)

Use `pnpm` for source checkouts. The repository is a pnpm workspace with bundled plugins loading from `extensions/*` during development.

```bash
git clone https://github.com/Franzferdinan51/GrokBot.git
cd GrokBot

pnpm install

# First run only
pnpm grokbot setup

# Optional: prebuild Control UI
pnpm ui:build

# Dev loop (auto-reload on source/config changes)
pnpm gateway:watch
```

To build a `dist/` for packaging or release validation:

```bash
pnpm build
pnpm ui:build
```

`pnpm grokbot setup` writes the local config/workspace needed for `grokbot gateway:watch`.

## Development channels

- **stable**: tagged releases (`vYYYY.M.D` or `vYYYY.M.D-<patch>`), npm dist-tag `latest`.
- **beta**: prerelease tags (`vYYYY.M.D-beta.N`), npm dist-tag `beta`.
- **dev**: moving head of `main`, npm dist-tag `dev` (when published).

Switch channels: `grokbot update --channel stable|beta|dev`.

Details: [Development channels](https://docs.grokbot.ai/install/development-channels).

## Agent workspace + skills

- Workspace root: `~/.grokbot/workspace` (configurable via `agents.defaults.workspace`).
- Injected prompt files: `AGENTS.md`, `SOUL.md`, `TOOLS.md`.
- Skills: `~/.grokbot/workspace/skills/<skill>/SKILL.md`.

## Configuration

Minimal `~/.grokbot/grokbot.json`:

```json5
{
  agent: {
    model: "<provider>/<model-id>",
    runtime: "auto"
  }
}
```

[Full configuration reference](https://docs.grokbot.ai/gateway/configuration).

## Acknowledgements

- **[Grok Build CLI](https://github.com/xai-org/grok-build)** — the agent harness that powers GrokBot. Runs headless agent sessions via the ACP (Agent Client Protocol) JSON-RPC 2.0 transport. Licensed Apache-2.0; Copyright 2023-2026 SpaceXAI.
- **[@earendil-works/pi-tui](https://github.com/earendil-works/pi-mono)** by Mario Zechner (MIT) — used only by the terminal UI rendering path.

GrokBot is released under the **MIT License** (Copyright (c) 2026). See [LICENSE](LICENSE) and `THIRD_PARTY_NOTICES.md` for full license texts.

## License

MIT License. See [LICENSE](LICENSE).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines. Use the [issue chooser](https://github.com/Franzferdinan51/GrokBot/issues/new/choose) for bugs and feature requests. Report vulnerabilities through [SECURITY.md](SECURITY.md).
