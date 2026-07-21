# GrokBot Amazon Bedrock Provider

Official GrokBot provider plugin for Amazon Bedrock. It adds Bedrock model discovery, text generation, embeddings, and guardrail-aware provider routing for agents that use AWS-hosted models.

Install from GrokBot:

```bash
grokbot plugin add @grokbot/amazon-bedrock-provider
```

Configure AWS credentials and region through your normal GrokBot credential/profile setup, then select Bedrock models with the `amazon-bedrock/...` provider prefix.
