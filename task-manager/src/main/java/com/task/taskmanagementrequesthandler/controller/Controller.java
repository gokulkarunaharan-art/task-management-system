package com.task.taskmanagementrequesthandler.controller;

import com.task.taskmanagementrequesthandler.service.TaskRequestService;
import com.taskmanagementsystem.shared.TaskDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class Controller {

    private final TaskRequestService service;
    public static final String TASK_ENDPOINT = "/task";
    public static final String TASK_ENDPOINT_ID = TASK_ENDPOINT + "/{id}";

    @PostMapping(TASK_ENDPOINT)
    public TaskDTO addTask(@RequestBody TaskDTO taskDTO){
            return service.addTask(taskDTO);
    }

    @GetMapping(TASK_ENDPOINT)
    public List<TaskDTO> getAllTasks(){
        return service.getAllTasks();
    }

    @PatchMapping(TASK_ENDPOINT_ID)
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    public TaskDTO updateTask(@PathVariable UUID id, @RequestBody TaskDTO taskDTO) {
        return service.updateTask(id, taskDTO);
    }

    @DeleteMapping(TASK_ENDPOINT_ID)
    @PreAuthorize("hasAuthority('ROLE_ADMIN')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteTask(@PathVariable UUID id) {
        service.deleteTask(id);
    }

}


