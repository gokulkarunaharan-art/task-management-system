package com.taskmanagementsystem.task.controller;

import com.taskmanagementsystem.shared.TaskDTO;
import com.taskmanagementsystem.task.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class Controller {

    private final TaskService service;

    @PostMapping("/task")
    public TaskDTO addTask(TaskDTO taskDTO){
        return service.addTask(taskDTO);
    }

}
