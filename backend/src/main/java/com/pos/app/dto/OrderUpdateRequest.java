package com.pos.app.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderUpdateRequest(
        @NotEmpty @Valid List<ItemRequest> items,
        String pickupName,
        String sourceApp,
        String targetStation,
        Instant pickupTime
) {
    public record ItemRequest(
            @NotNull UUID menuItemId,
            @NotNull Integer quantity
    ) {}
}
