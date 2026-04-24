package com.taskmanagementsystem.authserver.service;

import com.taskmanagementsystem.authserver.dto.UserDTO;
import com.taskmanagementsystem.authserver.exception.OperationNotAllowedException;
import com.taskmanagementsystem.authserver.model.User;
import com.taskmanagementsystem.authserver.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public void createUser(UserDTO userDTO) {
        userRepository.findByUsername(userDTO.getUsername()).ifPresent(user -> {
            throw new RuntimeException("Username already exists: " + userDTO.getUsername());
        });
        userRepository.save(User.builder()
                .username(userDTO.getUsername())
                .password(passwordEncoder.encode(userDTO.getPassword()))
                .email(userDTO.getEmail())
                .roles(userDTO.getRoles())
                .build());
    }

    public void deleteUser(UserDTO userDTO) {
        if(SecurityContextHolder.getContext().getAuthentication().getName().equals(userDTO.getUsername())){
            throw new OperationNotAllowedException("cannot delete the current logged in user");
        }
        Optional<User> user = userRepository.findByUsername(userDTO.getUsername());
        if(user.isEmpty()){
            throw new RuntimeException("Username doesn't exist: " + userDTO.getUsername());
        }
        userRepository.delete(user.get());
        if(SecurityContextHolder.getContext().getAuthentication().getPrincipal().equals(userDTO.getUsername())){;
            SecurityContextHolder.clearContext();
        }
        SecurityContextHolder.getContext().getAuthentication().getPrincipal().equals(userDTO.getUsername());
    }
}
