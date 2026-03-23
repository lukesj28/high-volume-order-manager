package com.pos.app.dto;

import com.pos.app.entity.StationProfile;

import java.util.List;
import java.util.Map;
import java.util.UUID;

public record StationProfileDto(
        UUID id,
        String name,
        boolean canSubmit,
        boolean canSetInProgress,
        boolean canSetCompleted,
        boolean canSkipToCompleted,
        List<String> subscribeToStations,
        Map<String, Object> displayConfig,
        int displayOrder
) {
    public static StationProfileDto from(StationProfile sp) {
        return new StationProfileDto(
                sp.getId(), sp.getName(),
                sp.isCanSubmit(), sp.isCanSetInProgress(),
                sp.isCanSetCompleted(), sp.isCanSkipToCompleted(),
                sp.getSubscribeToStations(), sp.getDisplayConfig(),
                sp.getDisplayOrder()
        );
    }
}
