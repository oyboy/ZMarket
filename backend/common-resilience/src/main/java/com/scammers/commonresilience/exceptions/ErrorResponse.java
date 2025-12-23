package com.scammers.commonresilience.exceptions;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.util.List;

public record ErrorResponse(
        int status,
        String message,
        @JsonInclude(JsonInclude.Include.NON_NULL)
        List<String> details
) {}
