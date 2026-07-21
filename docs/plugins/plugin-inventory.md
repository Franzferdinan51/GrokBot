---
summary: "Generated inventory of GrokBot plugins shipped in core, published externally, or kept source-only"
read_when:
  - You are deciding whether a plugin ships in the core npm package or installs separately
  - You are updating bundled plugin package metadata or release automation
  - You need the canonical internal vs external plugin list
title: "Plugin inventory"
---

# Plugin inventory

This page is generated from `extensions/*/package.json`, `grokbot.plugin.json`,
and the root npm package `files` exclusions. Regenerate it with:

```bash
pnpm plugins:inventory:gen
```

## Definitions

- **Core npm package:** built into the `grokbot` npm package and available without a separate plugin install.
- **Official external package:** GrokBot-maintained plugin omitted from the core npm package, kept in this official inventory, and installed on demand through ClawHub and/or npm.
- **Source checkout only:** repo-local plugin omitted from published npm artifacts and not advertised as an installable package.

Source checkouts are different from npm installs: after `pnpm install`, bundled
plugins load from `extensions/<id>` so local edits and package-local workspace
dependencies are available.

## Install a plugin

Use the install route in each entry to decide whether install is needed. Plugins
that say `included in GrokBot` are already present in the core package.
Official external packages need one install, then a Gateway restart.

For example, Discord is an official external package:

```bash
grokbot plugins install @grokbot/discord
grokbot gateway restart
grokbot plugins inspect discord --runtime --json
```

During the launch cutover, ordinary bare package specs still install from npm.
Use `clawhub:@grokbot/discord` or `npm:@grokbot/discord` when you need an
explicit source. After install, follow the plugin's setup doc, such as
[Discord](/channels/discord), to add credentials and channel config. See
[Manage plugins](/plugins/manage-plugins) for update, uninstall, and publishing
commands.

Each entry lists the package, distribution route, and description.

## Core npm package

69 plugins

- **[admin-http-rpc](/plugins/reference/admin-http-rpc)** (`@grokbot/admin-http-rpc`) - included in GrokBot. GrokBot admin HTTP RPC endpoint.

- **[alibaba](/plugins/reference/alibaba)** (`@grokbot/alibaba-provider`) - included in GrokBot. Adds video generation provider support.

- **[anthropic](/plugins/reference/anthropic)** (`@grokbot/anthropic-provider`) - included in GrokBot. Anthropic models, Claude CLI, and native Claude session catalog.

- **[azure-speech](/plugins/reference/azure-speech)** (`@grokbot/azure-speech`) - included in GrokBot. Azure AI Speech text-to-speech (MP3, native Ogg/Opus voice notes, PCM telephony).

- **[bonjour](/plugins/reference/bonjour)** (`@grokbot/bonjour`) - included in GrokBot. Advertise the local GrokBot gateway over Bonjour/mDNS.

- **[browser](/plugins/reference/browser)** (`@grokbot/browser-plugin`) - included in GrokBot. Adds agent-callable tools.

- **[byteplus](/plugins/reference/byteplus)** (`@grokbot/byteplus-provider`) - included in GrokBot. Adds BytePlus, BytePlus Plan model provider support to GrokBot.

- **[canvas](/plugins/reference/canvas)** (`@grokbot/canvas-plugin`) - included in GrokBot. Experimental Canvas control and A2UI rendering surfaces for paired nodes.

- **[clawrouter](/plugins/reference/clawrouter)** (`@grokbot/clawrouter`) - included in GrokBot. Adds ClawRouter model provider support to GrokBot.

- **[cohere](/plugins/reference/cohere)** (`@grokbot/cohere-provider`) - included in GrokBot; npm; ClawHub: `clawhub:@grokbot/cohere-provider`. GrokBot Cohere provider plugin.

- **[comfy](/plugins/reference/comfy)** (`@grokbot/comfy-provider`) - included in GrokBot. Adds ComfyUI model provider support to GrokBot.

- **[copilot-proxy](/plugins/reference/copilot-proxy)** (`@grokbot/copilot-proxy`) - included in GrokBot. Adds Copilot Proxy model provider support to GrokBot.

- **[crabbox](/plugins/reference/crabbox)** (`@grokbot/crabbox-provider`) - included in GrokBot. Cloud worker provider backed by the Crabbox CLI.

