package com.taskmanagementsystem.task.event.listener;

import com.taskmanagementsystem.task.event.TaskCreatedEvent;
import com.taskmanagementsystem.task.event.TaskDeletedEvent;
import com.taskmanagementsystem.task.event.TaskUpdatedEvent;
import com.taskmanagementsystem.task.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import static com.taskmanagementsystem.task.template.EmailTemplate.*;


@RequiredArgsConstructor
@Component
public class EmailSendingListener {

    private final EmailService emailService;

    @EventListener
    @Async
    public void handleTaskCreatedEvent(TaskCreatedEvent event) {
        emailService.sendMail(
                TASK_CREATED_SUBJECT.formatted(event.getCreatedTask().getTaskName()),
                TASK_CREATED_BODY.formatted(
                        event.getCreatedTask().getTaskName(),
                        event.getUserContext().getUsername(),
                        event.getUserContext().getRole()
                ));
    }

    @EventListener
    @Async
    public void handleTaskDeletedEvent(TaskDeletedEvent event) {
        emailService.sendMail(
                TASK_DELETED_SUBJECT.formatted(event.getDeletedTask().getTaskName()),
                TASK_DELETED_BODY.formatted(
                        event.getDeletedTask().getTaskName(),
                        event.getUserContext().getUsername(),
                        event.getUserContext().getRole()
                ));
    }

    @EventListener
    @Async
    public void handleTaskUpdatedEvent(TaskUpdatedEvent event) {
        emailService.sendMail(TASK_UPDATED_SUBJECT.formatted(event.getOldTask().getTaskName()),
                TASK_UPDATED_BODY.formatted(
                        event.getOldTask().getTaskName(),
                        event.getOldTask().getTaskDescription(),
                        event.getOldTask().getStatus(),

                        event.getNewTask().getTaskName(),
                        event.getNewTask().getTaskDescription(),
                        event.getNewTask().getStatus(),

                        event.getUserContext().getUsername(),
                        event.getUserContext().getRole()
                ));
    }
}
