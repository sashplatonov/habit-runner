package com.sashplatonov.habbit.runner.auth.dto;

import java.util.List;

public record AccountConnectionsResponse(List<AccountConnectionResponse> connections) {
  public AccountConnectionsResponse {
    connections = List.copyOf(connections);
  }
}
