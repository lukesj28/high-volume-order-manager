package com.pos.app.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.pos.app.entity.EventDay;
import com.pos.app.exception.AppException;
import com.pos.app.repository.EventDayRepository;
import com.pos.app.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final EventDayRepository eventDayRepository;
    private final ObjectMapper objectMapper;

    @Transactional(readOnly = true)
    public Map<String, Object> getDaySummary(UUID dayId) {
        EventDay day = eventDayRepository.findById(dayId)
                .orElseThrow(() -> AppException.notFound("Day not found"));

        List<Object[]> streamData = orderRepository.revenueByStream(dayId);

        long subtotal = 0;
        long tax = 0;
        int totalOrders = 0;
        List<Map<String, Object>> byStream = new ArrayList<>();

        for (Object[] row : streamData) {
            String stream = (String) row[0];
            long count = ((Number) row[1]).longValue();
            long rowSubtotal = ((Number) row[2]).longValue();
            long rowTax = ((Number) row[3]).longValue();
            subtotal += rowSubtotal;
            tax += rowTax;
            totalOrders += count;
            byStream.add(Map.of(
                    "stream", stream,
                    "orderCount", count,
                    "subtotal", rowSubtotal,
                    "tax", rowTax,
                    "total", rowSubtotal + rowTax
            ));
        }

        List<Object[]> hourData = orderRepository.countOrdersByHourNative(dayId);
        List<Map<String, Object>> hourly = hourData.stream().map(row -> Map.<String, Object>of(
                "hour", ((Number) row[0]).intValue(),
                "count", ((Number) row[1]).longValue()
        )).toList();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("dayId", dayId);
        result.put("label", day.getLabel() != null ? day.getLabel() : "");
        result.put("openedAt", day.getOpenedAt());
        result.put("closedAt", day.getClosedAt() != null ? day.getClosedAt() : "");
        result.put("subtotal", subtotal);
        result.put("tax", tax);
        result.put("total", subtotal + tax);
        result.put("totalOrders", totalOrders);
        result.put("byStream", byStream);
        result.put("hourly", hourly);
        return result;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getComponentCounts(UUID dayId) {
        return orderRepository.componentCountsByEventDay(dayId).stream()
                .map(row -> Map.<String, Object>of(
                        "component", (String) row[0],
                        "total", ((Number) row[1]).longValue()
                )).toList();
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getHistoricalSummaries() {
        return eventDayRepository.findAllOrderByOpenedAtDesc().stream()
                .map(day -> {
                    List<Object[]> stationData = orderRepository.revenueByStation(day.getId());
                    long subtotal = 0, tax = 0, orders = 0;
                    for (Object[] r : stationData) {
                        orders += ((Number) r[1]).longValue();
                        subtotal += ((Number) r[2]).longValue();
                        tax += ((Number) r[3]).longValue();
                    }
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("dayId", day.getId());
                    m.put("label", day.getLabel() != null ? day.getLabel() : day.getOpenedAt().toString().substring(0, 10));
                    m.put("openedAt", day.getOpenedAt());
                    m.put("closedAt", day.getClosedAt());
                    m.put("totalRevenue", subtotal);
                    m.put("tax", tax);
                    m.put("grandTotal", subtotal + tax);
                    m.put("totalOrders", orders);
                    return m;
                }).toList();
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getSnapshot(UUID dayId) {
        EventDay day = eventDayRepository.findById(dayId)
                .orElseThrow(() -> AppException.notFound("Day not found"));
        if (day.getSnapshot() == null) {
            throw AppException.notFound("No snapshot for this day (was it closed before this feature was added?)");
        }
        try {
            return objectMapper.readValue(day.getSnapshot(), new TypeReference<>() {});
        } catch (Exception e) {
            log.error("Failed to parse snapshot for day {}", dayId, e);
            throw new RuntimeException("Failed to parse snapshot", e);
        }
    }

    @Transactional(readOnly = true)
    public Map<String, Object> compareYears(int year1, int year2) {
        List<EventDay> allDays = eventDayRepository.findAllOrderByOpenedAtDesc();

        Map<String, Object> y1 = buildYearSummary(allDays, year1);
        Map<String, Object> y2 = buildYearSummary(allDays, year2);

        return Map.of("year1", y1, "year2", y2);
    }

    private Map<String, Object> buildYearSummary(List<EventDay> allDays, int year) {
        List<EventDay> yearDays = allDays.stream()
                .filter(d -> d.getOpenedAt().toString().startsWith(String.valueOf(year)))
                .toList();

        long totalRevenue = 0;
        long totalOrders = 0;

        for (EventDay day : yearDays) {
            List<Object[]> stationData = orderRepository.revenueByStation(day.getId());
            for (Object[] row : stationData) {
                totalRevenue += ((Number) row[2]).longValue();
                totalOrders += ((Number) row[1]).longValue();
            }
        }

        return Map.of(
                "year", year,
                "eventCount", yearDays.size(),
                "totalRevenue", totalRevenue,
                "totalOrders", totalOrders
        );
    }
}
