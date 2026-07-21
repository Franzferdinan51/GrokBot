// Agent Workspace script supports GrokBot repository automation.
export function posixAgentWorkspaceScript(purpose: string): string {
  return `set -eu
workspace="\${OPENCLAW_WORKSPACE_DIR:-$HOME/.grokbot/workspace}"
mkdir -p "$workspace/.grokbot"
cat > "$workspace/IDENTITY.md" <<'IDENTITY_EOF'
# Identity

- Name: GrokBot
- Purpose: ${purpose}
IDENTITY_EOF
rm -f "$workspace/BOOTSTRAP.md"`;
}

export function windowsAgentWorkspaceScript(purpose: string): string {
  return `$workspace = $env:OPENCLAW_WORKSPACE_DIR
if (-not $workspace) { $workspace = Join-Path $env:USERPROFILE '.grokbot\\workspace' }
$stateDir = Join-Path $workspace '.grokbot'
New-Item -ItemType Directory -Path $stateDir -Force | Out-Null
@'
# Identity

- Name: GrokBot
- Purpose: ${purpose}
'@ | Set-Content -Path (Join-Path $workspace 'IDENTITY.md') -Encoding UTF8
Remove-Item (Join-Path $workspace 'BOOTSTRAP.md') -Force -ErrorAction SilentlyContinue`;
}
