package com.pos.fishchips.controller;

import com.pos.fishchips.dto.MenuItemRequest;
import com.pos.fishchips.entity.MenuItem;
import com.pos.fishchips.service.MenuService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
public class MenuController {

    private final MenuService menuService;

    @GetMapping
    public ResponseEntity<List<MenuItem>> getActive() {
        return ResponseEntity.ok(menuService.getActiveItems());
    }

    @GetMapping("/all")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<List<MenuItem>> getAll() {
        return ResponseEntity.ok(menuService.getAllItems());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MenuItem> create(@Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.ok(menuService.createItem(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<MenuItem> update(@PathVariable UUID id,
                                           @Valid @RequestBody MenuItemRequest request) {
        return ResponseEntity.ok(menuService.updateItem(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        menuService.deleteItem(id);
        return ResponseEntity.noContent().build();
    }
}