- **[deepgram](/plugins/reference/deepgram)** (`@grokbot/deepgram-provider`) - included in GrokBot. Adds media understanding provider support. Adds realtime transcription provider support.

- **[document-extract](/plugins/reference/document-extract)** (`@grokbot/document-extract-plugin`) - included in GrokBot. Extract text and fallback page images from local document attachments.

- **[duckduckgo](/plugins/reference/duckduckgo)** (`@grokbot/duckduckgo-plugin`) - included in GrokBot. Adds web search provider support.

- **[elevenlabs](/plugins/reference/elevenlabs)** (`@grokbot/elevenlabs-speech`) - included in GrokBot. Adds media understanding provider support. Adds realtime transcription provider support. Adds text-to-speech provider support.

- **[fal](/plugins/reference/fal)** (`@grokbot/fal-provider`) - included in GrokBot. Adds fal model provider support to GrokBot.

- **[file-transfer](/plugins/reference/file-transfer)** (`@grokbot/file-transfer`) - included in GrokBot. Fetch, list, and write files on paired nodes via dedicated node commands. Bypasses bash stdout truncation by using base64 over node.invoke for binaries up to 16 MB.

- **[github-copilot](/plugins/reference/github-copilot)** (`@grokbot/github-copilot-provider`) - included in GrokBot. Adds GitHub Copilot model provider support to GrokBot.

- **[google](/plugins/reference/google)** (`@grokbot/google-plugin`) - included in GrokBot. Adds Google, Google Gemini CLI, Google Vertex model provider support to GrokBot.

- **[huggingface](/plugins/reference/huggingface)** (`@grokbot/huggingface-provider`) - included in GrokBot. Adds Hugging Face model provider support to GrokBot.

- **[imessage](/plugins/reference/imessage)** (`@grokbot/imessage`) - included in GrokBot. Adds the iMessage channel surface for sending and receiving GrokBot messages.

- **[linux-canvas](/plugins/reference/linux-canvas)** (`@grokbot/linux-canvas`) - included in GrokBot. Canvas rendering bridge for the GrokBot Linux desktop app.

- **[linux-node](/plugins/reference/linux-node)** (`@grokbot/linux-node`) - included in GrokBot. Desktop notifications, camera capture, and location for Linux node hosts.

- **[litellm](/plugins/reference/litellm)** (`@grokbot/litellm-provider`) - included in GrokBot. Adds LiteLLM model provider support to GrokBot.

- **[llm-task](/plugins/reference/llm-task)** (`@grokbot/llm-task`) - included in GrokBot. Generic JSON-only LLM tool for structured tasks callable from workflows.

- **[lmstudio](/plugins/reference/lmstudio)** (`@grokbot/lmstudio-provider`) - included in GrokBot. Adds LM Studio model provider support to GrokBot.

- **[logbook](/plugins/reference/logbook)** (`@grokbot/logbook`) - included in GrokBot. Automatic work journal: captures periodic screen snapshots from a paired node and turns them into a reviewable timeline of your day.

- **[memory-core](/plugins/reference/memory-core)** (`@grokbot/memory-core`) - included in GrokBot. Adds agent-callable tools.

- **[memory-wiki](/plugins/reference/memory-wiki)** (`@grokbot/memory-wiki`) - included in GrokBot. Persistent wiki compiler and Obsidian-friendly knowledge vault for GrokBot.

- **[meta](/plugins/reference/meta)** (`@grokbot/meta-provider`) - included in GrokBot; npm; ClawHub: `clawhub:@grokbot/meta-provider`. Adds Meta model provider support to GrokBot.

- **[microsoft](/plugins/reference/microsoft)** (`@grokbot/microsoft-speech`) - included in GrokBot. Adds text-to-speech provider support.

- **[microsoft-foundry](/plugins/reference/microsoft-foundry)** (`@grokbot/microsoft-foundry`) - included in GrokBot. Adds Microsoft Foundry model provider support to GrokBot.

- **[migrate-claude](/plugins/reference/migrate-claude)** (`@grokbot/migrate-claude`) - included in GrokBot. Imports Claude Code and Claude Desktop instructions, MCP servers, skills, and safe configuration into GrokBot.

- **[migrate-hermes](/plugins/reference/migrate-hermes)** (`@grokbot/migrate-hermes`) - included in GrokBot. Imports Hermes configuration, memories, skills, and supported credentials into GrokBot.

