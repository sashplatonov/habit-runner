package com.sashplatonov.habbit.runner.api;

import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.Request;
import jakarta.ws.rs.core.UriInfo;

record RequestContext(Request request, UriInfo uriInfo, HttpHeaders headers) {
}
