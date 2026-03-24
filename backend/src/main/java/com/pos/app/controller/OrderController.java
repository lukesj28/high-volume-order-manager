package com.pos.app.controller;

import com.pos.app.dto.OrderRequest;
import com.pos.app.dto.OrderResponse;
import com.pos.app.dto.StatusUpdateRequest;
import com.pos.app.entity.EventDay;
import com.pos.app.entity.StationProfile;
import com.pos.app.exception.AppException;
import com.pos.app.repository.StationProfileRepository;
import com.pos.app.security.PosUserDetails;
import com.pos.app.service.EventDayService;
import com.pos.app.service.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final EventDayService eventDayService;
    private final StationProfileRepository stationProfileRepository;

    @PostMapping
    public ResponseEntity<OrderResponse> submit(
            @AuthenticationPrincipal PosUserDetails user,
            @Valid @RequestBody OrderRequest request) {
        UUID stationId = requireStation(user);
        return ResponseEntity.ok(orderService.submitOrder(request, stationId));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<OrderResponse> updateStatus(
            @AuthenticationPrincipal PosUserDetails user,
            @PathVariable UUID id,
            @Valid @RequestBody StatusUpdateRequest request) {
        UUID stationId = requireStation(user);
        return ResponseEntity.ok(orderService.updateStatus(id, request, stationId));
    }

    @GetMapping("/active")
    public ResponseEntity<List<OrderResponse>> getActive(
            @AuthenticationPrincipal PosUserDetails user) {
        UUID stationId = requireStation(user);
        EventDay day = eventDayService.getActiveDay()
                .orElseThrow(() -> AppException.badRequest("No active day"));
        StationProfile station = stationProfileRepository.findById(stationId)
                .orElseThrow(() -> AppException.notFound("Station not found"));
        return ResponseEntity.ok(orderService.getOrdersForStation(day.getId(), station));
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<OrderResponse>> getAll() {
        EventDay day = eventDayService.getActiveDay()
                .orElseThrow(() -> AppException.badRequest("No active day"));
        return ResponseEntity.ok(orderService.getAllOrdersForDay(day.getId()));
    }

    private UUID requireStation(PosUserDetails user) {
        if (user.getStationProfileId() == null) {
            throw AppException.forbidden("Station not selected. Please select a station first.");
        }
        return user.getStationProfileId();
    }
}
