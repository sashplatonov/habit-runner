package com.sashplatonov.habbit.runner.api;

record ErrorSpec(String typePath, String title, int status, String detail, String code) {
}
