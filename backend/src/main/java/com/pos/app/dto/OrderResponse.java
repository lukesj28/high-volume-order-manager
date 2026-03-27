package com.pos.app.dto;

import com.pos.app.entity.PosOrder;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        int ticketNumber,
        Integer streamTicketNumber,
        String stationName,
        UUID stationProfileId,
        String status,
        String pickupName,
        String sourceApp,
        int totalPrice,
        int taxRateBps,
        Instant createdAt,
        Instant pickupTime,
        Instant syncedAt,
        Instant completedAt,
        List<OrderItemResponse> items,
        String type // ORDER_CREATED | ORDER_UPDATED
) {
    public record OrderItemResponse(
            UUID id,
            UUID menuItemId,
            String menuItemName,
            int quantity,
            int unitPrice
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
                order.getStreamTicketNumber(),
                order.getTargetStationName() != null
                        ? order.getTargetStationName()
                        : order.getStationProfile().getName(),
                order.getStationProfile().getId(),
                order.getStatus().name(),
                order.getPickupName(),
                order.getSourceApp(),
                order.getTotalPrice(),
                order.getTaxRateBps(),
                order.getCreatedAt(),
                order.getPickupTime(),
                order.getSyncedAt(),
                order.getCompletedAt(),
                items,
                type
        );
    }
}
