package com.habittracker.sync;

import com.habittracker.model.SyncOpLogEntity;
import com.habittracker.sync.dto.PushResponseDto;
import com.habittracker.sync.dto.SyncOpDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.persistence.PersistenceException;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.List;

@ApplicationScoped
public class SyncPushProcessor {
  private static final Logger LOG = Logger.getLogger(SyncPushProcessor.class);

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
      LOG.debug("Ignoring sync op without id");
      return;
    }
    if (!tryCreateLog(op.id())) {
      LOG.debugf("Ignoring duplicate sync op: opId=%s", op.id());
      return;
    }
    switch (SyncEntityType.from(op.entity())) {
      case HABIT -> habitSyncProcessor.apply(userId, op, state);
      case CHECKIN -> checkinSyncProcessor.apply(userId, op, state);
      case null -> LOG.warnf("Ignoring sync op with unsupported entity: opId=%s entity=%s", op.id(), op.entity());
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
