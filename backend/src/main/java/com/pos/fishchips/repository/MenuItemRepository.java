package com.pos.fishchips.repository;

import com.pos.fishchips.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {
    List<MenuItem> findByActiveTrueOrderByDisplayOrderAsc();
    List<MenuItem> findAllByOrderByDisplayOrderAsc();
}
