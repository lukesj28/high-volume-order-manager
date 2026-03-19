package com.pos.fishchips.controller;

import com.pos.fishchips.entity.EventDay;
import com.pos.fishchips.security.PosUserDetails;
import com.pos.fishchips.service.EventDayService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
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
}
