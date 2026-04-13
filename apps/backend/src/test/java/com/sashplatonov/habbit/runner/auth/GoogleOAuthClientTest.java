package com.sashplatonov.habbit.runner.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotAuthorizedException;
import org.junit.jupiter.api.Test;

import javax.net.ssl.SSLContext;
import javax.net.ssl.SSLParameters;
import javax.net.ssl.SSLSession;
import java.io.IOException;
import java.net.Authenticator;
import java.net.CookieHandler;
import java.net.ProxySelector;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SuppressWarnings({"PMD.CouplingBetweenObjects", "PMD.LawOfDemeter"})
class GoogleOAuthClientTest {

  private final ObjectMapper objectMapper = new ObjectMapper();

  @Test
  void shouldBuildAuthorizationUrlWhenGoogleOauthIsConfigured() {
    var client = new GoogleOAuthClient(TestConfigFactory.defaultAuthConfig(), objectMapper, new FakeHttpClient());

    var url = client.buildAuthorizationUrl("state-token", "https://app.example.test/auth/callback");

    assertTrue(url.startsWith("https://accounts.google.com/o/oauth2/v2/auth?client_id="));
    assertTrue(url.contains("state=state-token"));
    assertTrue(url.contains("redirect_uri=https%3A%2F%2Fapp.example.test%2Fauth%2Fcallback"));
  }

  @Test
  void shouldRejectAuthorizationUrlWhenGoogleOauthIsMissing() {
    var client = new GoogleOAuthClient(blankGoogleConfig(), objectMapper, new FakeHttpClient());

    var exception = assertThrows(
        BadRequestException.class,
        () -> client.buildAuthorizationUrl("state-token", "https://app.example.test/auth/callback")
    );

    assertEquals("Google OAuth is not configured on this server", exception.getMessage());
  }

  @Test
  void shouldReturnEmailWhenGoogleExchangeSucceeds() {
    var httpClient = new FakeHttpClient()
        .enqueueResponse(200, "{\"access_token\":\"token-123\"}")
        .enqueueResponse(200, "{\"email\":\"user@example.test\"}");
    var client = new GoogleOAuthClient(TestConfigFactory.defaultAuthConfig(), objectMapper, httpClient);

    var email = client.exchangeCodeForEmail("code-123", "https://app.example.test/auth/callback");

    assertEquals("user@example.test", email);
    assertEquals(2, httpClient.requestCount());
    assertEquals("POST", httpClient.requestAt(0).method());
    assertEquals("GET", httpClient.requestAt(1).method());
    assertTrue(httpClient.requestAt(1).headers().firstValue("Authorization").orElseThrow().startsWith("Bearer token-123"));
  }

  @Test
  void shouldRejectWhenGoogleTokenExchangeReturnsNonSuccessStatus() {
    var client = new GoogleOAuthClient(
        TestConfigFactory.defaultAuthConfig(),
        objectMapper,
        new FakeHttpClient().enqueueResponse(401, "{}")
    );

    var exception = assertThrows(
      NotAuthorizedException.class,
      () -> client.exchangeCodeForEmail("code-123", "https://app.example.test/auth/callback")
    );

    assertEquals(401, exception.getResponse().getStatus());
  }

  @Test
  void shouldRejectWhenGoogleTokenExchangeReturnsNoAccessToken() {
    var client = new GoogleOAuthClient(
        TestConfigFactory.defaultAuthConfig(),
        objectMapper,
        new FakeHttpClient().enqueueResponse(200, "{\"token_type\":\"Bearer\"}")
    );

    var exception = assertThrows(
      NotAuthorizedException.class,
      () -> client.exchangeCodeForEmail("code-123", "https://app.example.test/auth/callback")
    );

    assertEquals(401, exception.getResponse().getStatus());
  }

  @Test
  void shouldRejectWhenGoogleUserInfoReturnsNonSuccessStatus() {
    var client = new GoogleOAuthClient(
        TestConfigFactory.defaultAuthConfig(),
        objectMapper,
        new FakeHttpClient()
            .enqueueResponse(200, "{\"access_token\":\"token-123\"}")
            .enqueueResponse(403, "{}")
    );

    var exception = assertThrows(
      NotAuthorizedException.class,
      () -> client.exchangeCodeForEmail("code-123", "https://app.example.test/auth/callback")
    );

    assertEquals(401, exception.getResponse().getStatus());
  }

  @Test
  void shouldRejectWhenGoogleUserInfoReturnsNoEmail() {
    var client = new GoogleOAuthClient(
        TestConfigFactory.defaultAuthConfig(),
        objectMapper,
        new FakeHttpClient()
            .enqueueResponse(200, "{\"access_token\":\"token-123\"}")
            .enqueueResponse(200, "{\"sub\":\"123\"}")
    );

    var exception = assertThrows(
      NotAuthorizedException.class,
      () -> client.exchangeCodeForEmail("code-123", "https://app.example.test/auth/callback")
    );

    assertEquals(401, exception.getResponse().getStatus());
  }

