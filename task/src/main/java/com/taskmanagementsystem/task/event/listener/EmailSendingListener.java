package com.taskmanagementsystem.task.event.listener;

import com.taskmanagementsystem.task.event.TaskCreatedEvent;
import com.taskmanagementsystem.task.event.TaskDeletedEvent;
import com.taskmanagementsystem.task.event.TaskUpdatedEvent;
import com.taskmanagementsystem.task.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;


@RequiredArgsConstructor
@Component
public class EmailSendingListener {

    private final EmailService emailService;

    @EventListener
    @Async
    public void handleTaskCreatedEvent(TaskCreatedEvent taskCreatedEvent) {
        String subject = "Task Created By "+taskCreatedEvent.getUserContext().getUsername();
        String body = "Task \""+taskCreatedEvent.getCreatedTask().getTaskName()+"\" has been created by "+taskCreatedEvent.getUserContext().getUsername()+"("+taskCreatedEvent.getUserContext().getRole()+")";
        emailService.sendMail(subject,body);
    }

    @EventListener
    @Async
    public void handleTaskDeletedEvent(TaskDeletedEvent taskDeletedEvent) {
        String subject = "Task Deleted By "+taskDeletedEvent.getUserContext().getUsername();
        String body = "Task \""+taskDeletedEvent.getDeletedTask().getTaskName()+"\" has been deleted by "+taskDeletedEvent.getUserContext().getUsername()+"("+taskDeletedEvent.getUserContext().getRole()+")";
        emailService.sendMail(subject,body);
    }

    @EventListener
    @Async
    public void handleTaskUpdatedEvent(TaskUpdatedEvent taskUpdatedEvent) {
        String subject = "Task Updated By "+taskUpdatedEvent.getUserContext().getUsername();
        String body = "Task \""+taskUpdatedEvent.getOldTask().getTaskName()+"\" has been updated by "+taskUpdatedEvent.getUserContext().getUsername()+"("+taskUpdatedEvent.getUserContext().getRole()+")";
        emailService.sendMail(subject,body);
    }
}
