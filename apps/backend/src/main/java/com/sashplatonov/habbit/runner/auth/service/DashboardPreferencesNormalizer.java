package com.sashplatonov.habbit.runner.auth.service;

import com.sashplatonov.habbit.runner.auth.dto.DashboardPreferences;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

final class DashboardPreferencesNormalizer {
  private static final Set<String> FILTERS = Set.of("pending", "all", "done", "archived");
  private static final Set<String> SORTS = Set.of("custom", "smart");
  private static final Set<String> DENSITIES = Set.of("comfortable", "compact");
  private static final int MAX_TAGS = 50;
  private static final int MAX_TAG_LENGTH = 40;
  private static final int MAX_USAGE_COUNT = 1_000_000;

  private DashboardPreferencesNormalizer() {
  }

  static DashboardPreferences normalize(DashboardPreferences preferences) {
    if (preferences == null) {
      return defaults();
    }
    return new DashboardPreferences(
        1,
        normalizeMode(preferences.filter(), FILTERS, "pending"),
        normalizeTags(preferences.tags()),
        normalizeMode(preferences.sort(), SORTS, "custom"),
        normalizeMode(preferences.density(), DENSITIES, "comfortable"),
        normalizeUsage(preferences.themeUsage())
    );
  }

  static DashboardPreferences defaults() {
    return new DashboardPreferences();
  }

  private static String normalizeMode(String value, Set<String> allowed, String fallback) {
    return value != null && allowed.contains(value) ? value : fallback;
  }

  private static List<String> normalizeTags(List<String> tags) {
    if (tags == null) {
      return List.of();
    }
    return tags.stream()
        .filter(tag -> tag != null)
        .map(String::trim)
        .filter(tag -> !tag.isBlank() && tag.length() <= MAX_TAG_LENGTH)
        .distinct()
        .limit(MAX_TAGS)
        .toList();
  }

  private static Map<String, Integer> normalizeUsage(Map<String, Integer> usage) {
    if (usage == null) {
      return Map.of();
    }
    var normalized = new LinkedHashMap<String, Integer>();
    usage.forEach((theme, count) -> {
      if (theme != null && !theme.isBlank() && count != null && count >= 0) {
        normalized.put(theme, Math.min(count, MAX_USAGE_COUNT));
      }
    });
    return Map.copyOf(normalized);
  }
}
