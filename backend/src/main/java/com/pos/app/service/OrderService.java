package com.pos.app.service;

import com.pos.app.dto.OrderRequest;
import com.pos.app.dto.OrderResponse;
import com.pos.app.dto.StatusUpdateRequest;
import com.pos.app.entity.*;
import com.pos.app.exception.AppException;
import com.pos.app.repository.EventDayRepository;
import com.pos.app.repository.MenuItemRepository;
import com.pos.app.repository.OrderRepository;
import com.pos.app.repository.StationProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class OrderService {

    private final OrderRepository orderRepository;
    private final EventDayRepository eventDayRepository;
    private final StationProfileRepository stationProfileRepository;
    private final MenuItemRepository menuItemRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public OrderResponse submitOrder(OrderRequest request, UUID stationProfileId) {
        StationProfile station = stationProfileRepository.findById(stationProfileId)
                .orElseThrow(() -> AppException.notFound("Station profile not found"));

        if (!station.isCanSubmit()) {
            throw AppException.forbidden("This station cannot submit orders");
        }

        EventDay day = eventDayRepository.findByIsActiveTrue()
                .orElseThrow(() -> AppException.badRequest("No active day. Please open a day first."));

        // Idempotency: if UUID already exists, return existing order
        if (orderRepository.existsById(request.id())) {
            PosOrder existing = orderRepository.findById(request.id()).get();
            return OrderResponse.from(existing, "ORDER_CREATED");
        }

        // ticket numbers: race-condition safe via DB function
        int ticketNumber = orderRepository.getNextTicketNumber(day.getId());
        Integer streamTicketNumber = null;
        if (station.isCounterEnabled()) {
            streamTicketNumber = orderRepository.getNextStreamTicketNumber(station.getId(), day.getId());
            if (streamTicketNumber == null)
                throw AppException.badRequest("Failed to assign stream ticket number");
        }

        PosOrder order = new PosOrder();
        order.setId(request.id());
        order.setTicketNumber(ticketNumber);
        order.setStreamTicketNumber(streamTicketNumber);
        order.setEventDay(day);
        order.setStationProfile(station);
        order.setPickupName(request.pickupName());
        order.setSourceApp(request.sourceApp());
        order.setCreatedAt(request.createdAt());
        Instant pickupTime = request.pickupTime() != null
                ? request.pickupTime()
                : request.createdAt().plus(day.getDefaultPickupOffsetMinutes(), ChronoUnit.MINUTES);
        order.setPickupTime(pickupTime);
        order.setSyncedAt(Instant.now());
        order.setTaxRateBps(day.getTaxRateBps());

        int total = 0;
        for (OrderRequest.OrderItemRequest itemReq : request.items()) {
            MenuItem menuItem = menuItemRepository.findById(itemReq.menuItemId())
                    .orElseThrow(() -> AppException.notFound("Menu item not found: " + itemReq.menuItemId()));

            OrderItem orderItem = new OrderItem();
            orderItem.setOrder(order);
            orderItem.setMenuItem(menuItem);
            orderItem.setQuantity(itemReq.quantity());
            orderItem.setUnitPrice(menuItem.getPrice());
            order.getItems().add(orderItem);
            total += menuItem.getPrice() * itemReq.quantity();
        }
        order.setTotalPrice(total);

        PosOrder saved = orderRepository.save(order);
        OrderResponse response = OrderResponse.from(saved, "ORDER_CREATED");
        broadcast(response);
        return response;
    }

    @Transactional
    public OrderResponse updateStatus(UUID orderId, StatusUpdateRequest request, UUID stationProfileId) {
        StationProfile station = stationProfileRepository.findById(stationProfileId)
                .orElseThrow(() -> AppException.notFound("Station profile not found"));

        PosOrder order = orderRepository.findById(orderId)
                .orElseThrow(() -> AppException.notFound("Order not found"));

        PosOrder.OrderStatus target = parseStatus(request.status());
        validateTransition(order.getStatus(), target, station, request.confirmed());

        order.setStatus(target);
        if (target == PosOrder.OrderStatus.COMPLETED) {
            order.setCompletedAt(Instant.now());
        }

        PosOrder saved = orderRepository.save(order);
        OrderResponse response = OrderResponse.from(saved, "ORDER_UPDATED");
        broadcast(response);
        return response;
    }

    public List<OrderResponse> getOrdersForStation(UUID dayId, StationProfile station) {
        List<PosOrder> orders;
        if (station.getSubscribeToStations() == null || station.getSubscribeToStations().isEmpty()) {
            orders = orderRepository.findActiveByEventDay(dayId);
        } else {
            orders = orderRepository.findByEventDayAndStations(dayId, station.getSubscribeToStations());
        }
        return orders.stream().map(o -> OrderResponse.from(o, null)).toList();
    }

    public List<OrderResponse> getAllOrdersForDay(UUID dayId) {
        return orderRepository.findAllByEventDay(dayId).stream()
                .map(o -> OrderResponse.from(o, null)).toList();
    }

    private void validateTransition(PosOrder.OrderStatus current, PosOrder.OrderStatus target,
                                    StationProfile station, boolean confirmed) {
        switch (target) {
            case IN_PROGRESS -> {
                if (current != PosOrder.OrderStatus.PENDING)
                    throw AppException.badRequest("Order must be PENDING to mark IN_PROGRESS");
                if (!station.isCanSetInProgress())
                    throw AppException.forbidden("This station cannot mark orders IN_PROGRESS");
            }
            case COMPLETED -> {
                if (!station.isCanSetCompleted())
                    throw AppException.forbidden("This station cannot mark orders COMPLETED");
                if (current == PosOrder.OrderStatus.PENDING) {
                    if (!station.isCanSkipToCompleted())
                        throw AppException.badRequest("Cannot skip IN_PROGRESS at this station");
                    if (!confirmed)
                        throw AppException.badRequest("Confirmation required to skip directly to COMPLETED");
                } else if (current != PosOrder.OrderStatus.IN_PROGRESS) {
                    throw AppException.badRequest("Order must be IN_PROGRESS (or PENDING with confirmation) to complete");
                }
            }
            default -> throw AppException.badRequest("Invalid target status: " + target);
        }
    }

    private PosOrder.OrderStatus parseStatus(String s) {
        try {
            return PosOrder.OrderStatus.valueOf(s.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw AppException.badRequest("Invalid status: " + s);
        }
    }

    private void broadcast(OrderResponse response) {
        messagingTemplate.convertAndSend("/topic/orders.all", response);
    }
}
