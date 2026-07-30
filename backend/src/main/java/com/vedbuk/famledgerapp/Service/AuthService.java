package com.vedbuk.famledgerapp.Service;

import com.vedbuk.famledgerapp.dto.AuthResponse;
import com.vedbuk.famledgerapp.dto.LoginRequest;
import com.vedbuk.famledgerapp.dto.RegisterRequest;
import com.vedbuk.famledgerapp.Entity.User;
import com.vedbuk.famledgerapp.Entity.Account;
import com.vedbuk.famledgerapp.Repository.UserRepository;
import com.vedbuk.famledgerapp.Repository.AccountRepository;
import com.vedbuk.famledgerapp.Security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Random;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    public AuthService(UserRepository userRepository, AccountRepository accountRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil, EmailService emailService) {
        this.userRepository = userRepository;
        this.accountRepository = accountRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
        this.emailService = emailService;
    }

    @Transactional
    // Register a new user
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email is already registered!");
        }

        // Create new user entity with encoded password
        User user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());

        User savedUser = userRepository.save(user);

        Account defaultAccount = new Account();
        defaultAccount.setOwner(savedUser);
        defaultAccount.setName("Main Account");
        defaultAccount.setType("CASH");
        defaultAccount.setCurrency("USD");
        defaultAccount.setCurrentBalance(BigDecimal.ZERO);

        accountRepository.save(defaultAccount);
        // Generate JWT token
        String token = jwtUtil.generateToken(savedUser.getEmail(), savedUser.getId());

        return new AuthResponse(token, savedUser.getEmail(), savedUser.getFullName(), savedUser.getId());
    }

    // Authenticate and log in user
    public AuthResponse login(LoginRequest request) {
        // Find user by email
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("Invalid email or password!"));

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new RuntimeException("Invalid email or password!");
        }

        // Generate JWT token
        String token = jwtUtil.generateToken(user.getEmail(), user.getId());

        return new AuthResponse(token, user.getEmail(), user.getFullName(), user.getId());
    }

    @Transactional
    // Process forgot password - Generate OTP, save it, and send email
    public void processForgotPassword(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("No account found with this email address."));

        // Generate a random 6-digit OTP code
        String otp = String.format("%06d", new Random().nextInt(999999));

        // Set OTP and 10-minute expiration
        user.setResetOtp(otp);
        user.setResetOtpExpiry(LocalDateTime.now().plusMinutes(10));
        userRepository.save(user);

        // Send OTP via EmailService
        emailService.sendOtpEmail(user.getEmail(), otp);
    }

    @Transactional
    // Reset password using the verified OTP
    public void resetPassword(String email, String otp, String newPassword) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found."));

        if (user.getResetOtp() == null || !user.getResetOtp().equals(otp)) {
            throw new RuntimeException("Invalid OTP code. Please check and try again.");
        }

        if (user.getResetOtpExpiry() == null || user.getResetOtpExpiry().isBefore(LocalDateTime.now())) {
            throw new RuntimeException("OTP has expired. Please request a new one.");
        }

        // Update password hash and clear OTP fields
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setResetOtp(null);
        user.setResetOtpExpiry(null);
        userRepository.save(user);
    }
}