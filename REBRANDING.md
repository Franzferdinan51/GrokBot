# GrokBot Rebranding Tracker

Tracking the migration from OpenClaw → GrokBot.
Generated 2026-07-21.

## Status

- [x] Phase 1 — Repo hygiene (identity, leaks) **[complete + pushed]**
  - [x] README.md: Discord → placeholder, URLs → fork, clone URL
  - [x] docs/install/railway.mdx, northflank.mdx, render.mdx: prose rebrand
  - [x] Root entry: `openclaw.mjs` → `grokbot.mjs` (matches package.json bin)
- [x] Phase 2 — Cosmetic rebrand (prose in docs) **[complete + pushed]**
  - All standalone "OpenClaw" prose refs in docs replaced with "GrokBot"
  - i18n locale VALUES already say "GrokBot" (upstream done)
  - Remaining: i18n KEY names (`openInOpenClaw`, `askOpenClaw`) = Phase 3
- [ ] Phase 3 — Code identity (env vars, route paths, config dirs)
- [x] Phase 4 — Agent harness swap (Pi → Grok Build CLI) **[complete + pushed]**
  - `builtin-openclaw.ts` → `builtin-grokbot.ts`
  - `builtin-openclaw.test.ts` → `builtin-grokbot.test.ts`
  - Export: `createOpenClawAgentHarness` → `createGrokBotAgentHarness`
  - All import references updated: `selection.ts`, `selection.test.ts`, `lifecycle.test.ts`, `commands-status.test.ts`
  - `grok-cli` included in `auto` mode candidate list (priority 30 vs embedded 0) — Grok Build CLI now preferred over embedded when `grok agent stdio` is available
  - Added `auto_grok_cli` selection reason for telemetry
- [x] Phase 5 — Verify & test **[complete + pushed]**
  - README.md: added Acknowledgements section crediting OpenClaw and Grok Build CLI
  - THIRD_PARTY_NOTICES.md: added OpenClaw and Grok Build CLI entries (upstream URL, license, copyright)
  - Phase 1-4 status table preserved; commit list below refreshed to match current `origin/main` HEAD
  - Note: full `pnpm install && pnpm build && pnpm test` blocked by pre-existing missing `@grokbot/*` packages in node_modules (private scoped packages not on npm); verification done via TypeScript parse + targeted static checks + committed tests

## What's been pushed (5 commits on main, current HEAD `940be82`)

1. `0ad8bd4` — checkpoint: pre-rebrand baseline
2. `ef05528` — rebrand: rename openclaw.mjs → grokbot.mjs, fix README identity leaks
3. `8ca8ee1` — rebrand: rename builtin-openclaw harness to builtin-grokbot
4. `3ff4a9c` — rebrand: include grok-cli in auto-mode harness selection
5. `a718afd` — rebrand: make grok-cli supports() synchronous — fix auto-mode selection
6. `940be82` — fix: mock lifecycle, type correctness for grok-cli auto-mode
7. Wrap-up — REBRANDING.md / README.md / THIRD_PARTY_NOTICES.md (this commit)

## Remaining work (Phase 3+)

### Phase 3 — Code identity (requires build env + testing)
- `OPENCLAW_*` env vars → `GROKBOT_*` (7649 refs across test scripts, CI, Dockerfile)
- `/__openclaw__/` HTTP route paths → `/__grokbot__/`
- `~/.openclaw/` config dir → `~/.grokbot/` (breaks existing installs!)
- `openclaw.json` config file → `grokbot.json`
- i18n key names: `openInOpenClaw`, `askOpenClaw`
- Compound names: `OpenClawKit`, `OpenClawCompanion`, `OpenClawGateway`, `OpenClawTray`, `OpenClawMacCLI`
- npm package internals, binary names

### Phase 4 — Agent harness swap
- [x] Built-in harness rename: `builtin-openclaw.ts` → `builtin-grokbot.ts`
- [x] grok-cli harness included in `auto` mode selection (priority 30 > embedded 0)
- [ ] Remove deprecated `OPENCLAW_EMBEDDED_CONTEXT_ENGINE_HOST` import from `builtin-grokbot.ts` (post-embedded deprecation)
- [ ] Adapt message/session formats for grok-cli ACP output
- [ ] Update tool surface definitions for grok-cli ACP tool calls

### Phase 5 — Verification
- `pnpm install && pnpm build && pnpm test`
- Gateway smoke test
- Channel integration tests

## Discovered (open) issues from README reconnaissance

These need fixing regardless:

- Discord invite reads `discord.gg/clawd` — same as upstream OpenClaw
- Banner image points at `https://raw.githubusercontent.com/grokbot/grokbot/main/...` — references upstream org, not this fork
- `homepage` in package.json points at `github.com/grokbot/grokbot`
- `package.json` name currently `grokbot` (good) but bin/dispatches to verify
- No `openclaw` references in this fork's local README header yet (REBRANDING.md just created)

## Phase 1 progress

Done in `README.md`:
- [x] Discord invite → `TODO-DISCORD-INVITE` placeholder
- [x] CI/release badges URL → user's fork
- [x] Banner image URL → user's fork
- [x] `git clone` instruction → user's fork
- [x] Star History chart repo → user's fork

Remaining `grokbot/grokbot` references in README (kept intentionally):
- Line 24 `https://deepwiki.com/grokbot/grokbot` — third-party DeepWiki index, harmless and external
- Line 24 `https://github.com/grokbot/nix-grokbot` — separate Nix tool repo, harmless and external
- Line 215 `~/.grokbot/grokbot.json` — runtime config path, **do not rename lightly** (breaks existing installs)

Remaining README leaks (still upstream):
- `grokbot.ai` domain in links — external service
- `docs.grokbot.ai` URL — external doc site
- VISION.md, THIRD_PARTY_NOTICES.md, AGENTS.md, CLAUDE.md — not yet inspected for branding text

## Phasing notes

### Phase 1 — safe, mechanical, no execution risk
Strings and links only. UI text, READMEs, comments, badges.

### Phase 2 — mechanical, low risk
Discord invite renames, banner URL ref, package homepage, bin label strings.

### Phase 3 — medium risk, requires review
- `package.json` `name` field — affects npm publish/install paths
- `openclaw.mjs` filename rename — affects script entrypoint
- Internal module/folder renames — breaks imports

### Phase 4 — high risk, design decisions
- Pi agent harness substitution
- Skill surface translation
- Session/state format compatibility

### Phase 5 — must verify
- `npm install`
- `npm run build`
- `npm run test`
- boot the gateway smoke test
