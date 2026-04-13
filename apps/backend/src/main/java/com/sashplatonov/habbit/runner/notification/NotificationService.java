package com.sashplatonov.habbit.runner.notification;

import com.sashplatonov.habbit.runner.api.OperationResult;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionEndpointRequest;
import com.sashplatonov.habbit.runner.notification.dto.PushSubscriptionRequest;
import com.sashplatonov.habbit.runner.notification.dto.SubscriptionStatusResponse;
import com.sashplatonov.habbit.runner.notification.dto.VapidPublicKeyResponse;

public interface NotificationService {
  OperationResult<VapidPublicKeyResponse> getVapidPublicKey();

  OperationResult<SubscriptionStatusResponse> subscribe(String userId, PushSubscriptionRequest request);

  OperationResult<Void> unsubscribe(String userId, PushSubscriptionEndpointRequest request);
}
