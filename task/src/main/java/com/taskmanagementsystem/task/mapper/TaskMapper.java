package com.taskmanagementsystem.task.mapper;

import com.taskmanagementsystem.shared.TaskDTO;
import com.taskmanagementsystem.task.model.Task;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface TaskMapper {
    TaskDTO toDTO(Task task);
    Task toEntity(TaskDTO taskDTO);
    Task updateEntityFromDto(TaskDTO taskDTO, @MappingTarget Task task);
}