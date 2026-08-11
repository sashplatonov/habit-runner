package com.sashplatonov.habbit.runner.auth.dto;

public record AccountConnectionResponse(String provider, boolean connected, String displayName) {
}
