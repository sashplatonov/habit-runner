package com.sashplatonov.habbit.runner.api;

import jakarta.ws.rs.core.Response;

final class UnknownStatus implements Response.StatusType {
  private final int statusCode;

  UnknownStatus(int statusCode) {
    this.statusCode = statusCode;
  }

  @Override
  public int getStatusCode() {
    return statusCode;
  }

  @Override
  public Response.Status.Family getFamily() {
    return Response.Status.Family.familyOf(statusCode);
  }

  @Override
  public String getReasonPhrase() {
    return "Unknown code";
  }
}
