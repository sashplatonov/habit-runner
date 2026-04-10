package com.habittracker.api;

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
import java.net.URI;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SuppressWarnings("PMD.LawOfDemeter")
class ApiSupportTest {

  @Test
  void shouldBuildRedirectResponseWhenLocationProvided() {
    var response = ApiResponses.redirect("https://example.test/next");

    assertEquals(302, response.getStatus());
    assertEquals(URI.create("https://example.test/next"), response.getLocation());
  }

  @Test
  void shouldBuildCreatedResponseWhenPayloadProvided() {
    var response = ApiResponses.created("created-payload");

    assertEquals(201, response.getStatus());
    assertEquals("created-payload", response.getEntity());
  }

  @Test
  void shouldBuildNoContentResponseWhenRequested() {
    var response = ApiResponses.noContent();

    assertEquals(204, response.getStatus());
  }

  @Test
  void shouldBuildNoStoreResponseWithCacheHeadersWhenRequested() {
    var response = ApiResponses.noStore("payload", "trace-1", 42);

    assertEquals(200, response.getStatus());
    assertEquals("payload", response.getEntity());
    assertEquals("trace-1", response.getHeaderString("x-trace-id"));
    assertEquals("42", response.getHeaderString("x-sync-duration-ms"));
    assertEquals("app;dur=42", response.getHeaderString("Server-Timing"));
    assertEquals("no-store, no-cache, must-revalidate, proxy-revalidate", response.getHeaderString(HttpHeaders.CACHE_CONTROL));
    assertEquals("no-cache", response.getHeaderString("Pragma"));
    assertEquals("0", response.getHeaderString("Expires"));
  }

  @Test
  void shouldMapConstraintViolationWhenValidationFails() {
    var response = new ApiExceptionMapper().toResponse(blankValueViolation());
    var error = assertApiError(response, 400);

    assertTrue(error.message().contains("must not be blank"));
  }

  @Test
  void shouldMapUnauthorizedResponseWhenAuthorizationFails() {
    var response = new ApiExceptionMapper().toResponse(new NotAuthorizedException("Invalid credentials"));
    var error = assertApiError(response, 401);

    assertEquals("Unauthorized", error.message());
  }

  @Test
  void shouldMapNotFoundAndBadRequestResponsesWhenKnownExceptionsThrown() {
    var mapper = new ApiExceptionMapper();
    var notFound = assertApiError(mapper.toResponse(new NotFoundException()), 404);
    var badRequest = assertApiError(mapper.toResponse(new BadRequestException("Bad input")), 400);

    assertEquals("Not found", notFound.message());
    assertEquals("Bad input", badRequest.message());
  }

  @Test
  void shouldMapWebApplicationExceptionWhenStatusAlreadyDefined() {
    var response = new ApiExceptionMapper().toResponse(new WebApplicationException(Response.status(422).build()));
    var error = assertApiError(response, 422);

    assertEquals("Request failed", error.message());
  }

  @Test
  void shouldMapUnhandledExceptionToInternalServerError() {
    var response = new ApiExceptionMapper().toResponse(new IllegalStateException("boom"));
    var error = assertApiError(response, 500);

    assertEquals("Internal server error", error.message());
  }

  @Test
  void shouldUseRequestContextDataWhenMappingClientFailures() {
    var mapper = new ApiExceptionMapper();
    mapper.request = proxy(Request.class, Map.of("getMethod", "PATCH"));
    mapper.uriInfo = proxy(UriInfo.class, Map.of("getPath", "/auth/preferences"));
    mapper.headers = proxy(HttpHeaders.class, Map.of("getHeaderString:X-Forwarded-For", "198.51.100.7, 10.0.0.1"));
    MDC.put("traceId", "trace-123");

    try {
      var response = mapper.toResponse(new BadRequestException("Bad input"));
      var error = assertApiError(response, 400);

      assertEquals("Bad input", error.message());
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

  @SuppressWarnings("PMD.LawOfDemeter")
  private ApiErrorResponse assertApiError(Response response, int expectedStatus) {
    assertEquals(expectedStatus, response.getStatus());
    assertEquals("application/json", response.getMediaType().toString());
    var error = (ApiErrorResponse) response.getEntity();
    assertNotNull(error.timestamp());
    assertEquals(expectedStatus, error.status());
    return error;
  }

  private record ValidationPayload(@NotBlank String value) {
  }

  @SuppressWarnings("unchecked")
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
}