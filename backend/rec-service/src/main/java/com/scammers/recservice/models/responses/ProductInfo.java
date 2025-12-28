package com.scammers.recservice.models.responses;

import com.fasterxml.jackson.annotation.JsonProperty;

import java.util.UUID;

public record ProductInfo (
        @JsonProperty("categoryId") Long categoryId,
        @JsonProperty("sellerId") UUID manufacturerId
) { }
