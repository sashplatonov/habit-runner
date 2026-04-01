package com.habittracker.auth;

import com.auth0.jwt.JWT;
import com.auth0.jwt.algorithms.Algorithm;
import com.auth0.jwt.exceptions.JWTVerificationException;
import io.quarkus.arc.properties.IfBuildProperty;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;

@ApplicationScoped
@IfBuildProperty(name = "auth.secret", stringValue = "dev-secret", enableIfMissing = true)
public class JwtUtil {
  @ConfigProperty(name = "auth.secret")
  String authSecret;

  @ConfigProperty(name = "auth.issuer")
  String issuer;

  public String createAccessToken(String userId, String email, int ttlSeconds) {
    var now = Instant.now();
    return JWT.create()
        .withSubject(userId)
        .withClaim("email", email)
        .withIssuer(issuer)
        .withIssuedAt(Date.from(now))
        .withExpiresAt(Date.from(now.plus(ttlSeconds, ChronoUnit.SECONDS)))
        .sign(Algorithm.HMAC256(authSecret));
  }

  public CurrentUser verify(String token) {
    try {
      var decoded = JWT.require(Algorithm.HMAC256(authSecret)).withIssuer(issuer).build().verify(token);
      return new CurrentUser(decoded.getSubject(), decoded.getClaim("email").asString());
    } catch (JWTVerificationException ex) {
      throw new IllegalArgumentException("Invalid token");
    }
  }
}
