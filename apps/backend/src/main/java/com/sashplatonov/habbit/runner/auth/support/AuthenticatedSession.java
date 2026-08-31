package com.sashplatonov.habbit.runner.auth.support;

import com.sashplatonov.habbit.runner.auth.dto.TokenResponse;
import com.sashplatonov.habbit.runner.auth.security.CurrentUser;

public record AuthenticatedSession(TokenResponse token, CurrentUser user) {
}
