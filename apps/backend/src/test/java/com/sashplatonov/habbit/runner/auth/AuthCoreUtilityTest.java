package com.sashplatonov.habbit.runner.auth;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthCoreUtilityTest {

  @Test
  void shouldExtractTokenWhenAuthorizationHeaderUsesBearerScheme() {
    var token = BearerTokenExtractor.extract("Bearer test-token");

    assertEquals("test-token", token);
  }

  @Test
  void shouldReturnNullWhenAuthorizationHeaderMissing() {
    assertNull(BearerTokenExtractor.extract(null));
    assertNull(BearerTokenExtractor.extract("   "));
  }

  @Test
  void shouldReturnNullWhenAuthorizationHeaderUsesDifferentScheme() {
    assertNull(BearerTokenExtractor.extract("Basic test-token"));
    assertNull(BearerTokenExtractor.extract("Bearer"));
  }

  @Test
  void shouldReturnCurrentUserWhenContextInitialized() {
    var context = new CurrentUserContext();
    var expected = new CurrentUser("user-1", "user@example.test");

    context.setUser(expected);

    assertEquals(expected, context.requireUser());
  }

  @Test
  void shouldThrowUnauthorizedWhenCurrentUserMissing() {
    var context = new CurrentUserContext();

    assertThrows(jakarta.ws.rs.NotAuthorizedException.class, context::requireUser);
  }

  @Test
  void shouldKeepThemeWhenThemeIsSupported() {
    assertEquals("mint", ThemeCatalog.normalize("mint"));
  }

  @Test
  void shouldFallbackToCloudWhenThemeUnsupported() {
    assertEquals("cloud", ThemeCatalog.normalize("unknown"));
    assertEquals("cloud", ThemeCatalog.normalize(null));
  }

  @Test
  void shouldGenerateHexTokenWhenRandomTokenRequested() {
    var first = AuthSupport.randomToken(16);
    var second = AuthSupport.randomToken(16);

    assertEquals(32, first.length());
    assertEquals(32, second.length());
    assertNotEquals(first, second);
    assertTrue(first.matches("[0-9a-f]+"));
  }

  @Test
  void shouldEncodeReservedCharactersWhenUrlEncodingRequested() {
    var encoded = AuthSupport.urlEncode("a+b test@example.test");

    assertEquals("a%2Bb+test%40example.test", encoded);
  }
}