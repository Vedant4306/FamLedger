package com.vedbuk.famledgerapp.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void sendOtpEmail(String toEmail, String otp) {
        SimpleMailMessage message = new SimpleMailMessage();

        // Resend allows 'onboarding@resend.dev' for testing before adding a custom domain
        message.setFrom("onboarding@resend.dev");
        message.setTo(toEmail);
        message.setSubject("FamLedger - Password Reset OTP");
        message.setText("Hello,\n\nYour OTP for resetting your FamLedger password is: "
                + otp + "\n\nThis code is valid for 10 minutes.\nIf you did not request this, please ignore this email.");

        mailSender.send(message);
    }
}