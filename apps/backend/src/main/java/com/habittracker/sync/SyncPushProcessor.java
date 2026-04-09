package com.habittracker.sync;

import com.habittracker.model.SyncOpLogEntity;
import com.habittracker.sync.dto.PushResponseDto;
import com.habittracker.sync.dto.SyncOpDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;

import java.util.List;

@ApplicationScoped
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
    if (op.id() == null || op.id().isBlank() || !tryCreateLog(op.id())) {
      return;
    }
    if ("habit".equals(op.entity())) {
      habitSyncProcessor.apply(userId, op, state);
    } else if ("checkin".equals(op.entity())) {
      checkinSyncProcessor.apply(userId, op, state);
    }
  }

  private boolean tryCreateLog(String opId) {
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
