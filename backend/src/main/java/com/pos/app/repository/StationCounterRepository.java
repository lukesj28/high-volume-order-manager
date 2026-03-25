package com.pos.app.repository;

import com.pos.app.entity.StationCounter;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StationCounterRepository extends JpaRepository<StationCounter, StationCounter.StationCounterId> {

    Optional<StationCounter> findByStationProfileIdAndEventDayId(UUID stationProfileId, UUID eventDayId);

    List<StationCounter> findAllByEventDayId(UUID eventDayId);
}
