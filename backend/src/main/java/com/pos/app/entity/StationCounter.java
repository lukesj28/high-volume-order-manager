package com.pos.app.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.util.UUID;

@Entity
@Table(name = "station_counters")
@IdClass(StationCounter.StationCounterId.class)
@Data
@NoArgsConstructor
public class StationCounter {

    @Id
    @Column(name = "station_profile_id")
    private UUID stationProfileId;

    @Id
    @Column(name = "event_day_id")
    private UUID eventDayId;

    @Column(name = "next_value", nullable = false)
    private int nextValue = 1;

    @Data
    @NoArgsConstructor
    public static class StationCounterId implements Serializable {
        private UUID stationProfileId;
        private UUID eventDayId;
    }
}