- **[minimax](/plugins/reference/minimax)** (`@grokbot/minimax-provider`) - included in GrokBot. Adds MiniMax, MiniMax Portal model provider support to GrokBot.

- **[mistral](/plugins/reference/mistral)** (`@grokbot/mistral-provider`) - included in GrokBot. Adds Mistral model provider support to GrokBot.

- **[novita](/plugins/reference/novita)** (`@grokbot/novita-provider`) - included in GrokBot. Adds Novita, Novita AI, Novitaai model provider support to GrokBot.

- **[nvidia](/plugins/reference/nvidia)** (`@grokbot/nvidia-provider`) - included in GrokBot. Adds NVIDIA model provider support to GrokBot.

- **[oc-path](/plugins/reference/oc-path)** (`@grokbot/oc-path`) - included in GrokBot. Adds the grokbot path CLI for oc:// workspace file addressing.

- **[ollama](/plugins/reference/ollama)** (`@grokbot/ollama-provider`) - included in GrokBot. Adds Ollama, Ollama Cloud model provider support to GrokBot.

- **[onepassword](/plugins/reference/onepassword)** (`@grokbot/onepassword`) - included in GrokBot. Curated 1Password secrets broker with approval policy and SQLite audit history.

- **[open-prose](/plugins/reference/open-prose)** (`@grokbot/open-prose`) - included in GrokBot. OpenProse VM skill pack with a /prose slash command.

- **[openai](/plugins/reference/openai)** (`@grokbot/openai-provider`) - included in GrokBot. Adds OpenAI model provider support to GrokBot.

- **[opencode](/plugins/reference/opencode)** (`@grokbot/opencode-provider`) - included in GrokBot. Adds OpenCode model provider support to GrokBot.

- **[opencode-go](/plugins/reference/opencode-go)** (`@grokbot/opencode-go-provider`) - included in GrokBot. Adds OpenCode Go model provider support to GrokBot.

- **[openrouter](/plugins/reference/openrouter)** (`@grokbot/openrouter-provider`) - included in GrokBot. Adds OpenRouter model provider support to GrokBot.

- **[policy](/plugins/reference/policy)** (`@grokbot/policy`) - included in GrokBot. Adds policy-backed doctor checks for workspace conformance.

- **[reef](/plugins/reference/reef)** (`@grokbot/reef`) - included in GrokBot. Guarded end-to-end encrypted claw channel.

- **[runway](/plugins/reference/runway)** (`@grokbot/runway-provider`) - included in GrokBot. Adds video generation provider support.

- **[senseaudio](/plugins/reference/senseaudio)** (`@grokbot/senseaudio-provider`) - included in GrokBot. Adds media understanding provider support.

- **[sglang](/plugins/reference/sglang)** (`@grokbot/sglang-provider`) - included in GrokBot. Adds SGLang model provider support to GrokBot.

- **[synthetic](/plugins/reference/synthetic)** (`@grokbot/synthetic-provider`) - included in GrokBot. Adds Synthetic model provider support to GrokBot.

- **[teams-meetings](/plugins/reference/teams-meetings)** (`@grokbot/teams-meetings`) - included in GrokBot. Join Microsoft Teams meetings as a Chrome browser guest.

- **[telegram](/plugins/reference/telegram)** (`@grokbot/telegram`) - included in GrokBot. Adds the Telegram channel surface for sending and receiving GrokBot messages.

- **[together](/plugins/reference/together)** (`@grokbot/together-provider`) - included in GrokBot. Adds Together model provider support to GrokBot.

- **[tts-local-cli](/plugins/reference/tts-local-cli)** (`@grokbot/tts-local-cli`) - included in GrokBot. Adds text-to-speech provider support.

- **[vault](/plugins/reference/vault)** (`@grokbot/vault`) - included in GrokBot. HashiCorp Vault SecretRef provider integration.

- **[vllm](/plugins/reference/vllm)** (`@grokbot/vllm-provider`) - included in GrokBot. Adds vLLM model provider support to GrokBot.

- **[volcengine](/plugins/reference/volcengine)** (`@grokbot/volcengine-provider`) - included in GrokBot. Adds Volcengine, Volcengine Plan model provider support to GrokBot.

- **[voyage](/plugins/reference/voyage)** (`@grokbot/voyage-provider`) - included in GrokBot. Adds memory embedding provider support.

