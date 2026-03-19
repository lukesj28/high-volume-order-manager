package com.pos.fishchips.repository;

import com.pos.fishchips.entity.EventDay;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EventDayRepository extends JpaRepository<EventDay, UUID> {

    Optional<EventDay> findByIsActiveTrue();

    @Query("SELECT e FROM EventDay e ORDER BY e.openedAt DESC")
    List<EventDay> findAllOrderByOpenedAtDesc();
}
