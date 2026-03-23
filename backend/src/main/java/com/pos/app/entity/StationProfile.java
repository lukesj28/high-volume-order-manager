package com.pos.app.entity;

import com.pos.app.converter.JsonbConverter;
import com.pos.app.converter.StringListConverter;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "station_profiles")
@Data
@NoArgsConstructor
public class StationProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(unique = true, nullable = false)
    private String name;

    private boolean canSubmit;
    private boolean canSetInProgress;
    private boolean canSetCompleted;
    private boolean canSkipToCompleted;

    @Convert(converter = StringListConverter.class)
    @Column(columnDefinition = "TEXT")
    private List<String> subscribeToStations; // null = subscribe to all

    @Convert(converter = JsonbConverter.class)
    @Column(columnDefinition = "jsonb")
    private Map<String, Object> displayConfig;

    private int displayOrder;
}
