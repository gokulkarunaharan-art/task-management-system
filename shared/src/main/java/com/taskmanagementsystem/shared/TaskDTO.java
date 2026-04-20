package com.taskmanagementsystem.shared;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TaskDTO {
    private UUID id;
    private String taskName;
    private String taskDescription;
    private TaskStatus status;
}
