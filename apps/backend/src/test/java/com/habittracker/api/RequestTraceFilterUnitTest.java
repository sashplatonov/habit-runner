package com.habittracker.api;

import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerResponseContext;
import jakarta.ws.rs.core.MultivaluedHashMap;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;

@SuppressWarnings({"PMD.LawOfDemeter", "PMD.LooseCoupling"})
class RequestTraceFilterUnitTest {

  @Test
  void shouldGenerateAndExposeTraceIdWhenRequestHasNoHeader() {
    var properties = new HashMap<String, Object>();
    var requestContext = requestContext(properties, null);
    var filter = new RequestTraceFilter();

    filter.filter(requestContext);

    var traceId = RequestTraceFilter.traceId(requestContext);
    assertNotNull(traceId);
    assertEquals(traceId, MDC.get("traceId"));
  }

  @Test
  void shouldPropagateTraceIdToResponseHeadersAndClearMdc() {
    var properties = new HashMap<String, Object>();
    var requestContext = requestContext(properties, "client-trace");
    var responseHeaders = new MultivaluedHashMap<String, Object>();
    var responseContext = responseContext(responseHeaders);
    var filter = new RequestTraceFilter();

    filter.filter(requestContext);
    var traceId = RequestTraceFilter.traceId(requestContext);
    filter.filter(requestContext, responseContext);

    assertEquals(traceId, responseHeaders.getFirst(RequestTraceFilter.TRACE_ID_HEADER));
    assertNull(MDC.get("traceId"));
  }

  @Test
  void shouldFallbackToHeaderTraceIdWhenRequestPropertyIsMissing() {
    var requestContext = requestContext(new HashMap<>(), "client-trace-id");

    var traceId = RequestTraceFilter.traceId(requestContext);

    assertEquals("client-trace-id", traceId);
  }

  private ContainerRequestContext requestContext(Map<String, Object> properties, String headerValue) {
    return (ContainerRequestContext) Proxy.newProxyInstance(
        ContainerRequestContext.class.getClassLoader(),
        new Class<?>[]{ContainerRequestContext.class},
        (instance, method, args) -> switch (method.getName()) {
          case "getHeaderString" -> RequestTraceFilter.TRACE_ID_HEADER.equals(args[0]) ? headerValue : null;
          case "setProperty" -> {
            properties.put((String) args[0], args[1]);
            yield null;
          }
          case "getProperty" -> properties.get(args[0]);
          default -> null;
        }
    );
  }

  private ContainerResponseContext responseContext(MultivaluedHashMap<String, Object> headers) {
    return (ContainerResponseContext) Proxy.newProxyInstance(
        ContainerResponseContext.class.getClassLoader(),
        new Class<?>[]{ContainerResponseContext.class},
        (instance, method, args) -> "getHeaders".equals(method.getName()) ? headers : null
    );
  }
}