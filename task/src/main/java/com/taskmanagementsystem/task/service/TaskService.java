package com.taskmanagementsystem.task.service;

import com.taskmanagementsystem.shared.TaskDTO;
import com.taskmanagementsystem.shared.TaskStatus;
import com.taskmanagementsystem.task.mapper.TaskMapper;
import com.taskmanagementsystem.task.model.Task;
import com.taskmanagementsystem.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;

    public TaskDTO addTask(TaskDTO taskDTO){
        Task newTask = taskMapper.toEntity(taskDTO);
        newTask.setStatus(TaskStatus.PENDING);
        return taskMapper.toDTO(taskRepository.save(newTask));
    }
}
