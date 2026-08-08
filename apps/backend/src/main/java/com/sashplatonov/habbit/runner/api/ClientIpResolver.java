package com.sashplatonov.habbit.runner.api;

import jakarta.ws.rs.core.HttpHeaders;

public final class ClientIpResolver {
  private ClientIpResolver() {
  }

  public static String resolve(HttpHeaders headers) {
    if (headers == null) {
      return "unknown";
    }
    var realIp = headers.getHeaderString("X-Real-IP");
    if (realIp != null && !realIp.isBlank()) {
      return realIp.trim();
    }
    var forwardedFor = headers.getHeaderString("X-Forwarded-For");
    if (forwardedFor == null || forwardedFor.isBlank()) {
      return "unknown";
    }
    var hops = forwardedFor.split(",");
    var lastHop = hops[hops.length - 1].trim();
    return lastHop.isEmpty() ? "unknown" : lastHop;
  }
}
