package com.sashplatonov.habbit.runner.habit;

import com.sashplatonov.habbit.runner.api.ErrorResponse;
import org.eclipse.microprofile.openapi.annotations.media.Content;
import org.eclipse.microprofile.openapi.annotations.media.Schema;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponse;
import org.eclipse.microprofile.openapi.annotations.responses.APIResponses;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Documented
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@APIResponses({
    @APIResponse(responseCode = "400", description = "Validation failed",
        content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    @APIResponse(responseCode = "403", description = "Authentication required",
        content = @Content(schema = @Schema(implementation = ErrorResponse.class))),
    @APIResponse(responseCode = "404", description = "Habit not found",
        content = @Content(schema = @Schema(implementation = ErrorResponse.class)))
})
public @interface HabitMutationErrorResponses {
}
