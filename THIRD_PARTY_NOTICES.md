# Third-party notices

This file records third-party notices for code or substantial implementation
portions incorporated into GrokBot source, beyond normal package-manager
dependency metadata.

## OpenClaw (upstream fork base)

GrokBot is a downstream fork of [OpenClaw](https://github.com/openclaw/openclaw).
The GrokBot core architecture, plugin SDK, harness selection, and runtime
semantics are inherited from OpenClaw. Adaptations made in this fork are
documented in `REBRANDING.md`.

- Upstream: https://github.com/openclaw/openclaw
- License: MIT
- Copyright: Copyright (c) 2026 OpenClaw Foundation

MIT License

Copyright (c) 2026 OpenClaw Foundation

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

## Grok Build CLI (harness backend)

GrokBot's harness layer invokes the [Grok Build CLI](https://github.com/xai-org/grok-build)
headless agent CLI as the primary model runtime when available. The Grok CLI
harness (`src/agents/harness/builtin-grok-cli.ts`) spawns `grok agent stdio`
and exchanges JSON-RPC 2.0 / ACP (Agent Client Protocol) messages for
session lifecycle, tool calls, and streaming updates. This replaces the
upstream Pi / pi-mono harness that OpenClaw originally shipped.

- Upstream: https://github.com/xai-org/grok-build
- Package family: `grok` CLI binary (distributed separately)
- License: Apache-2.0
- Copyright: Copyright 2023-2026 SpaceXAI

## Pi / pi-mono (TUI rendering only)

The Pi / pi-mono **agent harness** has been entirely replaced by the
[Grok Build CLI](https://github.com/xai-org/grok-build) — see the
"Grok Build CLI" section above. The only remaining Pi / pi-mono surface in
GrokBot is the `@earendil-works/pi-tui` **terminal UI rendering library**
(used by the local TUI and session tool renderers). This is a separate
component from the agent harness replacement and is intentionally retained
as a third-party dependency; internalizing it would be a separate vendoring
effort documented in `docs/agent-runtime-architecture.md`.

- Upstream: https://github.com/earendil-works/pi-mono
- Package family: `@earendil-works/pi-tui` (only; no `pi-agent-core`, `pi-ai`,
  or other Pi agent SDKs)
- License: MIT
- Copyright: Copyright (c) 2025 Mario Zechner

MIT License

Copyright (c) 2025 Mario Zechner

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
