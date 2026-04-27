package com.taskmanagementsystem.task.model;

import com.taskmanagementsystem.shared.TaskStatus;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
@Table(name = "task")
public class Task {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    private String taskName;
    private String taskDescription;
    @Enumerated(EnumType.STRING)
    private TaskStatus status;
}
