package com.taskmanagementsystem.shared;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
public class TaskDTO {
    @NotBlank(message = "Task name is required")
    private String taskName;
    private String taskDescription;
}
