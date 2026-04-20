package com.task.taskmanagementrequesthandler.service;

import com.taskmanagementsystem.shared.TaskDTO;
import lombok.RequiredArgsConstructor;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskRequestService {

    private final RestClient restClient;

    public TaskDTO addTask(TaskDTO taskDTO) {
        return restClient
                .post()
                .uri("/task")
                .body(taskDTO)
                .retrieve()
                .body(TaskDTO.class);
    }

    public List<TaskDTO> getAllTasks() {
        return restClient
                .get()
                .uri("/task")
                .retrieve()
                .body(new  ParameterizedTypeReference<List<TaskDTO>>() {});
    }
}
