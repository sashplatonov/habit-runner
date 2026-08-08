package com.sashplatonov.habbit.runner.api;

import java.util.List;

public record CursorPageDto<T>(List<T> items, String nextCursor) {
  public CursorPageDto {
    items = List.copyOf(items);
  }
}
