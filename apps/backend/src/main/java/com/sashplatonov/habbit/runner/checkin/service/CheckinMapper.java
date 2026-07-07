package com.sashplatonov.habbit.runner.checkin;

import com.sashplatonov.habbit.runner.checkin.dto.CheckinResponseDto;
import com.sashplatonov.habbit.runner.model.CheckinEntity;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingConstants;

import java.time.Instant;
import java.time.LocalDate;

@Mapper(componentModel = MappingConstants.ComponentModel.CDI)
public interface CheckinMapper {
  @Mapping(target = "date", expression = "java(toDateString(entity.getDate()))")
  @Mapping(target = "createdAt", expression = "java(toInstantString(entity.getCreatedAt()))")
  @Mapping(target = "updatedAt", expression = "java(toInstantString(entity.getUpdatedAt()))")
  CheckinResponseDto toResponse(CheckinEntity entity);

  default String toDateString(LocalDate value) {
    return value != null ? value.toString() : null;
  }

  default String toInstantString(Instant value) {
    return value != null ? value.toString() : null;
  }
}