- **[vydra](/plugins/reference/vydra)** (`@grokbot/vydra-provider`) - included in GrokBot. Adds Vydra model provider support to GrokBot.

- **[web-readability](/plugins/reference/web-readability)** (`@grokbot/web-readability-plugin`) - included in GrokBot. Extract readable article content from local HTML web fetch responses.

- **[webhooks](/plugins/reference/webhooks)** (`@grokbot/webhooks`) - included in GrokBot. Authenticated inbound webhooks that bind external automation to GrokBot TaskFlows.

- **[workboard](/plugins/reference/workboard)** (`@grokbot/workboard`) - included in GrokBot. Dashboard workboard for agent-owned issues and sessions.

- **[xai](/plugins/reference/xai)** (`@grokbot/xai-plugin`) - included in GrokBot. Adds xAI model provider support to GrokBot.

- **[xiaomi](/plugins/reference/xiaomi)** (`@grokbot/xiaomi-provider`) - included in GrokBot. Adds Xiaomi, Xiaomi Token Plan model provider support to GrokBot.

- **[zoom-meetings](/plugins/reference/zoom-meetings)** (`@grokbot/zoom-meetings`) - included in GrokBot. Join Zoom meetings as a Chrome browser guest.

## Official external packages

72 plugins

- **[acpx](/plugins/reference/acpx)** (`@grokbot/acpx`) - npm; ClawHub. GrokBot ACP runtime backend with plugin-owned session and transport management.

- **[amazon-bedrock](/plugins/reference/amazon-bedrock)** (`@grokbot/amazon-bedrock-provider`) - npm; ClawHub. GrokBot Amazon Bedrock provider plugin with model discovery, embeddings, and guardrail support.

- **[amazon-bedrock-mantle](/plugins/reference/amazon-bedrock-mantle)** (`@grokbot/amazon-bedrock-mantle-provider`) - npm; ClawHub. GrokBot Amazon Bedrock Mantle provider plugin for OpenAI-compatible model routing.

- **[anthropic-vertex](/plugins/reference/anthropic-vertex)** (`@grokbot/anthropic-vertex-provider`) - npm; ClawHub. GrokBot Anthropic Vertex provider plugin for Claude models on Google Vertex AI.

- **[arcee](/plugins/reference/arcee)** (`@grokbot/arcee-provider`) - npm; ClawHub: `clawhub:@grokbot/arcee-provider`. Adds Arcee model provider support to GrokBot.

- **[baseten](/plugins/reference/baseten)** (`@grokbot/baseten-provider`) - npm; ClawHub: `clawhub:@grokbot/baseten-provider`. GrokBot Baseten provider plugin.

- **[brave](/plugins/reference/brave)** (`@grokbot/brave-plugin`) - npm; ClawHub. GrokBot Brave Search provider plugin for web search.

- **[cerebras](/plugins/reference/cerebras)** (`@grokbot/cerebras-provider`) - npm; ClawHub: `clawhub:@grokbot/cerebras-provider`. Adds Cerebras model provider support to GrokBot.

- **[chutes](/plugins/reference/chutes)** (`@grokbot/chutes-provider`) - npm; ClawHub: `clawhub:@grokbot/chutes-provider`. Adds Chutes model provider support to GrokBot.

- **[clickclack](/plugins/reference/clickclack)** (`@grokbot/clickclack`) - npm; ClawHub: `clawhub:@grokbot/clickclack`. Adds the Clickclack channel surface for sending and receiving GrokBot messages.

- **[cloudflare-ai-gateway](/plugins/reference/cloudflare-ai-gateway)** (`@grokbot/cloudflare-ai-gateway-provider`) - npm; ClawHub: `clawhub:@grokbot/cloudflare-ai-gateway-provider`. Adds Cloudflare AI Gateway model provider support to GrokBot.

- **[codex](/plugins/reference/codex)** (`@grokbot/codex`) - npm; ClawHub. Codex app-server harness and native session catalog.

- **[copilot](/plugins/reference/copilot)** (`@grokbot/copilot`) - npm; ClawHub: `clawhub:@grokbot/copilot`. Registers the GitHub Copilot agent runtime.

- **[deepinfra](/plugins/reference/deepinfra)** (`@grokbot/deepinfra-provider`) - npm; ClawHub: `clawhub:@grokbot/deepinfra-provider`. Adds DeepInfra model provider support to GrokBot.

