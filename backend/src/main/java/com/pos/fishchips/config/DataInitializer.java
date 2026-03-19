package com.pos.fishchips.config;

import com.pos.fishchips.entity.User;
import com.pos.fishchips.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@Slf4j
public class DataInitializer {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Bean
    public ApplicationRunner initUsers() {
        return args -> {
            if (!userRepository.existsByRole(User.Role.ADMIN)) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                admin.setRole(User.Role.ADMIN);
                userRepository.save(admin);
                log.warn("Created default admin account (username: admin, password: admin123) - CHANGE THIS IN PRODUCTION");
            }

            if (!userRepository.existsByRole(User.Role.STAFF)) {
                User staff = new User();
                staff.setUsername("staff");
                staff.setPasswordHash(passwordEncoder.encode("staff123"));
                staff.setRole(User.Role.STAFF);
                userRepository.save(staff);
                log.warn("Created default staff account (username: staff, password: staff123) - CHANGE THIS IN PRODUCTION");
            }
        };
    }
}
