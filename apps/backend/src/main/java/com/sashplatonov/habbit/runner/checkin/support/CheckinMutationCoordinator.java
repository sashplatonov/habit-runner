package com.sashplatonov.habbit.runner.checkin.support;

import com.sashplatonov.habbit.runner.habit.support.HabitMutationSupport;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetric;
import com.sashplatonov.habbit.runner.metrics.instrumentation.ServiceMetricsInstrumentation;
import com.sashplatonov.habbit.runner.model.CheckinEntity;
import com.sashplatonov.habbit.runner.model.HabitEntity;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.util.function.Supplier;

@ApplicationScoped
public class CheckinMutationCoordinator {
  private final ServiceMetricsInstrumentation serviceMetricsInstrumentation;

  public CheckinMutationCoordinator() {
    this(null);
  }

  @Inject
  public CheckinMutationCoordinator(ServiceMetricsInstrumentation serviceMetricsInstrumentation) {
    this.serviceMetricsInstrumentation = serviceMetricsInstrumentation;
  }

  public <T> T measureMutation(Supplier<T> action) {
    if (serviceMetricsInstrumentation == null) {
      return action.get();
    }
    return serviceMetricsInstrumentation.measureMutation(action);
  }

  public void normalize(CheckinEntity checkin) {
    CheckinMutationSupport.normalize(checkin);
  }

  public void touch(CheckinEntity checkin) {
    CheckinMutationSupport.touch(checkin);
  }

  public void touch(HabitEntity habit) {
    HabitMutationSupport.touch(habit);
  }

  public void recordCheckinDeleted() {
    if (serviceMetricsInstrumentation != null) {
      serviceMetricsInstrumentation.record(ServiceMetric.CHECKIN_DELETED);
    }
  }

  public void recordCheckinUpserted() {
    if (serviceMetricsInstrumentation != null) {
      serviceMetricsInstrumentation.record(ServiceMetric.CHECKIN_UPSERTED);
    }
  }
}