- **[deepseek](/plugins/reference/deepseek)** (`@grokbot/deepseek-provider`) - npm; ClawHub: `clawhub:@grokbot/deepseek-provider`. Adds DeepSeek model provider support to GrokBot.

- **[diagnostics-otel](/plugins/reference/diagnostics-otel)** (`@grokbot/diagnostics-otel`) - npm; ClawHub: `clawhub:@grokbot/diagnostics-otel`. GrokBot diagnostics OpenTelemetry exporter for metrics, traces, and logs.

- **[diagnostics-prometheus](/plugins/reference/diagnostics-prometheus)** (`@grokbot/diagnostics-prometheus`) - npm; ClawHub: `clawhub:@grokbot/diagnostics-prometheus`. GrokBot diagnostics Prometheus exporter for runtime metrics.

- **[diffs](/plugins/reference/diffs)** (`@grokbot/diffs`) - npm; ClawHub. GrokBot read-only diff viewer plugin and file renderer for agents.

- **[diffs-language-pack](/plugins/reference/diffs-language-pack)** (`@grokbot/diffs-language-pack`) - npm; ClawHub: `clawhub:@grokbot/diffs-language-pack`. Adds syntax highlighting for languages outside the default diffs viewer set.

- **[discord](/plugins/reference/discord)** (`@grokbot/discord`) - npm; ClawHub. GrokBot Discord channel plugin for channels, DMs, commands, and app events.

- **[exa](/plugins/reference/exa)** (`@grokbot/exa-plugin`) - npm; ClawHub: `clawhub:@grokbot/exa-plugin`. Adds web search provider support.

- **[featherless](/plugins/reference/featherless)** (`@grokbot/featherless-provider`) - npm; ClawHub: `clawhub:@grokbot/featherless-provider`. GrokBot Featherless AI provider plugin.

- **[feishu](/plugins/reference/feishu)** (`@grokbot/feishu`) - npm; ClawHub. GrokBot Feishu/Lark channel plugin for chats and workplace tools (community maintained by @m1heng).

- **[firecrawl](/plugins/reference/firecrawl)** (`@grokbot/firecrawl-plugin`) - npm; ClawHub: `clawhub:@grokbot/firecrawl-plugin`. Adds agent-callable tools. Adds web fetch provider support. Adds web search provider support.

- **[fireworks](/plugins/reference/fireworks)** (`@grokbot/fireworks-provider`) - npm; ClawHub: `clawhub:@grokbot/fireworks-provider`. Adds Fireworks model provider support to GrokBot.

- **[gmi](/plugins/reference/gmi)** (`@grokbot/gmi-provider`) - npm; ClawHub: `clawhub:@grokbot/gmi-provider`. GrokBot GMI Cloud provider plugin.

- **[google-meet](/plugins/reference/google-meet)** (`@grokbot/google-meet`) - npm; ClawHub. GrokBot Google Meet participant plugin for joining calls through Chrome or Twilio transports.

- **[googlechat](/plugins/reference/googlechat)** (`@grokbot/googlechat`) - npm; ClawHub. GrokBot Google Chat channel plugin for spaces and direct messages.

- **[gradium](/plugins/reference/gradium)** (`@grokbot/gradium-speech`) - npm; ClawHub: `clawhub:@grokbot/gradium-speech`. Adds text-to-speech provider support.

- **[groq](/plugins/reference/groq)** (`@grokbot/groq-provider`) - npm; ClawHub: `clawhub:@grokbot/groq-provider`. Adds Groq model provider support to GrokBot.

- **[inworld](/plugins/reference/inworld)** (`@grokbot/inworld-speech`) - npm; ClawHub: `clawhub:@grokbot/inworld-speech`. Inworld streaming text-to-speech (MP3, OGG_OPUS, PCM telephony).

- **[irc](/plugins/reference/irc)** (`@grokbot/irc`) - npm; ClawHub: `clawhub:@grokbot/irc`. Adds the IRC channel surface for sending and receiving GrokBot messages.

- **[kilocode](/plugins/reference/kilocode)** (`@grokbot/kilocode-provider`) - npm; ClawHub: `clawhub:@grokbot/kilocode-provider`. Adds Kilocode model provider support to GrokBot.

