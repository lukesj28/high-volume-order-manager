package com.pos.app.controller;

import com.pos.app.dto.LoginRequest;
import com.pos.app.dto.LoginResponse;
import com.pos.app.dto.StationProfileDto;
import com.pos.app.exception.AppException;
import com.pos.app.repository.StationProfileRepository;
import com.pos.app.security.PosUserDetails;
import com.pos.app.service.AuthService;
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
