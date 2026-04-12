package com.sashplatonov.habbit.runner.api;

import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import io.opentelemetry.api.trace.Span;
import org.slf4j.MDC;

import java.util.UUID;

@Provider
@Priority(Priorities.AUTHENTICATION - 100)
@SuppressWarnings("PMD.LawOfDemeter")
public class RequestTraceFilter implements ContainerRequestFilter, ContainerResponseFilter {
  public static final String TRACE_ID_HEADER = "x-trace-id";
  private static final String TRACE_ID_PROPERTY = RequestTraceFilter.class.getName() + ".traceId";

  @Override
  @SuppressWarnings({"PMD.CyclomaticComplexity", "PMD.AvoidCatchingGenericException"})
  public void filter(ContainerRequestContext requestContext) {
    String spanTraceId = null;
    try {
      var spanContext = Span.current().getSpanContext();
      if (spanContext != null && spanContext.isValid()) {
        spanTraceId = spanContext.getTraceId();
      }
    } catch (RuntimeException ignored) {
      spanTraceId = null;
    }

    var traceId = parseTraceParent(requestContext.getHeaderString("traceparent"));
    if (traceId == null) {
      traceId = normalize(requestContext.getHeaderString(TRACE_ID_HEADER));
    }
    if (spanTraceId != null && !spanTraceId.isBlank()) {
      traceId = spanTraceId;
    }
    if (traceId == null) {
      traceId = UUID.randomUUID().toString();
    }
    requestContext.setProperty(TRACE_ID_PROPERTY, traceId);
    MDC.put("traceId", traceId);
  }

  @Override
  @SuppressWarnings("PMD.LawOfDemeter")
  public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
    var traceId = traceId(requestContext);
    var responseHeaders = responseContext.getHeaders();
    if (traceId != null && responseHeaders.getFirst(TRACE_ID_HEADER) == null) {
      responseHeaders.putSingle(TRACE_ID_HEADER, traceId);
    }
    MDC.remove("traceId");
  }

  public static String traceId(ContainerRequestContext requestContext) {
    var property = requestContext.getProperty(TRACE_ID_PROPERTY);
    if (property instanceof String traceId && !traceId.isBlank()) {
      return traceId;
    }
    return normalize(requestContext.getHeaderString(TRACE_ID_HEADER));
  }

  private static String normalize(String traceId) {
    if (traceId == null) {
      return null;
    }
    var normalized = traceId.trim();
    return normalized.isEmpty() ? null : normalized;
  }

  private static String parseTraceParent(String traceParent) {
    var normalized = normalize(traceParent);
    if (normalized == null) {
      return null;
    }
    var segments = normalized.split("-");
    if (segments.length < 4) {
      return null;
    }
    var traceId = segments[1];
    return traceId.matches("[0-9a-fA-F]{32}") ? traceId : null;
  }
}