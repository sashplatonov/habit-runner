package com.sashplatonov.habbit.runner.api;

import jakarta.validation.constraints.NotBlank;

record ValidationPayload(@NotBlank String value) {
}
