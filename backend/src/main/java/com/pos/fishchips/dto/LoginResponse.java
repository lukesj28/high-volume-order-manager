package com.pos.fishchips.dto;

import com.pos.fishchips.entity.StationProfile;

import java.util.List;

public record LoginResponse(
        String token,
        String role,
        String username,
        List<StationProfileDto> stationProfiles
) {}
