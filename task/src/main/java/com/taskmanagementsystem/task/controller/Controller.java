package com.taskmanagementsystem.task.controller;

import com.taskmanagementsystem.shared.TaskDTO;
import com.taskmanagementsystem.task.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class Controller {

    private final TaskService service;
    public static final String TASK_ENDPOINT = "/task";
    public static final String TASK_ENDPOINT_ID = TASK_ENDPOINT + "/{id}";

    @PostMapping(TASK_ENDPOINT)
    public TaskDTO addTask(@RequestBody TaskDTO taskDTO){
        return service.addTask(taskDTO);
    }

    @GetMapping(TASK_ENDPOINT)
    public List<TaskDTO> getTask() {
        return service.getAllTasks();
    }

    @PutMapping(TASK_ENDPOINT_ID)
    public TaskDTO updateTask(@PathVariable UUID id, @RequestBody TaskDTO taskDTO) {
        return service.updateTaskById(id, taskDTO);
    }

    @DeleteMapping(TASK_ENDPOINT_ID)
    public void deleteTask(@PathVariable UUID id) {
        service.deleteTask(id);
    }
}