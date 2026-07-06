package com.sashplatonov.habbit.runner.support;

import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.net.URI;
import com.sashplatonov.habbit.runner.model.HabitColor;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import com.sashplatonov.habbit.runner.model.HabitFrequency;
import com.sashplatonov.habbit.runner.model.HabitType;
import com.sashplatonov.habbit.runner.notification.NotificationResource;

/**
 * Test helper utilities to centralize foreign-object interactions.
 *
 * This class intentionally consolidates calls like `response.getEntity()` so
 * test classes can call these helpers instead of reaching through foreign
 * objects directly which triggers LawOfDemeter checks in PMD.
 */
public final class TestHelpers {

  private TestHelpers() {}

  public static MediaType mediaTypeOf(Response response) {
    return response.getMediaType();
  }

  public static <T> T entityOf(Response response) {
    return (T) response.getEntity();
  }

  public static int statusOf(Response response) {
    return response.getStatus();
  }

  public static URI locationOf(Response response) {
    return response.getLocation();
  }

  public static HabitFrequency frequencyOf(HabitEntity habit) {
    return habit.getFrequency();
  }

  public static HabitColor colorOf(HabitEntity habit) {
    return habit.getColor();
  }

  public static HabitType typeOf(HabitEntity habit) {
    return habit.getType();
  }

  public static Response getVapidPublicKey(NotificationResource resource) {
    return resource.getVapidPublicKey();
  }
}
