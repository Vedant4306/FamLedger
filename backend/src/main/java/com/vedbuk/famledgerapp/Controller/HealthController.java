package com.vedbuk.famledgerapp.Controller;

import com.vedbuk.famledgerapp.Repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {


    private final UserRepository userRepository;

    public HealthController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> checkHealth() {
        Map<String, Object> response = new HashMap<>();

        // Count users in Supabase to verify DB read connection
        long userCount = userRepository.count();

        response.put("status", "UP");
        response.put("database", "CONNECTED");
        response.put("totalUsersInDb", userCount);

        return ResponseEntity.ok(response);
    }
}
