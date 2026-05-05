package com.sashplatonov.habbit.runner.auth;

public record CurrentUser(String id, String email) {
  public String getId() {
    return id;
  }
}
