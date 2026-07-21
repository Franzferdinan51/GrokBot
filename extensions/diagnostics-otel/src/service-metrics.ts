import type { Meter } from "@opentelemetry/api";
import {
  AGENT_DURATION_MS_BUCKETS,
  CONTEXT_TOKENS_BUCKETS,
  GEN_AI_OPERATION_DURATION_BUCKETS,
  GEN_AI_TOKEN_USAGE_BUCKETS,
} from "./service-constants.js";

export function createDiagnosticsMetrics(meter: Meter) {
  const tokensCounter = meter.createCounter("grokbot.tokens", {
    unit: "1",
    description: "Token usage by type",
  });
  const genAiTokenUsageHistogram = meter.createHistogram("gen_ai.client.token.usage", {
    unit: "{token}",
    description: "Number of input and output tokens used by GenAI client operations",
    advice: {
      explicitBucketBoundaries: GEN_AI_TOKEN_USAGE_BUCKETS,
    },
  });
  const genAiOperationDurationHistogram = meter.createHistogram(
    "gen_ai.client.operation.duration",
    {
      unit: "s",
      description: "GenAI client operation duration",
      advice: {
        explicitBucketBoundaries: GEN_AI_OPERATION_DURATION_BUCKETS,
      },
    },
  );
  const costCounter = meter.createCounter("grokbot.cost.usd", {
    unit: "1",
    description: "Estimated model cost (USD)",
  });
  const durationHistogram = meter.createHistogram("grokbot.run.duration_ms", {
    unit: "ms",
    description: "Agent run duration",
    advice: { explicitBucketBoundaries: AGENT_DURATION_MS_BUCKETS },
  });
  const harnessDurationHistogram = meter.createHistogram("grokbot.harness.duration_ms", {
    unit: "ms",
    description: "Agent harness lifecycle duration",
    advice: { explicitBucketBoundaries: AGENT_DURATION_MS_BUCKETS },
  });
  const contextHistogram = meter.createHistogram("grokbot.context.tokens", {
    unit: "1",
    description: "Context window size and usage",
    advice: { explicitBucketBoundaries: CONTEXT_TOKENS_BUCKETS },
  });
  const webhookReceivedCounter = meter.createCounter("grokbot.webhook.received", {
    unit: "1",
    description: "Webhook requests received",
  });
  const webhookErrorCounter = meter.createCounter("grokbot.webhook.error", {
    unit: "1",
    description: "Webhook processing errors",
  });
  const webhookDurationHistogram = meter.createHistogram("grokbot.webhook.duration_ms", {
    unit: "ms",
    description: "Webhook processing duration",
  });
  const messageQueuedCounter = meter.createCounter("grokbot.message.queued", {
    unit: "1",
    description: "Messages queued for processing",
  });
  const messageReceivedCounter = meter.createCounter("grokbot.message.received", {
    unit: "1",
    description: "Inbound messages received",
  });
  const messageDispatchStartedCounter = meter.createCounter("grokbot.message.dispatch.started", {
    unit: "1",
    description: "Inbound message dispatch attempts started",
  });
  const messageDispatchCompletedCounter = meter.createCounter(
    "grokbot.message.dispatch.completed",
    {
      unit: "1",
      description: "Inbound message dispatch attempts completed",
    },
  );
  const messageDispatchDurationHistogram = meter.createHistogram(
    "grokbot.message.dispatch.duration_ms",
    {
      unit: "ms",
      description: "Inbound message dispatch duration",
    },
  );
  const messageProcessedCounter = meter.createCounter("grokbot.message.processed", {
    unit: "1",
    description: "Messages processed by outcome",
  });
  const messageDurationHistogram = meter.createHistogram("grokbot.message.duration_ms", {
    unit: "ms",
    description: "Message processing duration",
  });
  const messageDeliveryStartedCounter = meter.createCounter("grokbot.message.delivery.started", {
    unit: "1",
    description: "Outbound message delivery attempts started",
  });
  const messageDeliveryDurationHistogram = meter.createHistogram(
    "grokbot.message.delivery.duration_ms",
    {
      unit: "ms",
      description: "Outbound message delivery duration",
    },
  );
  const queueDepthHistogram = meter.createHistogram("grokbot.queue.depth", {
    unit: "1",
    description: "Queue depth on enqueue/dequeue",
  });
  const queueWaitHistogram = meter.createHistogram("grokbot.queue.wait_ms", {
    unit: "ms",
    description: "Queue wait time before execution",
  });
  const laneEnqueueCounter = meter.createCounter("grokbot.queue.lane.enqueue", {
    unit: "1",
    description: "Command queue lane enqueue events",
  });
  const laneDequeueCounter = meter.createCounter("grokbot.queue.lane.dequeue", {
    unit: "1",
    description: "Command queue lane dequeue events",
  });
  const sessionStateCounter = meter.createCounter("grokbot.session.state", {
    unit: "1",
    description: "Session state transitions",
  });
  const sessionTurnCreatedCounter = meter.createCounter("grokbot.session.turn.created", {
    unit: "1",
    description: "Agent session turns created",
  });
  const sessionStuckCounter = meter.createCounter("grokbot.session.stuck", {
    unit: "1",
    description: "Sessions stuck in processing",
  });
  const sessionStuckAgeHistogram = meter.createHistogram("grokbot.session.stuck_age_ms", {
    unit: "ms",
    description: "Age of stuck sessions",
  });
  const sessionRecoveryRequestedCounter = meter.createCounter(
    "grokbot.session.recovery.requested",
    {
      unit: "1",
      description: "Session recovery attempts requested",
    },
  );
  const sessionRecoveryCompletedCounter = meter.createCounter(
    "grokbot.session.recovery.completed",
    {
      unit: "1",
      description: "Session recovery attempts completed",
    },
  );
  const sessionRecoveryAgeHistogram = meter.createHistogram("grokbot.session.recovery.age_ms", {
    unit: "ms",
    description: "Age of sessions selected for recovery",
  });
  const talkEventCounter = meter.createCounter("grokbot.talk.event", {
    unit: "1",
    description: "Talk events emitted by type",
  });
  const talkEventDurationHistogram = meter.createHistogram("grokbot.talk.event.duration_ms", {
    unit: "ms",
    description: "Talk event duration when reported",
  });
  const talkAudioBytesHistogram = meter.createHistogram("grokbot.talk.audio.bytes", {
    unit: "By",
    description: "Talk audio frame byte lengths",
  });
  const runAttemptCounter = meter.createCounter("grokbot.run.attempt", {
    unit: "1",
    description: "Run attempts",
  });
  const toolLoopCounter = meter.createCounter("grokbot.tool.loop", {
    unit: "1",
    description: "Detected repetitive tool-call loop events",
  });
  const skillUsedCounter = meter.createCounter("grokbot.skill.used", {
    unit: "1",
    description: "Skills used by agent runs",
  });
  const modelCallDurationHistogram = meter.createHistogram("grokbot.model_call.duration_ms", {
    unit: "ms",
    description: "Model call duration",
  });
  const modelCallRequestBytesHistogram = meter.createHistogram(
    "grokbot.model_call.request_bytes",
    {
      unit: "By",
      description: "UTF-8 byte size of sanitized model request payloads",
    },
  );
  const modelCallResponseBytesHistogram = meter.createHistogram(
    "grokbot.model_call.response_bytes",
    {
      unit: "By",
      description: "UTF-8 byte size of bounded streamed model response payloads",
    },
  );
  const modelCallTimeToFirstByteHistogram = meter.createHistogram(
    "grokbot.model_call.time_to_first_byte_ms",
    {
      unit: "ms",
      description: "Elapsed time before the first streamed model response event",
    },
  );
  const modelFailoverCounter = meter.createCounter("grokbot.model.failover", {
    unit: "1",
    description: "Model failovers by source, destination, lane, and reason",
  });
  const toolExecutionDurationHistogram = meter.createHistogram(
    "grokbot.tool.execution.duration_ms",
    {
      unit: "ms",
      description: "Tool execution duration",
    },
  );
  const toolExecutionBlockedCounter = meter.createCounter("grokbot.tool.execution.blocked", {
    unit: "1",
    description: "Tool executions blocked by policy or sandbox diagnostics",
  });
  const execProcessDurationHistogram = meter.createHistogram("grokbot.exec.duration_ms", {
    unit: "ms",
    description: "Exec process duration",
  });
  const memoryRssHistogram = meter.createHistogram("grokbot.memory.rss_bytes", {
    unit: "By",
    description: "Resident set size reported by diagnostic memory samples",
  });
  const memoryHeapUsedHistogram = meter.createHistogram("grokbot.memory.heap_used_bytes", {
    unit: "By",
    description: "Heap used bytes reported by diagnostic memory samples",
  });
  const memoryHeapTotalHistogram = meter.createHistogram("grokbot.memory.heap_total_bytes", {
    unit: "By",
    description: "Heap total bytes reported by diagnostic memory samples",
  });
  const memoryExternalHistogram = meter.createHistogram("grokbot.memory.external_bytes", {
    unit: "By",
    description: "External memory bytes reported by diagnostic memory samples",
  });
  const memoryArrayBuffersHistogram = meter.createHistogram("grokbot.memory.array_buffers_bytes", {
    unit: "By",
    description: "ArrayBuffer bytes reported by diagnostic memory samples",
  });
  const memoryPressureCounter = meter.createCounter("grokbot.memory.pressure", {
    unit: "1",
    description: "Diagnostic memory pressure events",
  });
  const asyncQueueDroppedCounter = meter.createCounter("grokbot.diagnostic.async_queue.dropped", {
    unit: "1",
    description: "Async diagnostic queue drops by dropped event class",
  });
  const payloadLargeCounter = meter.createCounter("grokbot.payload.large", {
    unit: "1",
    description: "Oversized payload diagnostics by surface and action",
  });
  const payloadLargeBytesHistogram = meter.createHistogram("grokbot.payload.large_bytes", {
    unit: "By",
    description: "Oversized payload byte sizes by surface and action",
  });
  const livenessWarningCounter = meter.createCounter("grokbot.liveness.warning", {
    unit: "1",
    description: "Diagnostic liveness warning events",
  });
  const livenessEventLoopDelayP99Histogram = meter.createHistogram(
    "grokbot.liveness.event_loop_delay_p99_ms",
    {
      unit: "ms",
      description: "P99 event-loop delay reported by diagnostic liveness warnings",
    },
  );
  const livenessEventLoopDelayMaxHistogram = meter.createHistogram(
    "grokbot.liveness.event_loop_delay_max_ms",
    {
      unit: "ms",
      description: "Maximum event-loop delay reported by diagnostic liveness warnings",
    },
  );
  const livenessEventLoopUtilizationHistogram = meter.createHistogram(
    "grokbot.liveness.event_loop_utilization",
    {
      unit: "1",
      description: "Event-loop utilization reported by diagnostic liveness warnings",
    },
  );
  const livenessCpuCoreRatioHistogram = meter.createHistogram("grokbot.liveness.cpu_core_ratio", {
    unit: "1",
    description: "CPU core ratio reported by diagnostic liveness warnings",
  });
  const telemetryExporterCounter = meter.createCounter("grokbot.telemetry.exporter.events", {
    unit: "1",
    description: "Diagnostic telemetry exporter lifecycle and failure events",
  });
  return {
    tokensCounter,
    genAiTokenUsageHistogram,
    genAiOperationDurationHistogram,
    costCounter,
    durationHistogram,
    harnessDurationHistogram,
    contextHistogram,
    webhookReceivedCounter,
    webhookErrorCounter,
    webhookDurationHistogram,
    messageQueuedCounter,
    messageReceivedCounter,
    messageDispatchStartedCounter,
    messageDispatchCompletedCounter,
    messageDispatchDurationHistogram,
    messageProcessedCounter,
    messageDurationHistogram,
    messageDeliveryStartedCounter,
    messageDeliveryDurationHistogram,
    queueDepthHistogram,
    queueWaitHistogram,
    laneEnqueueCounter,
    laneDequeueCounter,
    sessionStateCounter,
    sessionTurnCreatedCounter,
    sessionStuckCounter,
    sessionStuckAgeHistogram,
    sessionRecoveryRequestedCounter,
    sessionRecoveryCompletedCounter,
    sessionRecoveryAgeHistogram,
    talkEventCounter,
    talkEventDurationHistogram,
    talkAudioBytesHistogram,
    runAttemptCounter,
    toolLoopCounter,
    skillUsedCounter,
    modelCallDurationHistogram,
    modelCallRequestBytesHistogram,
    modelCallResponseBytesHistogram,
    modelCallTimeToFirstByteHistogram,
    modelFailoverCounter,
    toolExecutionDurationHistogram,
    toolExecutionBlockedCounter,
    execProcessDurationHistogram,
    memoryRssHistogram,
    memoryHeapUsedHistogram,
    memoryHeapTotalHistogram,
    memoryExternalHistogram,
    memoryArrayBuffersHistogram,
    memoryPressureCounter,
    asyncQueueDroppedCounter,
    payloadLargeCounter,
    payloadLargeBytesHistogram,
    livenessWarningCounter,
    livenessEventLoopDelayP99Histogram,
    livenessEventLoopDelayMaxHistogram,
    livenessEventLoopUtilizationHistogram,
    livenessCpuCoreRatioHistogram,
    telemetryExporterCounter,
  };
}

export type DiagnosticsMetrics = ReturnType<typeof createDiagnosticsMetrics>;
