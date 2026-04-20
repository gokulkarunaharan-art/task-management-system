package com.task.taskmanagementrequesthandler.controller;

import com.task.taskmanagementrequesthandler.service.TaskRequestService;
import com.taskmanagementsystem.shared.TaskDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class Controller {

    private final TaskRequestService service;

    @PostMapping("/task")
    public TaskDTO addTask(@RequestBody TaskDTO taskDTO){
            return service.addTask(taskDTO);
    }

    @GetMapping("/task")
    public List<TaskDTO> getAllTasks(){
        return service.getAllTasks();
    }
}


