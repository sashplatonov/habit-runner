package com.sashplatonov.habbit.runner.support;

@FunctionalInterface
public interface TransactionalCallable<T> {
  T call() throws Exception;
}
