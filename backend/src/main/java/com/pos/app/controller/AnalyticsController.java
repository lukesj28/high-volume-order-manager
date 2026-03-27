package com.pos.app.controller;

import com.pos.app.service.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/analytics")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> summary(@RequestParam UUID dayId) {
        return ResponseEntity.ok(analyticsService.getDaySummary(dayId));
    }

    @GetMapping("/components")
    public ResponseEntity<List<Map<String, Object>>> components(@RequestParam UUID dayId) {
        return ResponseEntity.ok(analyticsService.getComponentCounts(dayId));
    }

    @GetMapping("/historical")
    public ResponseEntity<List<Map<String, Object>>> historical() {
        return ResponseEntity.ok(analyticsService.getHistoricalSummaries());
    }

    @GetMapping("/compare")
    public ResponseEntity<Map<String, Object>> compare(@RequestParam int year1, @RequestParam int year2) {
        return ResponseEntity.ok(analyticsService.compareYears(year1, year2));
    }

    @GetMapping("/snapshot")
    public ResponseEntity<Map<String, Object>> snapshot(@RequestParam UUID dayId) {
        return ResponseEntity.ok(analyticsService.getSnapshot(dayId));
    }
}
