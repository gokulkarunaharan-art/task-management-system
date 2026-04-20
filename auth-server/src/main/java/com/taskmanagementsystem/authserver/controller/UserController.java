package com.taskmanagementsystem.authserver.controller;

import com.taskmanagementsystem.authserver.dto.UserDTO;
import com.taskmanagementsystem.authserver.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;
    public static final String USER_ENDPOINT = "/user";

    @PostMapping(USER_ENDPOINT)
    public void registerUser(@RequestBody UserDTO userDTO) {
        userService.createUser(userDTO);
    }

    @DeleteMapping(USER_ENDPOINT)
    public void deleteUser(@RequestBody UserDTO userDTO) {
        userService.deleteUser(userDTO);
    }
}
