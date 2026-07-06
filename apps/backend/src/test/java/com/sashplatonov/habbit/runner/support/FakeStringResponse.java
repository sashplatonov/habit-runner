package com.sashplatonov.habbit.runner.support;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.Map;
import java.util.Optional;

final class FakeStringResponse implements HttpResponse<String> {
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
  public HttpClient.Version version() {
    return HttpClient.Version.HTTP_1_1;
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
