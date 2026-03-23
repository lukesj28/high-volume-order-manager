package com.pos.app.repository;

import com.pos.app.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MenuItemRepository extends JpaRepository<MenuItem, UUID> {
    List<MenuItem> findByActiveTrueOrderByDisplayOrderAsc();
    List<MenuItem> findAllByOrderByDisplayOrderAsc();
}
