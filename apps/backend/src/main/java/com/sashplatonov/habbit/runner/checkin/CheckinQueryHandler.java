package com.sashplatonov.habbit.runner.checkin;

import com.sashplatonov.habbit.runner.checkin.dto.CheckinResponseDto;
import com.sashplatonov.habbit.runner.api.CursorCodec;
import com.sashplatonov.habbit.runner.api.CursorPageDto;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class CheckinQueryHandler {
  private final CheckinRepository checkinRepository;
  private final CheckinMapper checkinMapper;

  @Inject
  CheckinQueryHandler(CheckinRepository checkinRepository, CheckinMapper checkinMapper) {
    this.checkinRepository = checkinRepository;
    this.checkinMapper = checkinMapper;
  }

  public List<CheckinResponseDto> findAll(String userId) {
    return checkinRepository.findAllByUserId(userId).stream()
        .map(checkinMapper::toResponse)
        .toList();
  }

  public CursorPageDto<CheckinResponseDto> findPage(String userId, String cursor, int limit) {
    var decoded = cursor == null || cursor.isBlank() ? null : CursorCodec.decode(cursor);
    var entities = checkinRepository.findSyncPageForUser(
        userId,
        decoded == null ? null : decoded.updatedAt(),
        decoded == null ? null : decoded.id(),
        limit + 1
    );
    var items = entities.stream().limit(limit).map(checkinMapper::toResponse).toList();
    var nextCursor = entities.size() > limit
        ? CursorCodec.encode(entities.get(limit - 1).getUpdatedAt(), entities.get(limit - 1).getId())
        : null;
    return new CursorPageDto<>(items, nextCursor);
  }
}
