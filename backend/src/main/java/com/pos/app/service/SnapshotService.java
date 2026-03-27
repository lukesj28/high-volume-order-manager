package com.pos.app.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.app.entity.*;
import com.pos.app.repository.MenuItemRepository;
import com.pos.app.repository.OrderRepository;
import com.pos.app.repository.StationProfileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SnapshotService {

    private final MenuItemRepository menuItemRepository;
    private final StationProfileRepository stationProfileRepository;
    private final OrderRepository orderRepository;
    private final ObjectMapper objectMapper;

    public String buildSnapshot(EventDay day) {
        try {
            Map<String, Object> snapshot = new LinkedHashMap<>();
            snapshot.put("capturedAt", Instant.now().toString());
            snapshot.put("system", buildSystem(day));
            snapshot.put("orders", buildOrders(day));
            snapshot.put("aggregates", buildAggregates(day));
            return objectMapper.writeValueAsString(snapshot);
        } catch (Exception e) {
            log.error("Failed to build snapshot for day {}", day.getId(), e);
            throw new RuntimeException("Snapshot failed", e);
        }
    }

    private Map<String, Object> buildSystem(EventDay day) {
        List<Map<String, Object>> menu = menuItemRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(item -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("id", item.getId().toString());
                    m.put("name", item.getName());
                    m.put("priceCents", item.getPrice());
                    m.put("active", item.isActive());
                    List<Map<String, Object>> comps = item.getComponents().stream()
                            .map(c -> Map.<String, Object>of("name", c.getComponentName(), "qty", c.getComponentQuantity()))
                            .toList();
                    m.put("components", comps);
                    return m;
                }).toList();

        List<Map<String, Object>> stations = stationProfileRepository.findAllByOrderByDisplayOrderAsc().stream()
                .map(s -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("name", s.getName());
                    m.put("canSubmit", s.isCanSubmit());
                    m.put("canSetInProgress", s.isCanSetInProgress());
                    m.put("canSetCompleted", s.isCanSetCompleted());
                    m.put("canSkipToCompleted", s.isCanSkipToCompleted());
                    return m;
                }).toList();

        Map<String, Object> system = new LinkedHashMap<>();
        system.put("taxRateBps", day.getTaxRateBps());
        system.put("defaultPickupOffsetMinutes", day.getDefaultPickupOffsetMinutes());
        system.put("menu", menu);
        system.put("stations", stations);
        return system;
    }

    private List<Map<String, Object>> buildOrders(EventDay day) {
        return orderRepository.findAllByEventDay(day.getId()).stream()
                .map(order -> {
                    Map<String, Object> o = new LinkedHashMap<>();
                    o.put("id", order.getId().toString());
                    o.put("ticket", order.getTicketNumber());
                    o.put("streamTicket", order.getStreamTicketNumber());
                    o.put("station", order.getEffectiveStationName());
                    o.put("status", order.getStatus().name());
                    o.put("pickupName", order.getPickupName());
                    o.put("sourceApp", order.getSourceApp());
                    o.put("totalCents", order.getTotalPrice());
                    o.put("taxRateBps", order.getTaxRateBps());
                    o.put("createdAt", order.getCreatedAt().toString());
                    o.put("pickupTime", order.getPickupTime() != null ? order.getPickupTime().toString() : null);
                    o.put("completedAt", order.getCompletedAt() != null ? order.getCompletedAt().toString() : null);
                    List<Map<String, Object>> items = order.getItems().stream()
                            .map(i -> Map.<String, Object>of(
                                    "name", i.getMenuItem().getName(),
                                    "qty", i.getQuantity(),
                                    "unitCents", i.getUnitPrice()
                            )).toList();
                    o.put("items", items);
                    return o;
                }).toList();
    }

    private Map<String, Object> buildAggregates(EventDay day) {
        // by-station
        List<Object[]> stationData = orderRepository.revenueByStation(day.getId());
        long totalRevenue = 0;
        int totalOrders = 0;
        List<Map<String, Object>> byStation = new ArrayList<>();
        for (Object[] row : stationData) {
            long count = ((Number) row[1]).longValue();
            long revenue = ((Number) row[2]).longValue();
            totalRevenue += revenue;
            totalOrders += count;
            byStation.add(Map.of("station", row[0], "orders", count, "revenueCents", revenue));
        }

        // hourly
        List<Map<String, Object>> hourly = orderRepository.countOrdersByHourNative(day.getId()).stream()
                .map(row -> Map.<String, Object>of(
                        "hour", ((Number) row[0]).intValue(),
                        "count", ((Number) row[1]).longValue()
                )).toList();

        // components
        List<Map<String, Object>> components = orderRepository.componentCountsByEventDay(day.getId()).stream()
                .map(row -> Map.<String, Object>of(
                        "component", row[0],
                        "total", ((Number) row[1]).longValue()
                )).toList();

        Map<String, Object> agg = new LinkedHashMap<>();
        agg.put("totalOrders", totalOrders);
        agg.put("totalRevenueCents", totalRevenue);
        agg.put("byStation", byStation);
        agg.put("hourly", hourly);
        agg.put("components", components);
        return agg;
    }
}
