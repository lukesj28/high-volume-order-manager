package com.pos.app.service;

import com.pos.app.dto.MenuItemRequest;
import com.pos.app.entity.MenuItem;
import com.pos.app.entity.MenuItemComponent;
import com.pos.app.exception.AppException;
import com.pos.app.repository.MenuItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MenuService {

    private final MenuItemRepository menuItemRepository;

    public List<MenuItem> getActiveItems() {
        return menuItemRepository.findByActiveTrueOrderByDisplayOrderAsc();
    }

    public List<MenuItem> getAllItems() {
        return menuItemRepository.findAllByOrderByDisplayOrderAsc();
    }

    @Transactional
    public MenuItem createItem(MenuItemRequest request) {
        MenuItem item = new MenuItem();
        item.setName(request.name());
        item.setPrice(request.price());
        item.setDisplayOrder(request.displayOrder());
        applyComponents(item, request);
        return menuItemRepository.save(item);
    }

    @Transactional
    public MenuItem updateItem(UUID id, MenuItemRequest request) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Menu item not found"));
        item.setName(request.name());
        item.setPrice(request.price());
        item.setDisplayOrder(request.displayOrder());
        item.getComponents().clear();
        applyComponents(item, request);
        return menuItemRepository.save(item);
    }

    @Transactional
    public void deleteItem(UUID id) {
        MenuItem item = menuItemRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Menu item not found"));
        item.setActive(false);
        menuItemRepository.save(item);
    }

    private void applyComponents(MenuItem item, MenuItemRequest request) {
        if (request.components() != null) {
            for (MenuItemRequest.ComponentRequest cr : request.components()) {
                MenuItemComponent comp = new MenuItemComponent();
                comp.setMenuItem(item);
                comp.setComponentName(cr.componentName());
                comp.setComponentQuantity(cr.componentQuantity() > 0 ? cr.componentQuantity() : 1);
                item.getComponents().add(comp);
            }
        }
    }
}
