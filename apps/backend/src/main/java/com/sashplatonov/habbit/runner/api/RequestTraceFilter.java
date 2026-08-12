package com.sashplatonov.habbit.runner.api;

import jakarta.annotation.Priority;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.container.ContainerResponseFilter;
import jakarta.ws.rs.ext.Provider;
import org.slf4j.MDC;

import java.util.UUID;

@Provider
@Priority(Priorities.AUTHENTICATION - 100)
// ContainerRequestContext/ResponseContext method chaining is idiomatic in JAX-RS.
// Wrapping each accessor in an adapter class would add indirection with no real benefit.
public class RequestTraceFilter implements ContainerRequestFilter, ContainerResponseFilter {
  public static final String TRACE_ID_HEADER = "x-trace-id";
  private static final String TRACE_ID_PROPERTY = RequestTraceFilter.class.getName() + ".traceId";

  @Override
  public void filter(ContainerRequestContext requestContext) {
    var traceId = resolveTraceId(requestContext);
    requestContext.setProperty(TRACE_ID_PROPERTY, traceId);
    MDC.put("traceId", traceId);
    MDC.put("trace_id", traceId);
  }

  @Override
  public void filter(ContainerRequestContext requestContext, ContainerResponseContext responseContext) {
    var traceId = traceId(requestContext);
    if (traceId != null) {
      new ResponseHeaders(responseContext).putIfMissing(TRACE_ID_HEADER, traceId);
    }
    MDC.remove("traceId");
    MDC.remove("trace_id");
  }

  private String resolveTraceId(ContainerRequestContext requestContext) {
    var traceParent = parseTraceParent(requestContext.getHeaderString("traceparent"));
    if (traceParent != null) {
      return traceParent;
    }
    var forwardedTraceId = normalize(requestContext.getHeaderString(TRACE_ID_HEADER));
    return forwardedTraceId == null ? UUID.randomUUID().toString() : forwardedTraceId;
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
