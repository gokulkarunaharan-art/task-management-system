package com.taskmanagementsystem.task.controller;

import com.taskmanagementsystem.shared.TaskDTO;
import com.taskmanagementsystem.task.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class Controller {

    private final TaskService service;

    @PostMapping("/task")
    public TaskDTO addTask(@RequestBody TaskDTO taskDTO){
        return service.addTask(taskDTO);
    }

    @GetMapping("/task")
    public List<TaskDTO> getTask(){
        return service.getAllTasks();
    }

    @PatchMapping("/task/{id}")
    public TaskDTO updateTask(@PathVariable UUID id, @RequestBody TaskDTO taskDTO) {
        return service.updateTaskById(id, taskDTO);
    }
    @DeleteMapping("/task/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(@PathVariable UUID id) {
        service.deleteTask(id);
    }
}


