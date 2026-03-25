package com.pos.app.controller;

import com.pos.app.entity.EventDay;
import com.pos.app.exception.AppException;
import com.pos.app.repository.EventDayRepository;
import com.pos.app.security.PosUserDetails;
import com.pos.app.service.EventDayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/days")
@RequiredArgsConstructor
public class EventDayController {

    private final EventDayService eventDayService;
    private final EventDayRepository eventDayRepository;

    @GetMapping("/active")
    public ResponseEntity<Optional<EventDay>> getActive() {
        return ResponseEntity.ok(eventDayService.getActiveDay());
    }

    @PostMapping("/open")
    public ResponseEntity<EventDay> open(
            @AuthenticationPrincipal PosUserDetails user,
            @RequestBody(required = false) Map<String, String> body) {
        String label = body != null ? body.get("label") : null;
        return ResponseEntity.ok(eventDayService.openDay(user.getUserId(), label));
    }

    @PostMapping("/close")
    public ResponseEntity<EventDay> close(@AuthenticationPrincipal PosUserDetails user) {
        return ResponseEntity.ok(eventDayService.closeDay(user.getUserId()));
    }

    @GetMapping
    public ResponseEntity<List<EventDay>> getAll() {
        return ResponseEntity.ok(eventDayService.getAllDays());
    }

    @PatchMapping("/settings")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<EventDay> updateSettings(@RequestBody Map<String, Integer> body) {
        EventDay day = eventDayRepository.findByIsActiveTrue()
                .orElseThrow(() -> AppException.notFound("No active day"));
        if (body.containsKey("defaultPickupOffsetMinutes"))
            day.setDefaultPickupOffsetMinutes(body.get("defaultPickupOffsetMinutes"));
        if (body.containsKey("pickupSlotIntervalMinutes"))
            day.setPickupSlotIntervalMinutes(body.get("pickupSlotIntervalMinutes"));
        if (body.containsKey("taxRateBps")) {
            int bps = body.get("taxRateBps");
            if (bps < 0) throw AppException.badRequest("Tax rate cannot be negative");
            day.setTaxRateBps(bps);
        }
        if (day.getDefaultPickupOffsetMinutes() < day.getPickupSlotIntervalMinutes())
            throw AppException.badRequest("Pickup offset cannot be smaller than the slot interval (" + day.getPickupSlotIntervalMinutes() + " min)");
        return ResponseEntity.ok(eventDayRepository.save(day));
    }
}
