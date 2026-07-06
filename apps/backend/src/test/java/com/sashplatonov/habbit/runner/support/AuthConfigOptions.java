package com.sashplatonov.habbit.runner.support;

record AuthConfigOptions(
    String secret,
    String issuer,
    String apiPublicUrl,
    String oauthDefaultReturnTo,
    String googleClientId,
    String googleClientSecret
) {
}
