package com.habittracker.sync;

import com.habittracker.api.RequestTraceFilter;
import com.habittracker.auth.CurrentUser;
import com.habittracker.auth.CurrentUserContext;
import com.habittracker.sync.dto.PullResponseDto;
import com.habittracker.sync.dto.PushConflict;
import com.habittracker.sync.dto.PushRequestDto;
import com.habittracker.sync.dto.PushResponseDto;
import com.habittracker.sync.dto.SyncOpDto;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Response;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SuppressWarnings("PMD.LawOfDemeter")
class SyncResourceUnitTest {

  @Test
  void shouldReturnNoStorePullPayloadForCurrentUser() {
    var service = new StubSyncService();
    service.pullResponse = new PullResponseDto(List.of(), List.of(), List.of(), "cursor-2", "2026-04-10T10:00:00Z");
    var resource = resource(service, "trace-pull");

    var response = resource.pull("cursor-1");

    assertEquals("user-1", service.lastPullUserId);
    assertEquals("cursor-1", service.lastPullSince);
    assertResponse(response, service.pullResponse, "trace-pull");
  }

  @Test
  void shouldTreatNullPushBodyAsEmptyOps() {
    var service = new StubSyncService();
    service.pushResponse = new PushResponseDto(List.of("op-1"), List.of(), List.of(), List.of(), List.of(), "cursor-3", "2026-04-10T10:01:00Z");
    var resource = resource(service, "trace-push-empty");

    var response = resource.push(null);

    assertEquals("user-1", service.lastPushUserId);
    assertEquals(List.of(), service.lastPushOps);
    assertResponse(response, service.pushResponse, "trace-push-empty");
  }

  @Test
  void shouldForwardProvidedPushOpsAndConflicts() {
    var service = new StubSyncService();
    var op = new SyncOpDto("op-9", "habit", "upsert", Map.of("id", "habit-1"), "2026-04-10T10:00:00Z");
    service.pushResponse = new PushResponseDto(
        List.of(),
      List.of(new PushConflict("op-9", "conflict", Map.of("server", true))),
        List.of(),
        List.of(),
        List.of(),
        "cursor-4",
        "2026-04-10T10:02:00Z"
    );
    var resource = resource(service, "trace-push-conflict");

    var response = resource.push(new PushRequestDto(List.of(op)));

    assertEquals(List.of(op), service.lastPushOps);
    assertResponse(response, service.pushResponse, "trace-push-conflict");
  }

  private SyncResource resource(StubSyncService service, String traceId) {
    var currentUserContext = new CurrentUserContext();
    currentUserContext.setUser(new CurrentUser("user-1", "user@example.test"));
    var resource = new SyncResource(service, currentUserContext);
    resource.requestContext = requestContext(traceId);
    return resource;
  }

  private ContainerRequestContext requestContext(String traceId) {
    var properties = new HashMap<String, Object>();
    properties.put(RequestTraceFilter.class.getName() + ".traceId", traceId);
    return (ContainerRequestContext) Proxy.newProxyInstance(
        ContainerRequestContext.class.getClassLoader(),
        new Class<?>[]{ContainerRequestContext.class},
        (instance, method, args) -> switch (method.getName()) {
          case "getProperty" -> properties.get(args[0]);
          case "getHeaderString" -> null;
          default -> null;
        }
    );
  }

  private void assertResponse(Response response, Object payload, String traceId) {
    assertEquals(200, response.getStatus());
    assertEquals(payload, response.getEntity());
    assertEquals(traceId, response.getHeaderString(RequestTraceFilter.TRACE_ID_HEADER));
  }

  private static final class StubSyncService extends SyncService {
    private String lastPullUserId;
    private String lastPullSince;
    private String lastPushUserId;
    private List<SyncOpDto> lastPushOps = List.of();
    private PullResponseDto pullResponse;
    private PushResponseDto pushResponse;

    StubSyncService() {
      super(null, null);
    }

    @Override
    public PullResponseDto pull(String userId, String since) {
      lastPullUserId = userId;
      lastPullSince = since;
      return pullResponse;
    }

    @Override
    public PushResponseDto push(String userId, List<SyncOpDto> ops) {
      lastPushUserId = userId;
      lastPushOps = ops;
      return pushResponse;
    }
  }
}