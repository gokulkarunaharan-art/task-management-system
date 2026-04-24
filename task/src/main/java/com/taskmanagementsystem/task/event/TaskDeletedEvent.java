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
public class TaskDeletedEvent {
    private Task deletedTask;
    private UserContext userContext;
}
