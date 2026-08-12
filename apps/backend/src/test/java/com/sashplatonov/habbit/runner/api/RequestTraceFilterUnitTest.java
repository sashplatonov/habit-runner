package com.sashplatonov.habbit.runner.api;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.core.MultivaluedHashMap;
import jakarta.ws.rs.core.MultivaluedMap;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class RequestTraceFilterUnitTest {

  @Test
  void shouldGenerateAndExposeTraceIdWhenRequestHasNoHeader() {
    var properties = new HashMap<String, Object>();
    var requestContext = requestContext(properties, Map.of());
    var filter = new RequestTraceFilter();

    filter.filter(requestContext);

    var traceId = RequestTraceFilter.traceId(requestContext);
    assertNotNull(traceId);
    assertTrue(traceId.matches("[0-9a-f-]{36}"));
    assertEquals(traceId, MDC.get("traceId"));
    assertEquals(traceId, MDC.get("trace_id"));
    filter.filter(requestContext, responseContext(new MultivaluedHashMap<>()));
  }

  @Test
  void shouldPropagateTraceIdToResponseHeadersAndClearMdc() {
    var properties = new HashMap<String, Object>();
    var forwardedTraceId = "6f2cbe84-68b5-46f0-a69a-e35e857be124";
    var requestContext = requestContext(properties, Map.of(RequestTraceFilter.TRACE_ID_HEADER, forwardedTraceId));
    MultivaluedMap<String, Object> responseHeaders = new MultivaluedHashMap<>();
    var responseContext = responseContext(responseHeaders);
    var filter = new RequestTraceFilter();

    filter.filter(requestContext);
    var traceId = RequestTraceFilter.traceId(requestContext);
    filter.filter(requestContext, responseContext);

    assertEquals(traceId, responseHeaders.getFirst(RequestTraceFilter.TRACE_ID_HEADER));
    assertNull(MDC.get("traceId"));
    assertNull(MDC.get("trace_id"));
  }

  @Test
  void shouldAcceptValidTraceParentWhenRequestPropertyIsMissing() {
    var traceId = "4bf92f3577b34da6a3ce929d0e0e4736";
    var requestContext = requestContext(new HashMap<>(), Map.of(
        "traceparent", "00-" + traceId + "-00f067aa0ba902b7-01"
    ));

    var filter = new RequestTraceFilter();
    filter.filter(requestContext);

    assertEquals(traceId, RequestTraceFilter.traceId(requestContext));
    filter.filter(requestContext, responseContext(new MultivaluedHashMap<>()));
  }

  @Test
  void shouldReplaceInvalidForwardedTraceId() {
    var untrustedTraceId = "client-trace-id";
    var requestContext = requestContext(new HashMap<>(), Map.of(RequestTraceFilter.TRACE_ID_HEADER, untrustedTraceId));
    var filter = new RequestTraceFilter();

    filter.filter(requestContext);

    var traceId = RequestTraceFilter.traceId(requestContext);
    assertNotNull(traceId);
    assertFalse(traceId.isBlank());
    assertNotEquals(untrustedTraceId, traceId);
    filter.filter(requestContext, responseContext(new MultivaluedHashMap<>()));
  }

  private ContainerRequestContext requestContext(Map<String, Object> properties, Map<String, String> headers) {
    return (ContainerRequestContext) Proxy.newProxyInstance(
        ContainerRequestContext.class.getClassLoader(),
        new Class<?>[]{ContainerRequestContext.class},
        (instance, method, args) -> switch (method.getName()) {
          case "getHeaderString" -> headers.get(args[0]);
          case "setProperty" -> {
            properties.put((String) args[0], args[1]);
            yield null;
          }
          case "getProperty" -> properties.get(args[0]);
          default -> null;
        }
    );
  }

  private ContainerResponseContext responseContext(MultivaluedMap<String, Object> headers) {
    return (ContainerResponseContext) Proxy.newProxyInstance(
        ContainerResponseContext.class.getClassLoader(),
        new Class<?>[]{ContainerResponseContext.class},
        (instance, method, args) -> "getHeaders".equals(method.getName()) ? headers : null
    );
  }
}
