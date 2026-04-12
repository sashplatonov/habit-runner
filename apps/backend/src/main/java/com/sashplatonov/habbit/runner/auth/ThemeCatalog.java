package com.sashplatonov.habbit.runner.auth;

import java.util.Set;

final class ThemeCatalog {
  private static final String DEFAULT_THEME = "cloud";
  private static final Set<String> THEME_IDS = Set.of(
      "midnight",
      "ember",
      "violet",
      "matrix",
      "arctic",
      "sakura",
      "lavender",
      "mint",
      "peach",
      DEFAULT_THEME
  );

  private ThemeCatalog() {
  }

  static String normalize(String value) {
    return value != null && THEME_IDS.contains(value) ? value : DEFAULT_THEME;
  }
}
