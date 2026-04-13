package com.sashplatonov.habbit.runner.auth;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import jakarta.enterprise.context.ApplicationScoped;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@ApplicationScoped
public class JwtUtil {
  private final AuthConfig authConfig;

  public JwtUtil(AuthConfig authConfig) {
    this.authConfig = authConfig;
  }

  public String createAccessToken(String userId, String email, int ttlSeconds) {
    var now = Instant.now();
    return JWT.create()
        .withSubject(userId)
        .withClaim("email", email)
        .withIssuer(authConfig.issuer())
        .withIssuedAt(Date.from(now))
        .withExpiresAt(Date.from(now.plus(ttlSeconds, ChronoUnit.SECONDS)))
        .sign(algorithm());
  }

  public CurrentUser verify(String token) {
    try {
      var decoded = JWT.require(algorithm()).withIssuer(authConfig.issuer()).build().verify(token);
      return new CurrentUser(decoded.getSubject(), decoded.getClaim("email").asString());
    } catch (JWTVerificationException ex) {
      throw new IllegalArgumentException("Invalid token", ex);
    }
  }

  private Algorithm algorithm() {
    return Algorithm.HMAC256(authConfig.secret());
  }
}
