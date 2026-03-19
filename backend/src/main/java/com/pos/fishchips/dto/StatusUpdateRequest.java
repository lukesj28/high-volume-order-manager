package com.pos.fishchips.dto;

import jakarta.validation.constraints.NotBlank;

public record StatusUpdateRequest(
        @NotBlank String status,
        boolean confirmed // required true for PENDING -> COMPLETED skip
) {}
