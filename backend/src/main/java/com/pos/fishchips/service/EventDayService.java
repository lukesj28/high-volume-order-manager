package com.pos.fishchips.service;

import com.pos.fishchips.entity.EventDay;
import com.pos.fishchips.entity.User;
import com.pos.fishchips.exception.AppException;
import com.pos.fishchips.repository.EventDayRepository;
import com.pos.fishchips.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EventDayService {

    private final EventDayRepository eventDayRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    public Optional<EventDay> getActiveDay() {
        return eventDayRepository.findByIsActiveTrue();
    }

    @Transactional
    public EventDay openDay(UUID userId, String label) {
        if (eventDayRepository.findByIsActiveTrue().isPresent()) {
            throw AppException.conflict("A day is already open. Close it first.");
        }
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
        EventDay day = new EventDay();
        day.setOpenedBy(user);
        day.setLabel(label);
        EventDay saved = eventDayRepository.save(day);
        messagingTemplate.convertAndSend("/topic/orders.day",
                Map.of("type", "DAY_OPENED", "dayId", saved.getId().toString()));
        return saved;
    }

    @Transactional
    public EventDay closeDay(UUID userId) {
        EventDay day = eventDayRepository.findByIsActiveTrue()
                .orElseThrow(() -> AppException.badRequest("No active day to close."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
        day.setActive(false);
        day.setClosedAt(Instant.now());
        day.setClosedBy(user);
        EventDay saved = eventDayRepository.save(day);
        messagingTemplate.convertAndSend("/topic/orders.day",
                Map.of("type", "DAY_CLOSED", "dayId", saved.getId().toString()));
        return saved;
    }

    public List<EventDay> getAllDays() {
        return eventDayRepository.findAllOrderByOpenedAtDesc();
    }
}
