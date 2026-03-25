package com.pos.app.controller;

import com.pos.app.dto.StationProfileDto;
import com.pos.app.entity.EventDay;
import com.pos.app.entity.StationCounter;
import com.pos.app.entity.StationProfile;
import com.pos.app.exception.AppException;
import com.pos.app.repository.EventDayRepository;
import com.pos.app.repository.StationCounterRepository;
import com.pos.app.repository.StationProfileRepository;
import com.pos.app.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final StationProfileRepository stationProfileRepository;
    private final StationCounterRepository stationCounterRepository;
    private final EventDayRepository eventDayRepository;
    private final AuthService authService;

    @GetMapping("/station-profiles")
    public ResponseEntity<List<StationProfileDto>> getProfiles() {
        List<StationProfile> profiles = stationProfileRepository.findAllByOrderByDisplayOrderAsc();

        // Fetch all counters for active day in one query to avoid N+1
        Optional<EventDay> activeDay = eventDayRepository.findByIsActiveTrue();
        Map<UUID, Integer> countersByStation = activeDay
                .map(day -> stationCounterRepository.findAllByEventDayId(day.getId()).stream()
                        .collect(Collectors.toMap(StationCounter::getStationProfileId, StationCounter::getNextValue)))
                .orElse(Map.of());

        return ResponseEntity.ok(profiles.stream()
                .map(sp -> StationProfileDto.from(sp, countersByStation.get(sp.getId())))
                .toList());
    }

    @PostMapping("/station-profiles")
    public ResponseEntity<StationProfileDto> createProfile(@RequestBody StationProfileDto dto) {
        StationProfile sp = new StationProfile();
        applyDto(sp, dto);
        StationProfile saved = stationProfileRepository.save(sp);
        upsertCounterIfNeeded(saved, dto);
        return ResponseEntity.ok(StationProfileDto.from(saved, dto.counterNextValue()));
    }

    @PutMapping("/station-profiles/{id}")
    public ResponseEntity<StationProfileDto> updateProfile(@PathVariable UUID id,
                                                           @RequestBody StationProfileDto dto) {
        StationProfile sp = stationProfileRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Station profile not found"));
        applyDto(sp, dto);
        StationProfile saved = stationProfileRepository.save(sp);
        upsertCounterIfNeeded(saved, dto);
        return ResponseEntity.ok(StationProfileDto.from(saved, dto.counterNextValue()));
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
        sp.setCounterEnabled(dto.counterEnabled());
    }

    // If counter is enabled and a next value is provided, upsert station_counters for the active day
    private void upsertCounterIfNeeded(StationProfile sp, StationProfileDto dto) {
        if (!dto.counterEnabled() || dto.counterNextValue() == null) return;
        if (dto.counterNextValue() < 1)
            throw AppException.badRequest("Counter next value must be at least 1");
        eventDayRepository.findByIsActiveTrue().ifPresent(day -> {
            StationCounter counter = stationCounterRepository
                    .findByStationProfileIdAndEventDayId(sp.getId(), day.getId())
                    .orElseGet(() -> {
                        StationCounter c = new StationCounter();
                        c.setStationProfileId(sp.getId());
                        c.setEventDayId(day.getId());
                        return c;
                    });
            counter.setNextValue(dto.counterNextValue());
            stationCounterRepository.save(counter);
        });
    }
}
