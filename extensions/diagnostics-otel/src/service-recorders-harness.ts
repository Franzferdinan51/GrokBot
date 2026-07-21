import { SpanStatusCode } from "@opentelemetry/api";
import type {
  DiagnosticEventMetadata,
  DiagnosticEventPayload,
  DiagnosticEventPrivateData,
} from "../api.js";
import { lowCardinalityAttr, lowCardinalityQueueLaneAttr } from "./service-attributes.js";
import { normalizeOtelErrorMessage } from "./service-content-normalization.js";
import type { DiagnosticsRecorderRuntime } from "./service-recorder-runtime.js";
import type { HarnessRunDiagnosticEvent, ModelFailoverDiagnosticEvent } from "./service-types.js";

export function createHarnessRecorders(runtime: DiagnosticsRecorderRuntime) {
  const {
    harnessDurationHistogram,
    modelFailoverCounter,
    activeTrustedSpans,
    spanWithDuration,
    trustedTraceContext,
    activeTrustedParentContext,
    trackTrustedSpan,
    takeTrackedTrustedSpan,
    setSpanAttrs,
    completeTrackedLifecycleSpan,
    addRunAttrs,
    tracesEnabled,
  } = runtime;

  const harnessRunMetricAttrs = (evt: HarnessRunDiagnosticEvent) => ({
    "grokbot.harness.id": lowCardinalityAttr(evt.harnessId, "unknown"),
    "grokbot.harness.plugin": lowCardinalityAttr(evt.pluginId),
    ...(evt.type === "harness.run.started"
      ? {}
      : {
          "grokbot.outcome": evt.type === "harness.run.error" ? "error" : evt.outcome,
        }),
    "grokbot.provider": lowCardinalityAttr(evt.provider, "unknown"),
    "grokbot.model": lowCardinalityAttr(evt.model, "unknown"),
    ...(evt.channel ? { "grokbot.channel": lowCardinalityAttr(evt.channel) } : {}),
  });

  const recordHarnessRunStarted = (
    evt: Extract<DiagnosticEventPayload, { type: "harness.run.started" }>,
    metadata: DiagnosticEventMetadata,
  ) => {
    if (!tracesEnabled || !metadata.trusted) {
      return;
    }
    trackTrustedSpan(
      evt,
      metadata,
      spanWithDuration("grokbot.harness.run", harnessRunMetricAttrs(evt), undefined, {
        parentContext: activeTrustedParentContext(evt, metadata),
        startTimeMs: evt.ts,
      }),
    );
  };

  const recordHarnessRunCompleted = (
    evt: Extract<DiagnosticEventPayload, { type: "harness.run.completed" }>,
    metadata: DiagnosticEventMetadata,
    privateData: DiagnosticEventPrivateData,
  ) => {
    harnessDurationHistogram.record(evt.durationMs, harnessRunMetricAttrs(evt));
    if (!tracesEnabled) {
      return;
    }
    const spanAttrs: Record<string, string | number | boolean> = {
      ...harnessRunMetricAttrs(evt),
    };
    if (evt.resultClassification) {
      spanAttrs["grokbot.harness.result_classification"] = lowCardinalityAttr(
        evt.resultClassification,
      );
    }
    if (typeof evt.yieldDetected === "boolean") {
      spanAttrs["grokbot.harness.yield_detected"] = evt.yieldDetected;
    }
    if (evt.itemLifecycle) {
      spanAttrs["grokbot.harness.items.started"] = evt.itemLifecycle.startedCount;
      spanAttrs["grokbot.harness.items.completed"] = evt.itemLifecycle.completedCount;
      spanAttrs["grokbot.harness.items.active"] = evt.itemLifecycle.activeCount;
    }
    // Redacted message goes on the span only, never the low-cardinality metric attrs.
    const redactedError = normalizeOtelErrorMessage(privateData.errorMessage);
    if (redactedError) {
      spanAttrs["grokbot.error"] = redactedError;
    }
    const trustedTrace = trustedTraceContext(evt, metadata);
    const trackedSpan = trustedTrace?.spanId
      ? activeTrustedSpans.get(trustedTrace.spanId)
      : undefined;
    const span =
      trackedSpan ??
      spanWithDuration("grokbot.harness.run", spanAttrs, evt.durationMs, {
        parentContext: activeTrustedParentContext(evt, metadata),
        endTimeMs: evt.ts,
      });
    setSpanAttrs(span, spanAttrs);
    if (evt.outcome === "error") {
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: redactedError ?? "error",
      });
    }
    if (trackedSpan && trustedTrace?.spanId) {
      completeTrackedLifecycleSpan(trustedTrace.spanId, trackedSpan, evt.ts);
      return;
    }
    span.end(evt.ts);
  };

  const recordHarnessRunError = (
    evt: Extract<DiagnosticEventPayload, { type: "harness.run.error" }>,
    metadata: DiagnosticEventMetadata,
    privateData: DiagnosticEventPrivateData,
  ) => {
    const errorType = lowCardinalityAttr(evt.errorCategory, "other");
    const attrs = {
      ...harnessRunMetricAttrs(evt),
      "grokbot.harness.phase": evt.phase,
      "grokbot.errorCategory": errorType,
    };
    harnessDurationHistogram.record(evt.durationMs, attrs);
    if (!tracesEnabled) {
      return;
    }
    // Redacted message goes on the span only; attrs above feed the metric.
    const redactedError = normalizeOtelErrorMessage(privateData.errorMessage);
    const spanAttrs: Record<string, string | number | boolean> = {
      ...attrs,
      "error.type": errorType,
      ...(redactedError ? { "grokbot.error": redactedError } : {}),
      ...(evt.cleanupFailed ? { "grokbot.harness.cleanup_failed": true } : {}),
    };
    const span =
      takeTrackedTrustedSpan(evt, metadata) ??
      spanWithDuration("grokbot.harness.run", spanAttrs, evt.durationMs, {
        parentContext: activeTrustedParentContext(evt, metadata),
        endTimeMs: evt.ts,
      });
    setSpanAttrs(span, spanAttrs);
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: redactedError ?? errorType,
    });
    span.end(evt.ts);
  };

  const recordContextAssembled = (
    evt: Extract<DiagnosticEventPayload, { type: "context.assembled" }>,
    metadata: DiagnosticEventMetadata,
  ) => {
    if (!tracesEnabled) {
      return;
    }
    const spanAttrs: Record<string, string | number | boolean> = {
      "grokbot.context.message_count": evt.messageCount,
      "grokbot.context.history_text_chars": evt.historyTextChars,
      "grokbot.context.history_image_blocks": evt.historyImageBlocks,
      "grokbot.context.max_message_text_chars": evt.maxMessageTextChars,
      "grokbot.context.system_prompt_chars": evt.systemPromptChars,
      "grokbot.context.prompt_chars": evt.promptChars,
      "grokbot.context.prompt_images": evt.promptImages,
    };
    addRunAttrs(spanAttrs, evt);
    if (evt.contextTokenBudget !== undefined) {
      spanAttrs["grokbot.context.token_budget"] = evt.contextTokenBudget;
    }
    if (evt.reserveTokens !== undefined) {
      spanAttrs["grokbot.context.reserve_tokens"] = evt.reserveTokens;
    }
    const span = spanWithDuration("grokbot.context.assembled", spanAttrs, 0, {
      parentContext: activeTrustedParentContext(evt, metadata),
      endTimeMs: evt.ts,
    });
    span.end(evt.ts);
  };

  const recordModelFailover = (
    evt: ModelFailoverDiagnosticEvent,
    metadata: DiagnosticEventMetadata,
  ) => {
    const metricAttrs: Record<string, string> = {
      "grokbot.failover.reason": lowCardinalityAttr(evt.reason, "unknown"),
      "grokbot.failover.suspended":
        evt.suspended === undefined ? "unknown" : String(evt.suspended),
      "grokbot.lane": lowCardinalityQueueLaneAttr(evt.lane, "unknown"),
      "grokbot.model": lowCardinalityAttr(evt.fromModel),
      "grokbot.provider": lowCardinalityAttr(evt.fromProvider),
      "grokbot.failover.to_model": lowCardinalityAttr(evt.toModel),
      "grokbot.failover.to_provider": lowCardinalityAttr(evt.toProvider),
    };
    modelFailoverCounter.add(1, metricAttrs);
    if (!tracesEnabled) {
      return;
    }
    const spanAttrs: Record<string, string | number | boolean> = {
      "grokbot.failover.reason": lowCardinalityAttr(evt.reason, "unknown"),
    };
    if (evt.fromProvider) {
      spanAttrs["grokbot.provider"] = evt.fromProvider;
    }
    if (evt.fromModel) {
      spanAttrs["grokbot.model"] = evt.fromModel;
    }
    if (evt.toProvider) {
      spanAttrs["grokbot.failover.to_provider"] = evt.toProvider;
    }
    if (evt.toModel) {
      spanAttrs["grokbot.failover.to_model"] = evt.toModel;
    }
    if (evt.lane) {
      spanAttrs["grokbot.lane"] = lowCardinalityQueueLaneAttr(evt.lane, "unknown");
    }
    if (evt.suspended !== undefined) {
      spanAttrs["grokbot.failover.suspended"] = evt.suspended;
    }
    if (evt.cascadeDepth !== undefined) {
      spanAttrs["grokbot.failover.cascade_depth"] = evt.cascadeDepth;
    }
    const span = spanWithDuration("grokbot.model.failover", spanAttrs, 0, {
      parentContext: activeTrustedParentContext(evt, metadata),
      endTimeMs: evt.ts,
    });
    span.end(evt.ts);
  };

  return {
    recordHarnessRunStarted,
    recordHarnessRunCompleted,
    recordHarnessRunError,
    recordContextAssembled,
    recordModelFailover,
  };
}
