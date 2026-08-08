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
    var boundedLimit = limit == null ? 50 : limit;
    if (boundedLimit < 1 || boundedLimit > 199) {
      throw new BadRequestException("limit must be between 1 and 199");
    }
    try {
      var decoded = cursor == null || cursor.isBlank() ? null : CursorCodec.decode(cursor);
      var entities = habitRepository.findSyncPageForUser(
          currentUserId(),
          decoded == null ? null : decoded.updatedAt(),
          decoded == null ? null : decoded.id(),
          boundedLimit
      );
      var items = entities.stream().map(habitMapper::toResponse).toList();
      var nextCursor = items.size() == boundedLimit && !entities.isEmpty()
          ? CursorCodec.encode(entities.getLast().getUpdatedAt(), entities.getLast().getId())
          : null;
      return new CursorPageDto<>(items, nextCursor);
    } catch (IllegalArgumentException exception) {
      throw new BadRequestException("Invalid cursor", exception);
    }
  }
}
