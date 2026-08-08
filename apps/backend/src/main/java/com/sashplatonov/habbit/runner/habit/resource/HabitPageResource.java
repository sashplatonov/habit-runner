package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.api.AuthenticatedResourceSupport;
import com.sashplatonov.habbit.runner.api.CursorCodec;
import com.sashplatonov.habbit.runner.api.CursorPageDto;
import com.sashplatonov.habbit.runner.auth.security.CurrentUserContext;
import com.sashplatonov.habbit.runner.auth.security.RequireAuth;
import com.sashplatonov.habbit.runner.habit.dto.HabitResponseDto;
import com.sashplatonov.habbit.runner.repository.HabitRepository;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;

@Path("/habits/page")
@RequireAuth
public class HabitPageResource extends AuthenticatedResourceSupport {
  private final HabitRepository habitRepository;
  private final HabitMapper habitMapper;

  public HabitPageResource(
      HabitRepository habitRepository,
      HabitMapper habitMapper,
      CurrentUserContext currentUserContext
  ) {
    super(currentUserContext);
    this.habitRepository = habitRepository;
    this.habitMapper = habitMapper;
  }

  @GET
  public CursorPageDto<HabitResponseDto> findPage(
      @QueryParam("cursor") String cursor,
      @QueryParam("limit") Integer limit
  ) {
    var boundedLimit = boundedLimit(limit);
    try {
      var entities = loadEntities(cursor, boundedLimit);
      var items = entities.stream().map(habitMapper::toResponse).toList();
      return new CursorPageDto<>(items, nextCursor(entities, items.size(), boundedLimit));
    } catch (IllegalArgumentException exception) {
      throw new BadRequestException("Invalid cursor", exception);
    }
  }

  private int boundedLimit(Integer limit) {
    var value = limit == null ? 50 : limit;
    if (value < 1 || value > 199) {
      throw new BadRequestException("limit must be between 1 and 199");
    }
    return value;
  }

  private java.util.List<com.sashplatonov.habbit.runner.model.HabitEntity> loadEntities(String cursor, int limit) {
    var decoded = cursor == null || cursor.isBlank() ? null : CursorCodec.decode(cursor);
    return habitRepository.findSyncPageForUser(
        currentUserId(),
        decoded == null ? null : decoded.updatedAt(),
        decoded == null ? null : decoded.id(),
        limit
    );
  }

  private String nextCursor(
      java.util.List<com.sashplatonov.habbit.runner.model.HabitEntity> entities,
      int itemCount,
      int limit
  ) {
    if (itemCount != limit || entities.isEmpty()) {
      return null;
    }
    var last = entities.getLast();
    return CursorCodec.encode(last.getUpdatedAt(), last.getId());
  }
}
