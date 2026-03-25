package com.pos.app.service;

import com.pos.app.entity.EventDay;
import com.pos.app.exception.AppException;
import com.pos.app.repository.EventDayRepository;
import com.pos.app.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final EventDayRepository eventDayRepository;

    @Transactional(readOnly = true)
    public Map<String, Object> getDaySummary(UUID dayId) {
        EventDay day = eventDayRepository.findById(dayId)
                .orElseThrow(() -> AppException.notFound("Day not found"));

        List<Object[]> stationData = orderRepository.revenueByStation(dayId);

        long totalRevenue = 0;
        int totalOrders = 0;
        List<Map<String, Object>> byStation = new ArrayList<>();

        for (Object[] row : stationData) {
            String station = (String) row[0];
            long count = ((Number) row[1]).longValue();
            long revenue = ((Number) row[2]).longValue();
            totalRevenue += revenue;
            totalOrders += count;
            byStation.add(Map.of(
                    "station", station,
                    "orderCount", count,
                    "revenue", revenue
            ));
        }

        List<Object[]> hourData = orderRepository.countOrdersByHourNative(dayId);
        List<Map<String, Object>> hourly = hourData.stream().map(row -> Map.<String, Object>of(
                "hour", ((Number) row[0]).intValue(),
                "count", ((Number) row[1]).longValue()
        )).toList();

        return Map.of(
                "dayId", dayId,
                "label", day.getLabel() != null ? day.getLabel() : "",
                "openedAt", day.getOpenedAt(),
                "closedAt", day.getClosedAt() != null ? day.getClosedAt() : "",
                "totalRevenue", totalRevenue,
                "totalOrders", totalOrders,
                "byStation", byStation,
                "hourly", hourly
        );
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
                    long revenue = stationData.stream()
                            .mapToLong(r -> ((Number) r[2]).longValue()).sum();
                    long orders = stationData.stream().mapToLong(r -> ((Number) r[1]).longValue()).sum();
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("dayId", day.getId());
                    m.put("label", day.getLabel() != null ? day.getLabel() : day.getOpenedAt().toString().substring(0, 10));
                    m.put("openedAt", day.getOpenedAt());
                    m.put("closedAt", day.getClosedAt());
                    m.put("totalRevenue", revenue);
                    m.put("totalOrders", orders);
                    return m;
                }).toList();
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
