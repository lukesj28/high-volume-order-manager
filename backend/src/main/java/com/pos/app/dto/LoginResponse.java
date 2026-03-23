package com.pos.app.dto;

import com.pos.app.entity.StationProfile;

import java.util.List;

public record LoginResponse(
        String token,
        String role,
        String username,
        List<StationProfileDto> stationProfiles
) {}
