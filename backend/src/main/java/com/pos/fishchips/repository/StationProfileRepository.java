package com.pos.fishchips.repository;

import com.pos.fishchips.entity.StationProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StationProfileRepository extends JpaRepository<StationProfile, UUID> {
    List<StationProfile> findAllByOrderByDisplayOrderAsc();
    Optional<StationProfile> findByName(String name);
}
