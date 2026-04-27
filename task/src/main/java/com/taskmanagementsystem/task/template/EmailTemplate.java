package com.taskmanagementsystem.task.template;

public class EmailTemplate {
    public static final String TASK_CREATED_SUBJECT = "Task Created: %s";
    public static final String TASK_CREATED_BODY = """
            A new task has been created.
            
            Task Name  : %s
            Created By : %s (%s)
            
            Please review the task board for more details.
            """;

    public static final String TASK_UPDATED_SUBJECT = "Task Updated: %s";
    public static final String TASK_UPDATED_BODY = """
            A task has been updated.
            
            Old task -->
            
            Task Name  : %s
            Task Description : %s
            Task Status : %s
            
            New task -->
            
            Task Name  : %s
            Task Description : %s
            Task Status : %s
            
            Updated By : %s (%s)
            
            Please review the task board for more details.
            """;

    public static final String TASK_DELETED_SUBJECT = "Task Deleted: %s";
    public static final String TASK_DELETED_BODY = """
            A task has been deleted.
            
            Old task -->
            
            Task Name  : %s
            Deleted By : %s (%s)
            
            Please review the task board for more details.
            """;

    private EmailTemplate() {}
}
