package com.habittracker.metrics;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.time.Instant;
import java.util.Map;

@Path("/metrics")
@Produces(MediaType.APPLICATION_JSON)
public class MetricsResource {
  @GET
  public Map<String, Object> getMetrics() {
    return Map.of(
        "createdAt", Instant.now().toString(),
        "pullRequests", 0,
        "pushRequests", 0,
        "avgPullLatencyMs", 0,
        "avgPushLatencyMs", 0,
        "totalPullRows", 0,
        "conflicts", 0,
        "errors", 0,
        "maxOutboxDepth", 0
    );
  }
}
