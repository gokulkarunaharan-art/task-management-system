package com.taskmanagementsystem.shared;

import jakarta.validation.constraints.NotBlank;
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
    @NotBlank
    private String taskName;
    @NotBlank
    private String taskDescription;
    private TaskStatus status;
}
