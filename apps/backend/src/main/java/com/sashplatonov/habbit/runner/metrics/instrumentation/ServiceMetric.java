package com.sashplatonov.habbit.runner.metrics.instrumentation;

public enum ServiceMetric {
  HABIT_CREATED(new MetricDefinition(
      "habittracker.habit.created",
      "Habits created via the service layer",
      "create",
      "success",
      "internal"
  )),
  HABIT_UPDATED(new MetricDefinition(
      "habittracker.habit.updated",
      "Habits updated via the service layer",
      "update",
      "success",
      "internal"
  )),
  HABIT_DELETED(new MetricDefinition(
      "habittracker.habit.deleted",
      "Habits deleted via the service layer",
      "delete",
      "success",
      "internal"
  )),
  CHECKIN_UPSERTED(new MetricDefinition(
      "habittracker.checkin.upserted",
      "Checkins upserted via the service layer",
      "upsert",
      "success",
      "internal"
  )),
  CHECKIN_DELETED(new MetricDefinition(
      "habittracker.checkin.deleted",
      "Checkins deleted via the service layer",
      "delete",
      "success",
      "internal"
  )),
  AUTH_LOGIN_SUCCESS_EMAIL(new MetricDefinition(
      "habittracker.auth.login.success",
      "Successful email logins",
      "login",
      "success",
      "email"
  )),
  AUTH_LOGIN_SUCCESS_GOOGLE(new MetricDefinition(
      "habittracker.auth.login.success",
      "Successful Google logins",
      "login",
      "success",
      "google"
  )),
  AUTH_LOGIN_FAILURE_EMAIL(new MetricDefinition(
      "habittracker.auth.login.failure",
      "Failed email logins",
      "login",
      "failure",
      "email"
  )),
  AUTH_REFRESH_SUCCESS(new MetricDefinition(
      "habittracker.auth.refresh.success",
      "Successful refresh-token exchanges",
      "refresh",
      "success",
      "refresh-token"
  )),
  OAUTH_GOOGLE_FAILURE(new MetricDefinition(
      "habittracker.oauth.google.failure",
      "Failed Google OAuth exchanges",
      "exchange",
      "failure",
      "google"
  )),
  PUSH_SUBSCRIPTION_CREATED(new MetricDefinition(
      "habittracker.push.subscription.created",
      "Created push subscriptions",
      "subscribe",
      "success",
      "push"
  )),
  PUSH_SUBSCRIPTION_DELETED(new MetricDefinition(
      "habittracker.push.subscription.deleted",
      "Deleted push subscriptions",
      "unsubscribe",
      "success",
      "push"
  ));

  private final MetricDefinition definition;

  ServiceMetric(MetricDefinition definition) {
    this.definition = definition;
  }

  public MetricDefinition definition() {
    return definition;
  }
}
