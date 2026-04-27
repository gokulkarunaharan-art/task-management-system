package com.taskmanagementsystem.task.service;

import com.taskmanagementsystem.shared.TaskDTO;
import com.taskmanagementsystem.shared.TaskStatus;
import com.taskmanagementsystem.task.event.TaskCreatedEvent;
import com.taskmanagementsystem.task.event.TaskDeletedEvent;
import com.taskmanagementsystem.task.event.TaskUpdatedEvent;
import com.taskmanagementsystem.task.mapper.TaskMapper;
import com.taskmanagementsystem.task.model.Task;
import com.taskmanagementsystem.task.model.UserContext;
import com.taskmanagementsystem.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskMapper taskMapper;
    private final ApplicationEventPublisher eventPublisher;
    private final UserContext userContext;

    public TaskDTO addTask(TaskDTO taskDTO){
        Task newTask = taskMapper.toEntity(taskDTO);
        newTask.setStatus(TaskStatus.PENDING);
        Task savedNewTask = taskRepository.save(newTask);

        eventPublisher.publishEvent(new TaskCreatedEvent(savedNewTask,userContext));
        return taskMapper.toDTO(savedNewTask);
    }

    public List<TaskDTO> getAllTasks() {
        return taskRepository.findAll().stream().map(taskMapper::toDTO).toList();
    }


    public TaskDTO updateTaskById(UUID id, TaskDTO taskDTO){
        Task task = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found: " + id));

        Task oldTask = taskMapper.copy(task);
        taskMapper.updateEntityFromDto(taskDTO,task);
        taskRepository.save(task);

        eventPublisher.publishEvent(new TaskUpdatedEvent(oldTask, task, userContext));
        return taskMapper.toDTO(task);
    }

    public void deleteTask(UUID id) {
        Task deletedTask = taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found: " + id));
        taskRepository.deleteById(id);

        eventPublisher.publishEvent(new TaskDeletedEvent(deletedTask, userContext));
    }

}
