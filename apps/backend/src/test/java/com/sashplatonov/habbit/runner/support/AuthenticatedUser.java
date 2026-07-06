package com.sashplatonov.habbit.runner.support;

public record AuthenticatedUser(String id, String email, String accessToken) {
  public String getId() {
    return id;
  }
}
