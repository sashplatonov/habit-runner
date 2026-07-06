package com.sashplatonov.habbit.runner.sync;

import com.fasterxml.jackson.core.JsonProcessingException;

final class TestJsonProcessingException extends JsonProcessingException {
  TestJsonProcessingException(String message) {
    super(message);
  }
}
