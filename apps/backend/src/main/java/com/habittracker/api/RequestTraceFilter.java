package com.habittracker.api;

import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import org.slf4j.MDC;
import io.opentelemetry.api.trace.Span;
import io.opentelemetry.api.trace.SpanContext;

import java.util.UUID;

@Provider
@Priority(Priorities.AUTHENTICATION - 100)
@SuppressWarnings({"PMD.LawOfDemeter", "PMD.AvoidCatchingGenericException"})
public class RequestTraceFilter implements ContainerRequestFilter, ContainerResponseFilter {
  public static final String TRACE_ID_HEADER = "x-trace-id";
  private static final String TRACE_ID_PROPERTY = RequestTraceFilter.class.getName() + ".traceId";

  @Override
  public void filter(ContainerRequestContext requestContext) {
    // Prefer an existing OpenTelemetry span trace id (if the tracer has already created one),
    // otherwise use client-provided header or a generated UUID.
    String spanTraceId = null;
    try {
      SpanContext sc = Span.current().getSpanContext();
      if (sc != null && sc.isValid()) {
        spanTraceId = sc.getTraceId();
      }
    } catch (Throwable ignored) {
      // If OpenTelemetry APIs are not available at runtime, fall back to header/UUID.
    }

    var traceId = normalize(requestContext.getHeaderString(TRACE_ID_HEADER));
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
}