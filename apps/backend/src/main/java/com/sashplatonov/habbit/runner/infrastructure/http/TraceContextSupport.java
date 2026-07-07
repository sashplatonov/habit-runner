package com.sashplatonov.habbit.runner.infrastructure.http;

import com.sashplatonov.habbit.runner.api.RequestTraceFilter;
import org.slf4j.MDC;

import java.net.http.HttpRequest;

public final class TraceContextSupport {
  private static final String TRACE_ID_KEY = "traceId";

  private TraceContextSupport() {
  }

  public static String traceIdOrUnknown() {
    var traceId = currentTraceId();
    return traceId == null ? "unknown" : traceId;
  }

  public static String currentTraceId() {
    var traceId = MDC.get(TRACE_ID_KEY);
    if (traceId == null || traceId.isBlank()) {
      return null;
    }
    return traceId;
  }

  public static HttpRequest.Builder withCorrelationHeaders(HttpRequest.Builder builder) {
    var traceId = currentTraceId();
    if (traceId != null) {
      builder.header(RequestTraceFilter.TRACE_ID_HEADER, traceId);
    }
    return builder;
  }
}
