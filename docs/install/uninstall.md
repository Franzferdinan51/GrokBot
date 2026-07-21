---
summary: "Uninstall GrokBot completely (CLI, service, state, workspace)"
read_when:
  - You want to remove GrokBot from a machine
  - The gateway service is still running after uninstall
title: "Uninstall"
---

Two paths:

- **Easy path** if `grokbot` is still installed.
- **Manual service removal** if the CLI is gone but the service is still running.

## Easy path (CLI still installed)

Recommended: use the built-in uninstaller:

```bash
grokbot uninstall
```

State removal preserves configured workspace directories unless you also select `--workspace`.

Preview what will be removed (safe):

```bash
grokbot uninstall --dry-run --all
```

Non-interactive (automation / npx). Use with caution and only after confirming scopes:

```bash
grokbot uninstall --all --yes --non-interactive
npx -y grokbot uninstall --all --yes --non-interactive
```

Flags: `--service`, `--state`, `--workspace`, `--app` select individual scopes; `--all` selects all four.

Manual steps (same result):

1. Stop the gateway service:

```bash
grokbot gateway stop
```

2. Uninstall the gateway service (launchd/systemd/schtasks):

```bash
grokbot gateway uninstall
```

3. Delete state + config:

```bash
rm -rf "${OPENCLAW_STATE_DIR:-$HOME/.grokbot}"
```

If you set `OPENCLAW_CONFIG_PATH` to a custom location outside the state dir, delete that file too.
If you want to keep a workspace inside the state dir, such as `~/.grokbot/workspace`, move it aside before running `rm -rf` or delete state contents selectively.

4. Delete your workspace (optional, removes agent files):

```bash
rm -rf ~/.grokbot/workspace
```

5. Remove the CLI install (pick the one you used):

```bash
npm rm -g grokbot
pnpm remove -g grokbot
bun remove -g grokbot
```

6. If you installed the macOS app:

```bash
rm -rf /Applications/GrokBot.app
```

Notes:

- If you used profiles (`--profile` / `OPENCLAW_PROFILE`), repeat step 3 for each state dir (defaults are `~/.grokbot-<profile>`).
- In remote mode, the state dir lives on the **gateway host**, so run steps 1-4 there too.

## Manual service removal (CLI not installed)

Use this if the gateway service keeps running but `grokbot` is missing.

### macOS (launchd)

Default label is `ai.grokbot.gateway` (or `ai.grokbot.<profile>` with a profile):

```bash
launchctl bootout gui/$UID/ai.grokbot.gateway
rm -f ~/Library/LaunchAgents/ai.grokbot.gateway.plist
```

If you used a profile, replace the label and plist name with `ai.grokbot.<profile>`.

### Linux (systemd user unit)

Default unit name is `grokbot-gateway.service` (or `grokbot-gateway-<profile>.service`). A pre-rename `clawdbot-gateway.service` unit may still exist on machines upgraded from very old installs; `grokbot uninstall` / `grokbot gateway uninstall` detects and removes it automatically.

```bash
systemctl --user disable --now grokbot-gateway.service
rm -f ~/.config/systemd/user/grokbot-gateway.service
systemctl --user daemon-reload
```

### Windows (Scheduled Task)

Default task name is `GrokBot Gateway` (or `GrokBot Gateway (<profile>)`).
The task launches a windowless `gateway.vbs` script under your state dir, which in turn
runs `gateway.cmd`; remove both.

```powershell
schtasks /Delete /F /TN "GrokBot Gateway"
Remove-Item -Force "$env:USERPROFILE\.grokbot\gateway.cmd" -ErrorAction SilentlyContinue
Remove-Item -Force "$env:USERPROFILE\.grokbot\gateway.vbs" -ErrorAction SilentlyContinue
```

If you used a profile, delete the matching task name and the `gateway.cmd` /
`gateway.vbs` files under `~\.grokbot-<profile>`.

## Normal install vs source checkout

### Normal install (install.sh / npm / pnpm / bun)

If you used `https://grokbot.ai/install.sh` or `install.ps1`, the CLI was installed with `npm install -g grokbot@latest`.
Remove it with `npm rm -g grokbot` (or `pnpm remove -g` / `bun remove -g` if you installed that way).

### Source checkout (git clone)

If you run from a repo checkout (`git clone` + `grokbot ...` / `bun run grokbot ...`):

1. Uninstall the gateway service **before** deleting the repo (use the easy path above or manual service removal).
2. Delete the repo directory.
3. Remove state + workspace as shown above.

## Related

- [Install overview](/install)
- [Migration guide](/install/migrating)
