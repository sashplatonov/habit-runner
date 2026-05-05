package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.api.RequestTraceFilter;
import com.sashplatonov.habbit.runner.auth.CurrentUser;
import com.sashplatonov.habbit.runner.auth.CurrentUserContext;
import com.sashplatonov.habbit.runner.metrics.SyncMetricsCollector;
import com.sashplatonov.habbit.runner.sync.dto.PullResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.ConflictServerValueDto;
import com.sashplatonov.habbit.runner.sync.dto.PushConflict;
import com.sashplatonov.habbit.runner.sync.dto.PushRequestDto;
import com.sashplatonov.habbit.runner.sync.dto.PushResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpPayloadDto;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.Response;
import com.sashplatonov.habbit.runner.support.TestHelpers;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import io.quarkus.test.junit.QuarkusTest;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.HashMap;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;

import jakarta.transaction.Transactional;

@QuarkusTest
@Transactional
@SuppressWarnings({"PMD.TooManyMethods", "PMD.LawOfDemeter"})
class SyncResourceUnitTest {

  @Test
  void shouldReturnNoStorePullPayloadForCurrentUser() {
    var service = new StubSyncService();
    service.setPullResponse(PullResponseDto.builder()
        .habits(List.of())
        .checkins(List.of())
        .tombstones(List.of())
        .nextCursor("cursor-2")
        .serverTime("2026-04-10T10:00:00Z")
        .build());
    var resource = resource(service, "trace-pull");

    var response = resource.pull("cursor-1");

    assertEquals("user-1", service.lastPullUserId);
    assertEquals("cursor-1", service.lastPullSince);
    assertResponse(response, service.getPullResponse(), "trace-pull");
  }

  @Test
  void shouldForwardEmptyPushOpsWhenRequestContainsNoOperations() {
    var service = new StubSyncService();
    service.setPushResponse(PushResponseDto.builder()
        .applied(List.of("op-1"))
        .conflicts(List.of())
        .habits(List.of())
        .checkins(List.of())
        .tombstones(List.of())
        .nextCursor("cursor-3")
        .serverTime("2026-04-10T10:01:00Z")
        .build());
    var resource = resource(service, "trace-push-empty");

      var response = resource.push(PushRequestDto.builder().ops(List.of()).build());

    assertEquals("user-1", service.lastPushUserId);
    assertEquals(List.of(), service.lastPushOps);
    assertResponse(response, service.getPushResponse(), "trace-push-empty");
  }

  @Test
  void shouldForwardProvidedPushOpsAndConflicts() {
    var service = new StubSyncService();
    var op = SyncOpDto.builder()
      .id("op-9")
      .entity("habit")
      .type(SyncOperationType.UPSERT)
      .payload(SyncOpPayloadDto.builder().id("habit-1").build())
      .clientTime("2026-04-10T10:00:00Z")
      .build();
    service.setPushResponse(PushResponseDto.builder()
      .applied(List.of())
      .conflicts(List.of(PushConflict.builder()
        .opId("op-9")
        .reason("conflict")
        .serverValue(ConflictServerValueDto.builder().version(1).updatedAt("2026-04-10T10:00:00Z").build())
        .build()))
      .habits(List.of())
      .checkins(List.of())
      .tombstones(List.of())
      .nextCursor("cursor-4")
      .serverTime("2026-04-10T10:02:00Z")
      .build());
    var resource = resource(service, "trace-push-conflict");

    var response = resource.push(PushRequestDto.builder().ops(List.of(op)).build());

    assertEquals(List.of(op), service.lastPushOps);
    assertResponse(response, service.pushResponse, "trace-push-conflict");
  }

  private SyncResource resource(StubSyncService service, String traceId) {
    var currentUserContext = new CurrentUserContext();
    currentUserContext.setUser(new CurrentUser("user-1", "user@example.test"));
    var syncMetricsCollector = new SyncMetricsCollector(new SimpleMeterRegistry());
    var resource = new SyncResource(service, currentUserContext, syncMetricsCollector);
    setField(resource, "requestContext", requestContext(traceId));
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
    assertEquals(200, TestHelpers.statusOf(response));
    assertEquals(payload, TestHelpers.entityOf(response));
    var header = response.getHeaderString(RequestTraceFilter.TRACE_ID_HEADER);
    assertEquals(traceId, header);
  }
  private static void setField(Object target, String name, Object value) {
    try {
      var f = SyncResource.class.getDeclaredField(name);
      f.setAccessible(true);
      f.set(target, value);
    } catch (ReflectiveOperationException e) {
      throw new RuntimeException(e);
    }
  }

  private static final class StubSyncService implements SyncService {
    private String lastPullUserId;
    private String lastPullSince;
    private String lastPushUserId;
    private List<SyncOpDto> lastPushOps = List.of();
    private PullResponseDto pullResponse;
    private PushResponseDto pushResponse;
    public void setPullResponse(PullResponseDto r) { this.pullResponse = r; }
    public void setPushResponse(PushResponseDto r) { this.pushResponse = r; }
    public PullResponseDto getPullResponse() { return pullResponse; }
    public PushResponseDto getPushResponse() { return pushResponse; }
    public String getLastPullUserId() { return lastPullUserId; }
    public String getLastPullSince() { return lastPullSince; }
    public String getLastPushUserId() { return lastPushUserId; }
    public List<SyncOpDto> getLastPushOps() { return lastPushOps; }

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