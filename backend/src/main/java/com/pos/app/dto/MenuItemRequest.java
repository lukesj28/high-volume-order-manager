package com.pos.app.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record MenuItemRequest(
        @NotBlank String name,
        @Min(1) int price, // Price in cents (e.g. 599 = $5.99)
        int displayOrder,
        List<ComponentRequest> components
) {
    public record ComponentRequest(
            @NotBlank String componentName,
            int componentQuantity
    ) {}
}
