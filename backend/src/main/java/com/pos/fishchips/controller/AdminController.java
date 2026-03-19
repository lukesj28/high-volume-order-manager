package com.pos.fishchips.controller;

import com.pos.fishchips.dto.StationProfileDto;
import com.pos.fishchips.entity.StationProfile;
import com.pos.fishchips.exception.AppException;
import com.pos.fishchips.repository.StationProfileRepository;
import com.pos.fishchips.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final StationProfileRepository stationProfileRepository;
    private final AuthService authService;

    @GetMapping("/station-profiles")
    public ResponseEntity<List<StationProfileDto>> getProfiles() {
        return ResponseEntity.ok(stationProfileRepository.findAllByOrderByDisplayOrderAsc()
                .stream().map(StationProfileDto::from).toList());
    }

    @PostMapping("/station-profiles")
    public ResponseEntity<StationProfileDto> createProfile(@RequestBody StationProfileDto dto) {
        StationProfile sp = new StationProfile();
        applyDto(sp, dto);
        return ResponseEntity.ok(StationProfileDto.from(stationProfileRepository.save(sp)));
    }

    @PutMapping("/station-profiles/{id}")
    public ResponseEntity<StationProfileDto> updateProfile(@PathVariable UUID id,
                                                           @RequestBody StationProfileDto dto) {
        StationProfile sp = stationProfileRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Station profile not found"));
        applyDto(sp, dto);
        return ResponseEntity.ok(StationProfileDto.from(stationProfileRepository.save(sp)));
    }

    @DeleteMapping("/station-profiles/{id}")
    public ResponseEntity<Void> deleteProfile(@PathVariable UUID id) {
        if (!stationProfileRepository.existsById(id)) throw AppException.notFound("Station profile not found");
        stationProfileRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/staff-password")
    public ResponseEntity<Void> changeStaffPassword(@RequestBody Map<String, String> body) {
        String password = body.get("password");
        if (password == null || password.length() < 6)
            throw AppException.badRequest("Password must be at least 6 characters");
        authService.changeStaffPassword(password);
        return ResponseEntity.noContent().build();
    }

    private void applyDto(StationProfile sp, StationProfileDto dto) {
        sp.setName(dto.name());
        sp.setCanSubmit(dto.canSubmit());
        sp.setCanSetInProgress(dto.canSetInProgress());
        sp.setCanSetCompleted(dto.canSetCompleted());
        sp.setCanSkipToCompleted(dto.canSkipToCompleted());
        sp.setSubscribeToStations(dto.subscribeToStations());
        sp.setDisplayConfig(dto.displayConfig());
        sp.setDisplayOrder(dto.displayOrder());
    }
}