- **[kimi](/plugins/reference/kimi)** (`@grokbot/kimi-provider`) - npm; ClawHub: `clawhub:@grokbot/kimi-provider`. Adds Kimi, Kimi Coding model provider support to GrokBot.

- **[line](/plugins/reference/line)** (`@grokbot/line`) - npm; ClawHub. GrokBot LINE channel plugin for LINE Bot API chats.

- **[llama-cpp](/plugins/reference/llama-cpp)** (`@grokbot/llama-cpp-provider`) - npm; ClawHub. Local GGUF text inference and embeddings through node-llama-cpp.

- **[lobster](/plugins/reference/lobster)** (`@grokbot/lobster`) - npm; ClawHub. Lobster workflow tool plugin for typed pipelines and resumable approvals.

- **[longcat](/plugins/reference/longcat)** (`@grokbot/longcat-provider`) - npm; ClawHub: `clawhub:@grokbot/longcat-provider`. GrokBot LongCat provider plugin.

- **[matrix](/plugins/reference/matrix)** (`@grokbot/matrix`) - ClawHub: `clawhub:@grokbot/matrix`; npm. GrokBot Matrix channel plugin for rooms and direct messages.

- **[mattermost](/plugins/reference/mattermost)** (`@grokbot/mattermost`) - npm; ClawHub: `clawhub:@grokbot/mattermost`. Adds the Mattermost channel surface for sending and receiving GrokBot messages.

- **[memory-lancedb](/plugins/reference/memory-lancedb)** (`@grokbot/memory-lancedb`) - npm; ClawHub. GrokBot LanceDB-backed long-term memory plugin with auto-recall, auto-capture, and vector search.

- **[moonshot](/plugins/reference/moonshot)** (`@grokbot/moonshot-provider`) - npm; ClawHub: `clawhub:@grokbot/moonshot-provider`. Adds Moonshot model provider support to GrokBot.

- **[msteams](/plugins/reference/msteams)** (`@grokbot/msteams`) - npm; ClawHub. GrokBot Microsoft Teams channel plugin for bot conversations.

- **[mxc](/plugins/reference/mxc)** (`@grokbot/mxc-sandbox`) - npm; ClawHub. OS-level sandboxed tool execution via MXC for MXC-capable Windows hosts: runs commands in ProcessContainer (Windows) with configured MXC policy files.

- **[nextcloud-talk](/plugins/reference/nextcloud-talk)** (`@grokbot/nextcloud-talk`) - npm; ClawHub. GrokBot Nextcloud Talk channel plugin for conversations.

- **[nostr](/plugins/reference/nostr)** (`@grokbot/nostr`) - npm; ClawHub. GrokBot Nostr channel plugin for NIP-04 encrypted direct messages.

- **[openshell](/plugins/reference/openshell)** (`@grokbot/openshell-sandbox`) - npm; ClawHub. GrokBot sandbox backend for the NVIDIA OpenShell CLI with mirrored local workspaces and SSH command execution.

- **[parallel](/tools/parallel-search)** (`@grokbot/parallel-plugin`) - npm; ClawHub: `clawhub:@grokbot/parallel-plugin`. Adds web search provider support.

- **[perplexity](/plugins/reference/perplexity)** (`@grokbot/perplexity-plugin`) - npm; ClawHub: `clawhub:@grokbot/perplexity-plugin`. Adds web search provider support.

- **[pixverse](/plugins/reference/pixverse)** (`@grokbot/pixverse-provider`) - npm; ClawHub: `clawhub:@grokbot/pixverse-provider`. GrokBot PixVerse video generation provider plugin.

- **[qianfan](/plugins/reference/qianfan)** (`@grokbot/qianfan-provider`) - npm; ClawHub: `clawhub:@grokbot/qianfan-provider`. Adds Qianfan model provider support to GrokBot.

- **[qqbot](/plugins/reference/qqbot)** (`@grokbot/qqbot`) - npm; ClawHub. GrokBot QQ Bot channel plugin for group and direct-message workflows.

- **[qwen](/plugins/reference/qwen)** (`@grokbot/qwen-provider`) - npm; ClawHub: `clawhub:@grokbot/qwen-provider`. Adds Qwen, Qwen Cloud, Model Studio, DashScope, Qwen Token Plan, Bailian Token Plan model provider support to GrokBot.

