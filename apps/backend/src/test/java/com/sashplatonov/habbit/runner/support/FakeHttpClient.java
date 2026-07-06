package com.sashplatonov.habbit.runner.support;

import java.io.IOException;
import java.net.Authenticator;
import java.net.CookieHandler;
import java.net.ProxySelector;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Executor;
import java.util.concurrent.Flow;

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
    var subscriber = responseBodyHandler.apply(new FakeResponseInfo(response.statusCode()));
    subscriber.onSubscribe(new Flow.Subscription() {
      @Override
      public void request(long itemCount) {
      }

      @Override
      public void cancel() {
      }
    });
    subscriber.onNext(List.of(ByteBuffer.wrap(response.body().getBytes(StandardCharsets.UTF_8))));
    subscriber.onComplete();
    var body = subscriber.getBody().toCompletableFuture().join();
    return new FakeHttpResponse<>(request, response.statusCode(), body);
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
