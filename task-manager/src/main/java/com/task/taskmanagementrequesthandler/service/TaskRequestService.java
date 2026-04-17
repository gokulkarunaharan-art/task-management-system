package com.task.taskmanagementrequesthandler.service;

import com.taskmanagementsystem.shared.TaskDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TaskRequestService {

    private final TaskService taskService;

    public TaskDTO addTask(TaskDTO taskDTO) {

    }
}
