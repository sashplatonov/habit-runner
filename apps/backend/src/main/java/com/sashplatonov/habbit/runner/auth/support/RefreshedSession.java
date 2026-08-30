package com.sashplatonov.habbit.runner.auth.support;

import com.sashplatonov.habbit.runner.auth.security.CurrentUser;

public record RefreshedSession(
    String accessToken,
    String refreshToken,
    int expiresIn,
    CurrentUser user
) {
}
