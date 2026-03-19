package com.pos.fishchips.dto;

import com.pos.fishchips.entity.PosOrder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        int ticketNumber,
        String stationName,
        UUID stationProfileId,
        String status,
        String pickupName,
        String sourceApp,
        BigDecimal totalPrice,
        Instant createdAt,
        Instant syncedAt,
        Instant completedAt,
        List<OrderItemResponse> items,
        String type // WS message type: ORDER_CREATED | ORDER_UPDATED
) {
    public record OrderItemResponse(
            UUID id,
            UUID menuItemId,
            String menuItemName,
            int quantity,
            BigDecimal unitPrice
    ) {}

    public static OrderResponse from(PosOrder order, String type) {
        List<OrderItemResponse> items = order.getItems().stream()
                .map(i -> new OrderItemResponse(
                        i.getId(),
                        i.getMenuItem().getId(),
                        i.getMenuItem().getName(),
                        i.getQuantity(),
                        i.getUnitPrice()
                )).toList();

        return new OrderResponse(
                order.getId(),
                order.getTicketNumber(),
                order.getStationProfile().getName(),
                order.getStationProfile().getId(),
                order.getStatus().name(),
                order.getPickupName(),
                order.getSourceApp(),
                order.getTotalPrice(),
                order.getCreatedAt(),
                order.getSyncedAt(),
                order.getCompletedAt(),
                items,
                type
        );
    }
}
