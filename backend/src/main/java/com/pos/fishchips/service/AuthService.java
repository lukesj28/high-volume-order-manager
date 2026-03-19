package com.pos.fishchips.service;

import com.pos.fishchips.dto.LoginRequest;
import com.pos.fishchips.dto.LoginResponse;
import com.pos.fishchips.dto.StationProfileDto;
import com.pos.fishchips.entity.StationProfile;
import com.pos.fishchips.entity.User;
import com.pos.fishchips.exception.AppException;
import com.pos.fishchips.repository.StationProfileRepository;
import com.pos.fishchips.repository.UserRepository;
import com.pos.fishchips.security.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final StationProfileRepository stationProfileRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;

    public LoginResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(() -> AppException.forbidden("Invalid credentials"));

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw AppException.forbidden("Invalid credentials");
        }

        String token = jwtService.generateInitialToken(user);
        List<StationProfileDto> profiles = stationProfileRepository.findAllByOrderByDisplayOrderAsc()
                .stream().map(StationProfileDto::from).toList();

        return new LoginResponse(token, user.getRole().name(), user.getUsername(), profiles);
    }

    public String selectStation(UUID userId, UUID stationProfileId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("User not found"));
        stationProfileRepository.findById(stationProfileId)
                .orElseThrow(() -> AppException.notFound("Station profile not found"));
        return jwtService.generateStationToken(user, stationProfileId);
    }

    @Transactional
    public void changeStaffPassword(String newPassword) {
        User staff = userRepository.findAll().stream()
                .filter(u -> u.getRole() == User.Role.STAFF)
                .findFirst()
                .orElseThrow(() -> AppException.notFound("Staff account not found"));
        staff.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(staff);
    }
}
