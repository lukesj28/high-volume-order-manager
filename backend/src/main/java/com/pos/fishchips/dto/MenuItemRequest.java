package com.pos.fishchips.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;
import java.util.List;

public record MenuItemRequest(
        @NotBlank String name,
        @NotNull @DecimalMin("0.01") BigDecimal price,
        int displayOrder,
        List<ComponentRequest> components
) {
    public record ComponentRequest(
            @NotBlank String componentName,
            int componentQuantity
    ) {}
}
