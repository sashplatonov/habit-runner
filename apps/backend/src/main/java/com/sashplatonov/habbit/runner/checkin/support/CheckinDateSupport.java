package com.sashplatonov.habbit.runner.checkin.support;

import java.time.LocalDate;
import java.time.format.DateTimeParseException;

public final class CheckinDateSupport {
  private CheckinDateSupport() {
  }

  public static LocalDate parseDate(String value) {
    try {
      return LocalDate.parse(value);
    } catch (DateTimeParseException exception) {
      return null;
    }
  }
}
