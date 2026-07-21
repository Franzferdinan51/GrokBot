/** ACP runtime error exports wired to GrokBot secret redaction. */
import { configureAcpErrorRedactor } from "@grokbot/acp-core";
import { redactSensitiveText } from "../../logging/redact.js";

// Ensure ACP-core runtime errors use GrokBot's secret redaction before re-export.
configureAcpErrorRedactor(redactSensitiveText);

export * from "@grokbot/acp-core/runtime/errors";
