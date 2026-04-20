package com.taskmanagementsystem.task.service;

import com.taskmanagementsystem.shared.TaskDTO;
import com.taskmanagementsystem.shared.TaskStatus;
import com.taskmanagementsystem.task.mapper.TaskMapper;
import com.taskmanagementsystem.task.model.Task;
import com.taskmanagementsystem.task.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

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

    public List<TaskDTO> getAllTasks() {
        return taskRepository.findAll().stream().map(taskMapper::toDTO).toList();
    }

    public TaskDTO updateTaskById(UUID id, TaskDTO taskDTO){
        Task existing = taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found: " + id));
        if (taskDTO.getTaskName() != null) existing.setTaskName(taskDTO.getTaskName());
        if (taskDTO.getTaskDescription() != null) existing.setTaskDescription(taskDTO.getTaskDescription());
        if (taskDTO.getStatus() != null) existing.setStatus(taskDTO.getStatus());
        return taskMapper.toDTO(taskRepository.save(existing));
    }

    public void deleteTask(UUID id) {
        if (!taskRepository.existsById(id)) {
            throw new RuntimeException("Task not found: " + id);
        }
        taskRepository.deleteById(id);
    }

}
