package com.sashplatonov.habbit.runner.auth.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record DashboardPreferences(
    Integer version,
    String filter,
    List<String> tags,
    String sort,
    String density,
    Map<String, Integer> themeUsage
) {
  public DashboardPreferences() {
    this(1, "pending", List.of(), "custom", "comfortable", Map.of());
  }
}