  @Test
  void shouldWrapIoFailuresDuringGoogleExchange() {
    var client = new GoogleOAuthClient(
        TestConfigFactory.defaultAuthConfig(),
        objectMapper,
        new FakeHttpClient().enqueueFailure(new IOException("network-down"))
    );

    var exception = assertThrows(
        NotAuthorizedException.class,
        () -> client.exchangeCodeForEmail("code-123", "https://app.example.test/auth/callback")
    );

    assertEquals("OAuth exchange error: network-down", exception.getMessage());
  }

  @Test
  void shouldWrapInterruptedGoogleExchangeAndRestoreThreadInterrupt() {
    var client = new GoogleOAuthClient(
        TestConfigFactory.defaultAuthConfig(),
        objectMapper,
        new FakeHttpClient().enqueueFailure(new InterruptedException("interrupted"))
    );

    var exception = assertThrows(
        NotAuthorizedException.class,
        () -> client.exchangeCodeForEmail("code-123", "https://app.example.test/auth/callback")
    );

    assertEquals("OAuth exchange interrupted", exception.getMessage());
    assertTrue(Thread.currentThread().isInterrupted());
    Thread.interrupted();
  }

  private AuthConfig blankGoogleConfig() {
    return new AuthConfig() {
      @Override
      public String secret() {
        return TestConfigFactory.defaultAuthConfig().secret();
      }

      @Override
      public int accessTokenTtlSeconds() {
        return 3600;
      }

      @Override
      public int refreshTokenDays() {
        return 30;
      }

      @Override
      public String apiPublicUrl() {
        return "https://api.example.test";
      }

      @Override
      public String oauthDefaultReturnTo() {
        return "https://app.example.test";
      }

      @Override
      public Optional<String> googleClientId() {
        return Optional.empty();
      }

      @Override
      public Optional<String> googleClientSecret() {
        return Optional.empty();
      }

      @Override
      public String issuer() {
        return "habittracker-test";
      }
    };
  }

  @SuppressWarnings("PMD.TooManyMethods")
  private static final class FakeHttpClient extends HttpClient {
    private final Deque<Object> outcomes = new ArrayDeque<>();
    private final java.util.List<HttpRequest> requests = new java.util.ArrayList<>();

    FakeHttpClient enqueueResponse(int statusCode, String body) {
      outcomes.addLast(new FakeResponsePayload(statusCode, body));
      return this;
    }

    FakeHttpClient enqueueFailure(Exception exception) {
      outcomes.addLast(exception);
      return this;
    }

    int requestCount() {
      return requests.size();
    }

    HttpRequest requestAt(int index) {
      return requests.get(index);
    }

    @Override
    public Optional<CookieHandler> cookieHandler() {
      return Optional.empty();
    }

    @Override
    public Optional<Duration> connectTimeout() {
      return Optional.of(Duration.ofSeconds(1));
    }

    @Override
    public Redirect followRedirects() {
      return Redirect.NEVER;
    }

    @Override
    public Optional<ProxySelector> proxy() {
      return Optional.empty();
    }

    @Override
    public SSLContext sslContext() {
      return null;
    }

    @Override
    public SSLParameters sslParameters() {
      return new SSLParameters();
    }

    @Override
    public Optional<Authenticator> authenticator() {
      return Optional.empty();
    }

    @Override
    public Version version() {
      return Version.HTTP_1_1;
    }

    @Override
    public Optional<Executor> executor() {
      return Optional.empty();
    }

    @Override
    public <T> HttpResponse<T> send(HttpRequest request, HttpResponse.BodyHandler<T> responseBodyHandler)
        throws IOException, InterruptedException {
      requests.add(request);
      var outcome = outcomes.removeFirst();
      if (outcome instanceof IOException ioException) {
        throw ioException;
      }
      if (outcome instanceof InterruptedException interruptedException) {
        throw interruptedException;
      }
      var response = (FakeResponsePayload) outcome;
      var typedResponse = (HttpResponse<T>) new FakeStringResponse(request, response.statusCode(), response.body());
      return typedResponse;
    }

    @Override
    public <T> CompletableFuture<HttpResponse<T>> sendAsync(HttpRequest request, HttpResponse.BodyHandler<T> responseBodyHandler) {
      return CompletableFuture.failedFuture(new UnsupportedOperationException("Not needed in tests"));
    }

    @Override
    public <T> CompletableFuture<HttpResponse<T>> sendAsync(
        HttpRequest request,
        HttpResponse.BodyHandler<T> responseBodyHandler,
        HttpResponse.PushPromiseHandler<T> pushPromiseHandler
    ) {
      return CompletableFuture.failedFuture(new UnsupportedOperationException("Not needed in tests"));
    }
  }

  private record FakeResponsePayload(int statusCode, String body) {
  }

  private record FakeStringResponse(HttpRequest request, int statusCode, String body) implements HttpResponse<String> {

    @Override
    public Optional<HttpResponse<String>> previousResponse() {
      return Optional.empty();
    }

    @Override
    public HttpHeaders headers() {
      return HttpHeaders.of(Map.of(), (left, right) -> true);
    }

    @Override
    public Optional<SSLSession> sslSession() {
      return Optional.empty();
    }

    @Override
    public URI uri() {
      return request.uri();
    }

    @Override
    public HttpClient.Version version() {
      return HttpClient.Version.HTTP_1_1;
    }
  }
}