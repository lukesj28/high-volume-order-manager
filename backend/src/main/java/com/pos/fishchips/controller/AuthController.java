package com.pos.fishchips.controller;

import com.pos.fishchips.dto.LoginRequest;
import com.pos.fishchips.dto.LoginResponse;
import com.pos.fishchips.dto.StationProfileDto;
import com.pos.fishchips.exception.AppException;
import com.pos.fishchips.repository.StationProfileRepository;
import com.pos.fishchips.security.PosUserDetails;
import com.pos.fishchips.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final StationProfileRepository stationProfileRepository;

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @GetMapping("/station-profiles")
    public ResponseEntity<List<StationProfileDto>> getStationProfiles() {
        return ResponseEntity.ok(stationProfileRepository.findAllByOrderByDisplayOrderAsc()
                .stream().map(StationProfileDto::from).toList());
    }

    @PostMapping("/select-station")
    public ResponseEntity<Map<String, String>> selectStation(
            @AuthenticationPrincipal PosUserDetails user,
            @RequestBody Map<String, String> body) {
        String stationId = body.get("stationProfileId");
        if (stationId == null) throw AppException.badRequest("stationProfileId required");
        String token = authService.selectStation(user.getUserId(), UUID.fromString(stationId));
        return ResponseEntity.ok(Map.of("token", token));
    }
}
