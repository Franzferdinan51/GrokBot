# GrokBot Rebranding Tracker

Tracking the migration from OpenClaw → GrokBot.
Generated 2026-07-21.

## Status

- [x] Phase 1 — Repo hygiene (identity, leaks) **[in progress]**
  - [x] README.md: OpenClaw Discord invite → `TODO-DISCORD-INVITE` placeholder
  - [ ] Other README badges (grokbot/grokbot org, banner image URLs) — **decision needed**: keep upstream or point at user's fork?
  - [ ] VISION.md + EXTENSION docs (likely still reference upstream concept)
- [ ] Phase 2 — Cosmetic rebrand (strings, docs, comments)
- [ ] Phase 3 — Code identity (package, entrypoint, paths)
- [ ] Phase 4 — Agent harness swap (Pi → Grok Build CLI)
- [ ] Phase 5 — Verify & test

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
