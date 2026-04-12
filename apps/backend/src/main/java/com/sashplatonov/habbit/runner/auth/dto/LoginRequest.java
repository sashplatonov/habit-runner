package com.sashplatonov.habbit.runner.auth.dto;

import jakarta.validation.constraints.Email;

public record LoginRequest(@Email String email) {
}
