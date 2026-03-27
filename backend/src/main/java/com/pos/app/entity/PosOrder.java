package com.pos.app.entity;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private UUID id;

    private int ticketNumber;

    private Integer streamTicketNumber;

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
    private String targetStationName;

    @Column(nullable = false)
    private int totalPrice;

    @Column(nullable = false)
    private int taxRateBps;

    @Column(nullable = false)
    private Instant createdAt;

    @Column(nullable = false)
    private Instant pickupTime;

    private Instant syncedAt = Instant.now();
    private Instant completedAt;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonManagedReference
    private List<OrderItem> items = new ArrayList<>();

    public String getEffectiveStationName() {
        return targetStationName != null ? targetStationName : stationProfile.getName();
    }

    public enum OrderStatus { PENDING, IN_PROGRESS, COMPLETED }
}
