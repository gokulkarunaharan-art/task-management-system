package com.taskmanagementsystem.authserver.bootstrap;

import com.taskmanagementsystem.authserver.model.User;
import com.taskmanagementsystem.authserver.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InitialUsers implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args){
        addSuperAdmin();
    }

    public void addSuperAdmin() {
        if (userRepository.findByUsername("superadmin").isEmpty()) {
            User superAdmin = User.builder()
                    .username("superadmin")
                    .password(passwordEncoder.encode("superadmin"))
                    .roles("ROLE_SUPER_ADMIN")
                    .build();
            userRepository.save(superAdmin);
        }
    }
}
