package com.habittracker.sync;

import com.habittracker.sync.dto.CheckinPayloadDto;
import com.habittracker.sync.dto.HabitPayloadDto;
import com.habittracker.sync.dto.SyncOpPayloadDto;
import org.mapstruct.Mapper;
import org.mapstruct.MappingConstants;

@Mapper(componentModel = MappingConstants.ComponentModel.CDI)
public interface SyncPayloadMapper {
  HabitPayloadDto toHabitPayload(SyncOpPayloadDto payload);

  CheckinPayloadDto toCheckinPayload(SyncOpPayloadDto payload);
}
