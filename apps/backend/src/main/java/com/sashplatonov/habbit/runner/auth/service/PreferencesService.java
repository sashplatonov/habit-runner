package com.sashplatonov.habbit.runner.auth.service;

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

  public PreferencesService() {
    this(null);
  }

  @Inject
  public PreferencesService(UserRepository userRepository) {
    this.userRepository = userRepository;
  }

  @Transactional
  public UserPreferencesResponse getUserPreferences(String userId) {
    var user = findUserById(userId);
    if (user == null) {
      throw new NotAuthorizedException("User no longer exists");
    }
    return new UserPreferencesResponse(ThemeCatalog.normalize(user.theme), user.timezone);
  }

  @Transactional
  public UserPreferencesResponse updateUserPreferences(String userId, UpdatePreferencesRequest request) {
    var user = findUserById(userId);
    if (user == null) {
      throw new NotAuthorizedException("User no longer exists");
    }
    var previousTheme = ThemeCatalog.normalize(user.theme);
    var previousTimezone = user.timezone;

      user.theme = ThemeCatalog.normalize(request.theme());
    if (request.timezone() != null) {
      user.timezone = request.timezone().isBlank() ? null : request.timezone();
    }
    log.info(
        "User preferences updated: userId={}, themeChanged={}, timezoneChanged={}",
        user.getId(),
        !Objects.equals(previousTheme, user.theme),
        !Objects.equals(previousTimezone, user.timezone)
    );
    return new UserPreferencesResponse(user.theme, user.timezone);
  }

  protected UserEntity findUserById(String userId) {
    return userRepository == null ? UserEntity.<UserEntity>findById(userId) : userRepository.findRequiredById(userId);
  }
}
