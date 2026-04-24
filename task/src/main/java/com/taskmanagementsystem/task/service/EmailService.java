package com.taskmanagementsystem.task.service;

import lombok.RequiredArgsConstructor;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;
    private static final String SENDER = "gokulkarunaharan41@gmail.com";
    private static final String SUPER_ADMIN_EMAIL="flareoplane@gmail.com";

    public void sendMail(String subject, String text) {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(SUPER_ADMIN_EMAIL);
        message.setSubject(subject);
        message.setText(text);
        message.setFrom(SENDER);
        mailSender.send(message);
    }
}
