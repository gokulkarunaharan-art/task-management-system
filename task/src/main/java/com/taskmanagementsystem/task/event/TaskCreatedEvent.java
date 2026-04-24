package com.taskmanagementsystem.task.event;

import com.taskmanagementsystem.task.model.Task;
import com.taskmanagementsystem.task.model.UserContext;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class TaskCreatedEvent {
    private Task createdTask;
    private UserContext userContext;
}
