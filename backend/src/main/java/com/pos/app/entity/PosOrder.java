package com.pos.app.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Data
@NoArgsConstructor
public class PosOrder {

    @Id
    private UUID id; // Set by client (UUID v4)

    private int ticketNumber; // Internal only — not shown to users

    private Integer streamTicketNumber; // Counter-enabled stations only — shown as #N to users

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "event_day_id", nullable = false)
    private EventDay eventDay;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "station_profile_id", nullable = false)
    private StationProfile stationProfile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private OrderStatus status = OrderStatus.PENDING;

    private String pickupName;
    private String sourceApp;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal totalPrice;

    @Column(nullable = false)
    private Instant createdAt; // Client timestamp

    @Column(nullable = false)
    private Instant pickupTime;

    private Instant syncedAt = Instant.now(); // Server receipt timestamp
    private Instant completedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<OrderItem> items = new ArrayList<>();

    public enum OrderStatus { PENDING, IN_PROGRESS, COMPLETED }
}
