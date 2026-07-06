package com.sashplatonov.habbit.runner.support;

import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpResponse;
import java.util.Map;

final class FakeResponseInfo implements HttpResponse.ResponseInfo {
  private final int statusCode;

  FakeResponseInfo(int statusCode) {
    this.statusCode = statusCode;
  }

  @Override
  public int statusCode() {
    return statusCode;
  }

  @Override
  public HttpHeaders headers() {
    return HttpHeaders.of(Map.of(), (left, right) -> true);
  }

  @Override
  public HttpClient.Version version() {
    return HttpClient.Version.HTTP_1_1;
  }
}
