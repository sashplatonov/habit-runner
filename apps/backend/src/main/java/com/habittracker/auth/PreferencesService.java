package com.habittracker.auth;

import com.habittracker.auth.dto.UpdatePreferencesRequest;
import com.habittracker.auth.dto.UserPreferencesResponse;
import com.habittracker.model.UserEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotAuthorizedException;
import lombok.extern.slf4j.Slf4j;

import java.util.Objects;

@ApplicationScoped
@Slf4j
public class PreferencesService {

  @Transactional
  public UserPreferencesResponse getUserPreferences(String userId) {
    var user = UserEntity.<UserEntity>findById(userId);
    if (user == null) {
      throw new NotAuthorizedException("User no longer exists");
    }
    return new UserPreferencesResponse(ThemeCatalog.normalize(user.theme), user.timezone);
  }

  @Transactional
  public UserPreferencesResponse updateUserPreferences(String userId, UpdatePreferencesRequest request) {
    var user = UserEntity.<UserEntity>findById(userId);
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
        user.id,
        !Objects.equals(previousTheme, user.theme),
        !Objects.equals(previousTimezone, user.timezone)
    );
    return new UserPreferencesResponse(user.theme, user.timezone);
  }
}
