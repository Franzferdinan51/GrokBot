# @grokbot/pixverse-provider

Official PixVerse video generation provider plugin for GrokBot.

This plugin registers PixVerse as a `video_generate` provider for text-to-video and image-to-video workflows.

## Install

```bash
grokbot plugins install @grokbot/pixverse-provider
```

Restart the Gateway after installing or updating the plugin.

## Configure

Store your PixVerse API key in GrokBot config or expose the supported environment variable to the Gateway. Then select PixVerse as a video generation provider.

Full setup and model/provider examples:

- https://docs.grokbot.ai/providers/pixverse

## Package

- Plugin id: `pixverse`
- Package: `@grokbot/pixverse-provider`
- Minimum GrokBot host: `2026.5.26`
