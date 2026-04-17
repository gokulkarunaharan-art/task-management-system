package com.task.taskmanagementrequesthandler.controller;

import com.task.taskmanagementrequesthandler.service.TaskRequestService;
import com.taskmanagementsystem.shared.TaskDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class Controller {

    private final TaskRequestService service;

    @PostMapping
    public TaskDTO addTask(@RequestBody TaskDTO taskDTO){
            service.addTask(taskDTO);
    }

}
