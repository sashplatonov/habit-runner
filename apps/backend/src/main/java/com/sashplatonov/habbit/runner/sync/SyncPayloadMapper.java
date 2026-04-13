package com.sashplatonov.habbit.runner.sync;

import com.sashplatonov.habbit.runner.sync.dto.CheckinPayloadDto;
import com.sashplatonov.habbit.runner.sync.dto.HabitPayloadDto;
import com.sashplatonov.habbit.runner.sync.dto.SyncOpPayloadDto;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.CDI)
public interface SyncPayloadMapper {
  HabitPayloadDto toHabitPayload(SyncOpPayloadDto payload);

  CheckinPayloadDto toCheckinPayload(SyncOpPayloadDto payload);
}
