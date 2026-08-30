package com.sashplatonov.habbit.runner.api;

import com.sashplatonov.habbit.runner.support.TestHelpers;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotAuthorizedException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class AuthErrorStatusContractTest {

  @Test
  void shouldMapNotAuthorizedToForbiddenWithAuthRequired() {
    var response = new GlobalExceptionMapper().toResponse(new NotAuthorizedException("Invalid credentials"));

    assertEquals(403, TestHelpers.statusOf(response));
    assertEquals("application/json", TestHelpers.mediaTypeOf(response).toString());
    var error = TestHelpers.entityOf(response, ErrorResponse.class);
    assertEquals(403, error.status());
    assertEquals("Forbidden", error.title());
    assertEquals("Authentication required", error.detail());
    assertEquals("AUTH_REQUIRED", error.errorCode());
  }

  @Test
  void shouldMapForbiddenToForbiddenWithRequestRejected() {
    var response = new GlobalExceptionMapper().toResponse(new ForbiddenException("Insufficient rights"));

    assertEquals(403, TestHelpers.statusOf(response));
    assertEquals("application/json", TestHelpers.mediaTypeOf(response).toString());
    var error = TestHelpers.entityOf(response, ErrorResponse.class);
    assertEquals(403, error.status());
    assertEquals("Forbidden", error.title());
    assertEquals("Insufficient rights", error.detail());
    assertEquals("REQUEST_REJECTED", error.errorCode());
  }
}
