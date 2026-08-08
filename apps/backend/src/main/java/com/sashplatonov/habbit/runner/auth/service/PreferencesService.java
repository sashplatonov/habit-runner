package com.sashplatonov.habbit.runner.auth.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sashplatonov.habbit.runner.auth.dto.DashboardPreferences;
import com.sashplatonov.habbit.runner.auth.dto.UpdatePreferencesRequest;
import com.sashplatonov.habbit.runner.auth.dto.UserPreferencesResponse;
import com.sashplatonov.habbit.runner.auth.support.ThemeCatalog;
import com.sashplatonov.habbit.runner.model.UserEntity;
import com.sashplatonov.habbit.runner.repository.UserRepository;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotAuthorizedException;
import lombok.extern.slf4j.Slf4j;

import java.util.Objects;

@ApplicationScoped
@Slf4j
public class PreferencesService {
  private final UserRepository userRepository;
  private final ObjectMapper objectMapper;

  public PreferencesService() {
    this(null, new ObjectMapper());
  }

  public PreferencesService(UserRepository userRepository) {
    this(userRepository, new ObjectMapper());
  }

  @Inject
  public PreferencesService(UserRepository userRepository, ObjectMapper objectMapper) {
    this.userRepository = userRepository;
    this.objectMapper = objectMapper;
  }

  @Transactional
  public UserPreferencesResponse getUserPreferences(String userId) {
    var user = findUserById(userId);
    if (user == null) {
      throw new NotAuthorizedException("User no longer exists");
    }
    return new UserPreferencesResponse(
        ThemeCatalog.normalize(user.getTheme()),
        user.getTimezone(),
        readDashboardPreferences(user.getDashboardPreferences())
    );
  }

  @Transactional
  public UserPreferencesResponse updateUserPreferences(String userId, UpdatePreferencesRequest request) {
    var user = findUserById(userId);
    if (user == null) {
      throw new NotAuthorizedException("User no longer exists");
    }
    var previousTheme = ThemeCatalog.normalize(user.getTheme());
    var previousTimezone = user.getTimezone();

    user.setTheme(ThemeCatalog.normalize(request.theme()));
    if (request.timezone() != null) {
      user.setTimezone(request.timezone().isBlank() ? null : request.timezone());
    }
    if (request.dashboard() != null) {
      user.setDashboardPreferences(writeDashboardPreferences(request.dashboard()));
    }
    log.info(
        "User preferences updated: userId={}, themeChanged={}, timezoneChanged={}",
        user.getId(),
        !Objects.equals(previousTheme, user.getTheme()),
        !Objects.equals(previousTimezone, user.getTimezone())
    );
    return new UserPreferencesResponse(
        user.getTheme(),
        user.getTimezone(),
        readDashboardPreferences(user.getDashboardPreferences())
    );
  }

  private DashboardPreferences readDashboardPreferences(String value) {
    try {
      return DashboardPreferencesNormalizer.normalize(
          objectMapper.readValue(value == null || value.isBlank() ? "{}" : value, DashboardPreferences.class)
      );
    } catch (JsonProcessingException exception) {
      log.warn("Invalid dashboard preferences payload; using defaults");
      return DashboardPreferencesNormalizer.defaults();
    }
  }

  private String writeDashboardPreferences(DashboardPreferences value) {
    try {
      return objectMapper.writeValueAsString(DashboardPreferencesNormalizer.normalize(value));
    } catch (JsonProcessingException exception) {
      throw new IllegalArgumentException("Dashboard preferences could not be serialized", exception);
    }
  }

  protected UserEntity findUserById(String userId) {
    return userRepository == null ? UserEntity.<UserEntity>findById(userId) : userRepository.findRequiredById(userId);
  }
}
