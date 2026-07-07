package com.sashplatonov.habbit.runner.auth.support;

import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;

public record OAuthCallbackSession(String redirectUrl, TokenResponse session) {
}
