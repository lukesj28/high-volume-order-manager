package com.pos.fishchips.entity;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Entity
@Table(name = "menu_item_components")
@Data
@NoArgsConstructor
public class MenuItemComponent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "menu_item_id", nullable = false)
    @JsonBackReference
    private MenuItem menuItem;

    @Column(nullable = false)
    private String componentName;

    private int componentQuantity = 1;
}
