package com.pos.app.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderRequest(
        @NotNull UUID id,
        @NotEmpty List<OrderItemRequest> items,
        String pickupName,
        String sourceApp,
        String targetStation,
        @NotNull Instant createdAt,
        Instant pickupTime
) {
    public record OrderItemRequest(
            @NotNull UUID menuItemId,
            @NotNull Integer quantity
    ) {}
}
