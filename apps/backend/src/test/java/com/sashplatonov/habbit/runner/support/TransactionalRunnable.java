package com.sashplatonov.habbit.runner.support;

@FunctionalInterface
public interface TransactionalRunnable {
  void run() throws Exception;
}
