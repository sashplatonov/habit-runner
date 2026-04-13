package com.sashplatonov.habbit.runner.support;

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
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;

/**
 * Test-only HttpClient shim used by unit tests.
 *
 * This class must subclass `java.net.http.HttpClient` to be injectable into
 * production constructors used by tests. Subclassing the JDK HttpClient
 * requires implementing several framework methods which increases coupling
 * and method count. These are test-only implementation details and do not
 * affect production behavior, so we suppress the specific PMD rules here.
 */
@SuppressWarnings({"PMD.CouplingBetweenObjects", "PMD.TooManyMethods"})
public final class FakeHttpClient extends HttpClient {
  private final Deque<Object> outcomes = new ArrayDeque<>();
  private final List<HttpRequest> requests = new ArrayList<>();

  public FakeHttpClient enqueueResponse(int statusCode, String body) {
    outcomes.addLast(new FakeResponsePayload(statusCode, body));
    return this;
  }

  public FakeHttpClient enqueueFailure(Exception exception) {
    outcomes.addLast(exception);
    return this;
  }

  public int requestCount() {
    return requests.size();
  }

  public HttpRequest requestAt(int index) {
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
  public javax.net.ssl.SSLContext sslContext() {
    return null;
  }

  @Override
  public javax.net.ssl.SSLParameters sslParameters() {
    return new javax.net.ssl.SSLParameters();
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
    @SuppressWarnings("unchecked")
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

  private record FakeResponsePayload(int statusCode, String body) {
  }

  private static final class FakeStringResponse implements HttpResponse<String> {
    private final HttpRequest request;
    private final int statusCode;
    private final String body;

    FakeStringResponse(HttpRequest request, int statusCode, String body) {
      this.request = request;
      this.statusCode = statusCode;
      this.body = body;
    }

    @Override
    public Optional<HttpResponse<String>> previousResponse() {
      return Optional.empty();
    }

    @Override
    public HttpHeaders headers() {
      return HttpHeaders.of(Map.of(), (left, right) -> true);
    }

    @Override
    public Optional<javax.net.ssl.SSLSession> sslSession() {
      return Optional.empty();
    }

    @Override
    public URI uri() {
      return request.uri();
    }

    @Override
    public Version version() {
      return Version.HTTP_1_1;
    }

    @Override
    public int statusCode() {
      return statusCode;
    }

    @Override
    public String body() {
      return body;
    }

    @Override
    public HttpRequest request() {
      return request;
    }
  }
}