- **[raft](/plugins/reference/raft)** (`@grokbot/raft`) - npm; ClawHub. GrokBot Raft channel plugin for secure CLI wake bridges.

- **[searxng](/plugins/reference/searxng)** (`@grokbot/searxng-plugin`) - npm; ClawHub: `clawhub:@grokbot/searxng-plugin`. Adds web search provider support.

- **[signal](/plugins/reference/signal)** (`@grokbot/signal`) - npm; ClawHub: `clawhub:@grokbot/signal`. Adds the Signal channel surface for sending and receiving GrokBot messages.

- **[slack](/plugins/reference/slack)** (`@grokbot/slack`) - npm; ClawHub. GrokBot Slack channel plugin for channels, DMs, commands, and app events.

- **[sms](/plugins/reference/sms)** (`@grokbot/sms`) - npm; ClawHub: `clawhub:@grokbot/sms`. Twilio SMS channel plugin for GrokBot text messages.

- **[stepfun](/plugins/reference/stepfun)** (`@grokbot/stepfun-provider`) - npm; ClawHub: `clawhub:@grokbot/stepfun-provider`. Adds StepFun, StepFun Plan model provider support to GrokBot.

- **[synology-chat](/plugins/reference/synology-chat)** (`@grokbot/synology-chat`) - npm; ClawHub. Synology Chat channel plugin for GrokBot channels and direct messages.

- **[tavily](/plugins/reference/tavily)** (`@grokbot/tavily-plugin`) - npm; ClawHub: `clawhub:@grokbot/tavily-plugin`. Adds agent-callable tools. Adds web search provider support.

- **[tencent](/plugins/reference/tencent)** (`@grokbot/tencent-provider`) - npm; ClawHub: `clawhub:@grokbot/tencent-provider`. Adds Tencent TokenHub, Tencent Tokenplan model provider support to GrokBot.

- **[tlon](/plugins/reference/tlon)** (`@grokbot/tlon`) - npm; ClawHub. GrokBot Tlon/Urbit channel plugin for chat workflows.

- **[tokenjuice](/plugins/reference/tokenjuice)** (`@grokbot/tokenjuice`) - npm; ClawHub: `clawhub:@grokbot/tokenjuice`. Compacts exec and bash tool results with tokenjuice reducers.

- **[twitch](/plugins/reference/twitch)** (`@grokbot/twitch`) - npm; ClawHub. GrokBot Twitch channel plugin for chat and moderation workflows.

- **[venice](/plugins/reference/venice)** (`@grokbot/venice-provider`) - npm; ClawHub: `clawhub:@grokbot/venice-provider`. Adds Venice model provider support to GrokBot.

- **[vercel-ai-gateway](/plugins/reference/vercel-ai-gateway)** (`@grokbot/vercel-ai-gateway-provider`) - npm; ClawHub: `clawhub:@grokbot/vercel-ai-gateway-provider`. Adds Vercel AI Gateway model provider support to GrokBot.

- **[voice-call](/plugins/reference/voice-call)** (`@grokbot/voice-call`) - npm; ClawHub. GrokBot voice-call plugin for Twilio, Telnyx, and Plivo phone calls.

- **[whatsapp](/plugins/reference/whatsapp)** (`@grokbot/whatsapp`) - ClawHub: `clawhub:@grokbot/whatsapp`; npm. GrokBot WhatsApp channel plugin for WhatsApp Web chats.

- **[zai](/plugins/reference/zai)** (`@grokbot/zai-provider`) - npm; ClawHub: `clawhub:@grokbot/zai-provider`. Adds Z.AI model provider support to GrokBot.

- **[zalo](/plugins/reference/zalo)** (`@grokbot/zalo`) - npm; ClawHub. GrokBot Zalo channel plugin for bot and webhook chats.

- **[zalouser](/plugins/reference/zalouser)** (`@grokbot/zalouser`) - npm; ClawHub. GrokBot Zalo Personal Account plugin via native zca-js integration.

## Source checkout only

2 plugins

- **[qa-channel](/plugins/reference/qa-channel)** (`@grokbot/qa-channel`) - source checkout only. Adds the QA Channel surface for sending and receiving GrokBot messages.

- **[qa-lab](/plugins/reference/qa-lab)** (`@grokbot/qa-lab`) - source checkout only. GrokBot QA lab plugin with private debugger UI and scenario runner.
