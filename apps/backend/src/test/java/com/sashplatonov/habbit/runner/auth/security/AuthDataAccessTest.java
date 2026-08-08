package com.sashplatonov.habbit.runner.auth.security;

import com.sashplatonov.habbit.runner.auth.access.OAuthStateAccess;
import com.sashplatonov.habbit.runner.auth.access.UserAccess;
import com.sashplatonov.habbit.runner.auth.client.GoogleOAuthClient;
import com.sashplatonov.habbit.runner.auth.config.AuthConfig;
import com.sashplatonov.habbit.runner.auth.resource.AuthResource;
import com.sashplatonov.habbit.runner.auth.resource.AuthThemeResource;
import com.sashplatonov.habbit.runner.auth.security.AuthGuardFilter;
import com.sashplatonov.habbit.runner.auth.security.BearerTokenExtractor;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.CsrfGuardFilter;
import com.sashplatonov.habbit.runner.auth.security.JwtUtil;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.auth.service.AuthService;
import com.sashplatonov.habbit.runner.auth.service.PreferencesService;
import com.sashplatonov.habbit.runner.auth.service.RefreshTokenService;
import com.sashplatonov.habbit.runner.auth.service.UserService;
import com.sashplatonov.habbit.runner.auth.support.AuthCollaborators;
import com.sashplatonov.habbit.runner.auth.support.AuthCookieBuilder;
import com.sashplatonov.habbit.runner.auth.support.AuthSupport;
import com.sashplatonov.habbit.runner.auth.support.OAuthCallbackSession;
import com.sashplatonov.habbit.runner.auth.support.OAuthHelper;
import com.sashplatonov.habbit.runner.auth.support.OAuthSupport;
import com.sashplatonov.habbit.runner.auth.support.ThemeCatalog;
import com.sashplatonov.habbit.runner.auth.dto.UpdatePreferencesRequest;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.support.AuthenticatedApiTestSupport;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotAuthorizedException;
import jakarta.ws.rs.container.ContainerRequestContext;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@QuarkusTest
class AuthDataAccessTest extends AuthenticatedApiTestSupport {

  private static final Map<Class<?>, Object> PRIMITIVE_DEFAULTS = Map.of(
      boolean.class, false,
      byte.class, (byte) 0,
      char.class, '\0',
      double.class, 0D,
      float.class, 0F,
      int.class, 0,
      long.class, 0L,
      short.class, (short) 0
  );

  @Inject
  AuthService authService;

  @Test
  void shouldReturnStoredPreferencesWhenUserExists() throws Exception {
    var user = createAuthenticatedUser("mint");
    inTransaction(() -> {
      var entity = UserEntity.<UserEntity>findById(user.id());
      entity.setTimezone("Europe/Berlin");
    });

    var response = new PreferencesService().getUserPreferences(user.id());

    assertEquals("mint", response.theme());
    assertEquals("Europe/Berlin", response.timezone());
  }

  @Test
  void shouldNormalizeThemeAndTimezoneWhenPreferencesUpdated() throws Exception {
    var user = createAuthenticatedUser("cloud");
    var response = inTransaction(() -> new PreferencesService().updateUserPreferences(
        user.id(),
        new UpdatePreferencesRequest("sakura", "America/New_York")
    ));

    assertEquals("sakura", response.theme());
    assertEquals("America/New_York", response.timezone());
    assertEquals("sakura", UserEntity.<UserEntity>findById(user.id()).getTheme());
  }

  @Test
  void shouldClearTimezoneWhenPreferencesUpdatedWithBlankTimezone() throws Exception {
    var user = createAuthenticatedUser("cloud");
    inTransaction(() -> {
      var entity = UserEntity.<UserEntity>findById(user.id());
      entity.setTimezone("Europe/Paris");
    });

    var response = inTransaction(() -> new PreferencesService().updateUserPreferences(
        user.id(),
        new UpdatePreferencesRequest("unsupported-theme", " ")
    ));

    assertEquals("cloud", response.theme());
    assertNull(response.timezone());
    assertNull(UserEntity.<UserEntity>findById(user.id()).getTimezone());
  }

  @Test
  void shouldThrowUnauthorizedWhenPreferencesRequestedForMissingUser() {
    assertThrows(NotAuthorizedException.class, () -> new PreferencesService().getUserPreferences(UUID.randomUUID().toString()));
  }

  @Test
  void shouldThrowUnauthorizedWhenPreferencesUpdatedForMissingUser() {
    assertThrows(
        NotAuthorizedException.class,
        () -> new PreferencesService().updateUserPreferences(UUID.randomUUID().toString(), new UpdatePreferencesRequest("cloud", null))
    );
  }

  @Test
  void shouldCreateUserWhenEmailNotFound() throws Exception {
    var email = UUID.randomUUID() + "@example.test";
    var user = inTransaction(() -> new UserService().findOrCreateUser(email));

    assertEquals(email, user.getEmail());
    assertEquals("cloud", user.getTheme());
  }

  @Test
  void shouldReturnExistingUserWhenEmailAlreadyExists() throws Exception {
    var email = UUID.randomUUID() + "@example.test";
    var existing = inTransaction(() -> {
      var entity = new UserEntity();
      entity.setEmail(email);
      entity.setTheme("cloud");
      entity.markCreatedAt(Instant.now());
      entity.persist();
      return entity;
    });

    var result = new UserService().findOrCreateUser(email);

    assertEquals(existing.getId(), result.getId());
    assertEquals(existing.getEmail(), result.getEmail());
  }

  @Test
  void shouldStoreCurrentUserWhenAuthGuardReceivesValidBearerToken() throws Exception {
    var user = createAuthenticatedUser("cloud");
    var currentUserContext = new CurrentUserContext();

    new AuthGuardFilter(authService, currentUserContext).filter(requestContext("Bearer " + user.accessToken()));

    assertEquals(user.getId(), currentUserContext.requireUser().getId());
    assertEquals(user.email(), currentUserContext.requireUser().email());
  }

  @Test
  void shouldThrowUnauthorizedWhenAuthGuardReceivesMissingHeader() {
    var filter = new AuthGuardFilter(authService, new CurrentUserContext());

    assertThrows(NotAuthorizedException.class, () -> filter.filter(requestContext(null)));
  }

  private ContainerRequestContext requestContext(String authorizationHeader) {
    return (ContainerRequestContext) Proxy.newProxyInstance(
        ContainerRequestContext.class.getClassLoader(),
        new Class<?>[]{ContainerRequestContext.class},
        (proxy, method, args) -> switch (method.getName()) {
          case "getHeaderString" -> "Authorization".equals(args[0]) ? authorizationHeader : null;
          default -> defaultValue(method.getReturnType());
        }
    );
  }

  private Object defaultValue(Class<?> returnType) {
    if (!returnType.isPrimitive()) {
      return null;
    }
    return PRIMITIVE_DEFAULTS.get(returnType);
  }
}
