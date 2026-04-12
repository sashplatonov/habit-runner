package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.model.SyncOpLogEntity;
import com.sashplatonov.habbit.runner.sync.dto.PushResponseDto;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;

import java.util.List;

@ApplicationScoped
@Slf4j
public class SyncPushProcessor {
  private final HabitSyncProcessor habitSyncProcessor;
  private final CheckinSyncProcessor checkinSyncProcessor;
  private final SyncPushResultFactory resultFactory;

  public SyncPushProcessor(
      HabitSyncProcessor habitSyncProcessor,
      CheckinSyncProcessor checkinSyncProcessor,
      SyncPushResultFactory resultFactory
  ) {
    this.habitSyncProcessor = habitSyncProcessor;
    this.checkinSyncProcessor = checkinSyncProcessor;
    this.resultFactory = resultFactory;
  }

  @Transactional
  public PushResponseDto push(String userId, List<SyncOpDto> ops) {
    var state = new SyncPushState();
    for (var op : ops) {
      processOp(userId, op, state);
    }
    return resultFactory.create(state);
  }

  private void processOp(String userId, SyncOpDto op, SyncPushState state) {
    if (op.id() == null || op.id().isBlank()) {
      log.debug("Ignoring sync op without id: userId={}, entity={}, type={}", userId, op.entity(), op.type());
      return;
    }
    if (!tryCreateLog(op.id())) {
      log.debug(
          "Ignoring duplicate sync op: userId={}, opId={}, entity={}, type={}",
          userId,
          op.id(),
          op.entity(),
          op.type()
      );
      return;
    }
    switch (SyncEntityType.from(op.entity())) {
      case HABIT -> habitSyncProcessor.apply(userId, op, state);
      case CHECKIN -> checkinSyncProcessor.apply(userId, op, state);
      case null -> log.warn(
          "Ignoring sync op with unsupported entity: userId={}, opId={}, entity={}, type={}",
          userId,
          op.id(),
          op.entity(),
          op.type()
      );
    }
  }

  protected boolean tryCreateLog(String opId) {
    try {
      var log = new SyncOpLogEntity();
      log.opId = opId;
      log.persistAndFlush();
      return true;
    } catch (PersistenceException ex) {
      return false;
    }
  }
}
