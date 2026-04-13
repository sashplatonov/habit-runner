package com.sashplatonov.habbit.runner.api;

import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validation;
import jakarta.validation.constraints.NotBlank;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Request;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;

import java.lang.reflect.Proxy;
import com.sashplatonov.habbit.runner.support.TestHelpers;
import java.net.URI;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ApiSupportTest {

  @Test
  void shouldBuildRedirectResponseWhenLocationProvided() {
    var response = ApiResponses.redirect("https://example.test/next");
    assertEquals(302, TestHelpers.statusOf(response));
    assertEquals(URI.create("https://example.test/next"), TestHelpers.locationOf(response));
  }

  @Test
  void shouldBuildCreatedResponseWhenPayloadProvided() {
    var response = ApiResponses.created("created-payload");

    assertEquals(201, TestHelpers.statusOf(response));
    assertEquals("created-payload", TestHelpers.entityOf(response));
  }

  @Test
  void shouldBuildNoContentResponseWhenRequested() {
    var response = ApiResponses.noContent();
    assertEquals(204, TestHelpers.statusOf(response));
  }

  @Test
  void shouldBuildNoStoreResponseWithCacheHeadersWhenRequested() {
    var response = ApiResponses.noStore("payload", "trace-1", 42);
    assertEquals(200, TestHelpers.statusOf(response));
    assertEquals("payload", TestHelpers.entityOf(response));
    assertEquals("trace-1", response.getHeaderString("x-trace-id"));
    assertEquals("42", response.getHeaderString("x-sync-duration-ms"));
    assertEquals("app;dur=42", response.getHeaderString("Server-Timing"));
    assertEquals("no-store, no-cache, must-revalidate, proxy-revalidate", response.getHeaderString(HttpHeaders.CACHE_CONTROL));
    assertEquals("no-cache", response.getHeaderString("Pragma"));
    assertEquals("0", response.getHeaderString("Expires"));
  }

  @Test
  void shouldMapConstraintViolationWhenValidationFails() {
    var response = new ConstraintViolationExceptionMapper().toResponse(blankValueViolation());
    assertEquals(400, TestHelpers.statusOf(response));
    var mediaType = TestHelpers.mediaTypeOf(response);
    assertEquals("application/json", mediaType.toString());
    ErrorResponse error = TestHelpers.entityOf(response);
    assertEquals(400, error.status());

    assertTrue(error.detail().contains("must not be blank"));
    assertEquals("VALIDATION_FAILED", error.errorCode());
  }

  @Test
  void shouldMapUnauthorizedResponseWhenAuthorizationFails() {
    var response = new GlobalExceptionMapper().toResponse(new NotAuthorizedException("Invalid credentials"));
    assertEquals(403, TestHelpers.statusOf(response));
    var mediaType = TestHelpers.mediaTypeOf(response);
    assertEquals("application/json", mediaType.toString());
    ErrorResponse error = TestHelpers.entityOf(response);
    assertEquals(403, error.status());

    assertEquals("Forbidden", error.title());
    assertEquals("Authentication required", error.detail());
  }

  @Test
  void shouldMapNotFoundAndBadRequestResponsesWhenKnownExceptionsThrown() {
    var mapper = new GlobalExceptionMapper();
    var notFoundResponse = mapper.toResponse(new NotFoundException());
    assertEquals(404, TestHelpers.statusOf(notFoundResponse));
    var notFoundMedia = TestHelpers.mediaTypeOf(notFoundResponse);
    assertEquals("application/json", notFoundMedia.toString());
    ErrorResponse notFound = TestHelpers.entityOf(notFoundResponse);
    assertEquals(404, notFound.status());

    var badRequestResponse = mapper.toResponse(new BadRequestException("Bad input"));
    assertEquals(400, TestHelpers.statusOf(badRequestResponse));
    var badRequestMedia = TestHelpers.mediaTypeOf(badRequestResponse);
    assertEquals("application/json", badRequestMedia.toString());
    ErrorResponse badRequest = TestHelpers.entityOf(badRequestResponse);
    assertEquals(400, badRequest.status());

    assertEquals("Not Found", notFound.title());
    assertEquals("Resource not found", notFound.detail());
    assertEquals("Bad input", badRequest.detail());
  }

  @Test
  void shouldMapWebApplicationExceptionWhenStatusAlreadyDefined() {
    var response = new GlobalExceptionMapper().toResponse(new WebApplicationException(Response.status(422).build()));
    assertEquals(422, TestHelpers.statusOf(response));
    var mediaType422 = TestHelpers.mediaTypeOf(response);
    assertEquals("application/json", mediaType422.toString());
    ErrorResponse error = TestHelpers.entityOf(response);
    assertEquals(422, error.status());

    assertEquals("Request Failed", error.title());
    assertEquals("REQUEST_REJECTED", error.errorCode());
  }

  @Test
  void shouldMapUnhandledExceptionToInternalServerError() {
    var response = new GlobalExceptionMapper().toResponse(new IllegalStateException("boom"));
    assertEquals(500, TestHelpers.statusOf(response));
    var mediaType500 = TestHelpers.mediaTypeOf(response);
    assertEquals("application/json", mediaType500.toString());
    ErrorResponse error = TestHelpers.entityOf(response);
    assertEquals(500, error.status());

    assertEquals("Internal Server Error", error.title());
    assertEquals("Internal server error", error.detail());
  }

  @Test
  void shouldUseRequestContextDataWhenMappingClientFailures() {
    var mapper = new GlobalExceptionMapper();
    setField(mapper, "request", proxy(Request.class, Map.of("getMethod", "PATCH")));
    setField(mapper, "uriInfo", proxy(UriInfo.class, Map.of("getPath", "/auth/preferences")));
    setField(mapper, "headers", proxy(HttpHeaders.class, Map.of("getHeaderString:X-Forwarded-For", "198.51.100.7, 10.0.0.1")));
    MDC.put("traceId", "trace-123");

    try {
      var response = mapper.toResponse(new BadRequestException("Bad input"));
      assertEquals(400, TestHelpers.statusOf(response));
      var media400 = TestHelpers.mediaTypeOf(response);
      assertEquals("application/json", media400.toString());
      ErrorResponse error = TestHelpers.entityOf(response);
      assertEquals(400, error.status());

      assertEquals("Bad input", error.detail());
      assertEquals("BAD_REQUEST", error.errorCode());
    } finally {
      MDC.remove("traceId");
    }
  }

  private ConstraintViolationException blankValueViolation() {
    try (var factory = Validation.buildDefaultValidatorFactory()) {
      var violations = factory.getValidator().validate(new ValidationPayload(""));
      return new ConstraintViolationException(violations);
    }
  }

  

  private record ValidationPayload(@NotBlank String value) {
  }

  private static <T> T proxy(Class<T> type, Map<String, Object> values) {
    return (T) Proxy.newProxyInstance(
        type.getClassLoader(),
        new Class<?>[]{type},
        (instance, method, args) -> {
          var key = method.getName() + (args == null || args.length == 0 ? "" : ":" + args[0]);
          if (values.containsKey(key)) {
            return values.get(key);
          }
          if (values.containsKey(method.getName())) {
            return values.get(method.getName());
          }
          return null;
        }
    );
  }

  // Response helpers moved to TestHelpers

  private static void setField(Object target, String name, Object value) {
    try {
      var f = GlobalExceptionMapper.class.getDeclaredField(name);
      f.setAccessible(true);
      f.set(target, value);
    } catch (ReflectiveOperationException e) {
      throw new RuntimeException(e);
    }
  }
}