package com.taskmanagementsystem.authserver.controller;

import com.taskmanagementsystem.authserver.dto.UserDTO;
import com.taskmanagementsystem.authserver.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @PostMapping("/register")
    public void registerAdmin(@RequestBody UserDTO userDTO) {
        userService.createUser(userDTO);
    }
}
