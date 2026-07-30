package com.vedbuk.famledgerapp.Controller;

import com.vedbuk.famledgerapp.Security.JwtUtil;
import com.vedbuk.famledgerapp.Service.AnalyticsService;
import com.vedbuk.famledgerapp.dto.AnalyticsSummaryResponse;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;
    private final JwtUtil jwtUtil;

    public AnalyticsController(AnalyticsService analyticsService, JwtUtil jwtUtil) {
        this.analyticsService = analyticsService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping("/summary")
    public ResponseEntity<AnalyticsSummaryResponse> getAnalytics(
            @RequestHeader("Authorization") String authHeader,
            @RequestParam(value = "scope", defaultValue = "PERSONAL") String scope, // "PERSONAL" or "HOUSEHOLD"
            @RequestParam(value = "period", defaultValue = "MONTHLY") String period, // "DAILY", "WEEKLY", "MONTHLY", "YEARLY", "ALL", "CUSTOM"
            @RequestParam(value = "startDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(value = "endDate", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {

        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtUtil.extractUserId(token);

        return ResponseEntity.ok(analyticsService.getAnalytics(userId, scope, period, startDate, endDate));
    }
}