package com.taskmanagementsystem.authserver.service;

import com.taskmanagementsystem.authserver.dto.UserDTO;
import com.taskmanagementsystem.authserver.model.User;
import com.taskmanagementsystem.authserver.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public void createUser(UserDTO userDTO) {
        userRepository.save(User.builder()
                .username(userDTO.getUsername())
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .roles(userDTO.getRoles())
                .build());
    }
}
