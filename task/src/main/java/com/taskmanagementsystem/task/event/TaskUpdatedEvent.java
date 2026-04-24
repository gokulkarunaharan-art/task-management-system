package com.taskmanagementsystem.task.event;

import com.taskmanagementsystem.task.model.Task;
import com.taskmanagementsystem.task.model.UserContext;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@AllArgsConstructor
@NoArgsConstructor
@Getter
@Setter
public class TaskUpdatedEvent {
    private Task oldTask;
    private Task newTask;
    private UserContext userContext;
}
