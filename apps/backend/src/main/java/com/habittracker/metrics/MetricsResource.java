package com.habittracker.metrics;

import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;

import java.time.Instant;

@Path("/metrics")
@Produces(MediaType.APPLICATION_JSON)
public class MetricsResource {
  @GET
  public MetricsSnapshotDto getMetrics() {
    return new MetricsSnapshotDto(
        Instant.now().toString(),
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
    );
  }
}
