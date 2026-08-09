package com.sashplatonov.habbit.runner.auth.telegram;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.support.TestConfigFactory;
import jakarta.ws.rs.BadRequestException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.HexFormat;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TelegramInitDataVerifierTest {
  @Test
  void verifiesSignedInitData() throws Exception {
    var verifier = new TelegramInitDataVerifier(TestConfigFactory.telegramAuthConfig("bot-token"), new ObjectMapper());
    var data = "auth_date=" + Instant.now().getEpochSecond()
        + "&user=%7B%22id%22%3A42%2C%22username%22%3A%22alice%22%7D";
    var secret = hmac("bot-token".getBytes(StandardCharsets.UTF_8), "WebAppData");
    var hash = hmac(secret, "auth_date=" + data.substring(10, data.indexOf("&user="))
        + "\nuser={\"id\":42,\"username\":\"alice\"}");
    var user = verifier.verify(data + "&hash=" + HexFormat.of().formatHex(hash));
    assertEquals(42L, user.id());
    assertEquals("alice", user.username());
  }

  @Test
  void rejectsTamperedSignature() {
    var verifier = new TelegramInitDataVerifier(TestConfigFactory.telegramAuthConfig("bot-token"), new ObjectMapper());
    assertThrows(BadRequestException.class, () -> verifier.verify(
        "auth_date=" + Instant.now().getEpochSecond() + "&user=%7B%22id%22%3A42%7D&hash=00"));
  }

  @Test
  void rejectsStaleAndFutureInitDataBeforeIdentityResolution() {
    var verifier = new TelegramInitDataVerifier(TestConfigFactory.telegramAuthConfig("bot-token"), new ObjectMapper());
    var stale = "auth_date=1&user=%7B%22id%22%3A42%7D&hash=00";
    var future = "auth_date=" + (Instant.now().getEpochSecond() + 120)
        + "&user=%7B%22id%22%3A42%7D&hash=00";
    assertThrows(BadRequestException.class, () -> verifier.verify(stale));
    assertThrows(BadRequestException.class, () -> verifier.verify(future));
  }

  private byte[] hmac(byte[] key, String value) throws Exception {
    var mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(key, "HmacSHA256"));
    return mac.doFinal(value.getBytes(StandardCharsets.UTF_8));
  }
}
