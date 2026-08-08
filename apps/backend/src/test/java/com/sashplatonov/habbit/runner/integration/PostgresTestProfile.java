package com.sashplatonov.habbit.runner.integration;

import io.quarkus.test.junit.QuarkusTestProfile;

public class PostgresTestProfile implements QuarkusTestProfile {
  @Override
  public String getConfigProfile() {
    return "postgres-it";
  }
}
