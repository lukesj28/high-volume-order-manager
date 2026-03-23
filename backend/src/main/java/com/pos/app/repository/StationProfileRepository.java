package com.pos.app.repository;

import com.pos.app.entity.StationProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface StationProfileRepository extends JpaRepository<StationProfile, UUID> {
    List<StationProfile> findAllByOrderByDisplayOrderAsc();
    Optional<StationProfile> findByName(String name);
}
