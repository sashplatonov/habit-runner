package com.sashplatonov.habbit.runner.checkin;

import com.sashplatonov.habbit.runner.checkin.dto.CheckinResponseDto;
import com.sashplatonov.habbit.runner.repository.CheckinRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.List;

@ApplicationScoped
public class CheckinQueryHandler {
  private final CheckinRepository checkinRepository;
  private final CheckinMapper checkinMapper;

  @Inject
  public CheckinQueryHandler(CheckinRepository checkinRepository, CheckinMapper checkinMapper) {
    this.checkinRepository = checkinRepository;
    this.checkinMapper = checkinMapper;
  }

  public List<CheckinResponseDto> findAll(String userId) {
    return checkinRepository.findAllByUserId(userId).stream()
        .map(checkinMapper::toResponse)
        .toList();
  }
}
