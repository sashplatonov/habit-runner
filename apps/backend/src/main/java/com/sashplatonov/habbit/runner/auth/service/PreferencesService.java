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
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotAuthorizedException;
import lombok.extern.slf4j.Slf4j;

import java.util.Objects;

@ApplicationScoped
@Slf4j
public class PreferencesService {
  private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
  private final UserRepository userRepository;

  public PreferencesService() {
    this(null);
  }

  public PreferencesService(UserRepository userRepository) {
    this.userRepository = userRepository;
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
          OBJECT_MAPPER.readValue(value == null || value.isBlank() ? "{}" : value, DashboardPreferences.class)
      );
    } catch (JsonProcessingException exception) {
      log.warn("Invalid dashboard preferences payload; using defaults");
      return DashboardPreferencesNormalizer.defaults();
    }
  }

  private String writeDashboardPreferences(DashboardPreferences value) {
    try {
      return OBJECT_MAPPER.writeValueAsString(DashboardPreferencesNormalizer.normalize(value));
    } catch (JsonProcessingException exception) {
      throw new IllegalArgumentException("Dashboard preferences could not be serialized", exception);
    }
  }

  protected UserEntity findUserById(String userId) {
    return userRepository == null ? UserEntity.<UserEntity>findById(userId) : userRepository.findRequiredById(userId);
  }
}
