package com.vedbuk.famledgerapp.Controller;

import com.vedbuk.famledgerapp.Entity.User;
import com.vedbuk.famledgerapp.dto.AddMemberRequest;
import com.vedbuk.famledgerapp.dto.CreateHouseholdRequest;
import com.vedbuk.famledgerapp.dto.HouseholdResponse;
import com.vedbuk.famledgerapp.dto.JoinHouseholdRequest;
import com.vedbuk.famledgerapp.Security.JwtUtil;
import com.vedbuk.famledgerapp.Service.HouseholdService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/households")
public class HouseholdController {

    private final HouseholdService householdService;
    private final JwtUtil jwtUtil;

    public HouseholdController(HouseholdService householdService, JwtUtil jwtUtil) {
        this.householdService = householdService;
        this.jwtUtil = jwtUtil;
    }

    // 1. Create a new Household
    @PostMapping
    public ResponseEntity<HouseholdResponse> createHousehold(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CreateHouseholdRequest request) {

        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtUtil.extractUserId(token);

        return ResponseEntity.ok(householdService.createHousehold(userId, request));
    }

    // 2. 💡 JOIN HOUSEHOLD VIA INVITE CODE (Added for Mobile App)
    @PostMapping("/join")
    public ResponseEntity<HouseholdResponse> joinHousehold(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody JoinHouseholdRequest request) {

        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtUtil.extractUserId(token);

        return ResponseEntity.ok(householdService.joinHouseholdByCode(userId, request.getInviteCode(), request.getRole()));
    }

    // 3. Add Member by Email (For Parent management)
    @PostMapping("/{id}/members")
    public ResponseEntity<HouseholdResponse> addMember(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable("id") Long householdId,
            @RequestBody AddMemberRequest request) {

        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtUtil.extractUserId(token);

        return ResponseEntity.ok(householdService.addMember(userId, householdId, request));
    }

    // 4. Get User's Active Household
    @GetMapping("/my-household")
    public ResponseEntity<HouseholdResponse> getMyHousehold(
            @RequestHeader("Authorization") String authHeader) {

        // Extract userId cleanly from the JWT Token
        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtUtil.extractUserId(token);

        HouseholdResponse householdResponse = householdService.getMyHousehold(userId);

        if (householdResponse == null) {
            // Returns 200 OK with empty body if user has not created/joined a household yet
            return ResponseEntity.ok().build();
        }

        return ResponseEntity.ok(householdResponse);
    }

    // 5. Get All Households User Belongs To
    @GetMapping
    public ResponseEntity<List<HouseholdResponse>> getUserHouseholds(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtUtil.extractUserId(token);

        return ResponseEntity.ok(householdService.getUserHouseholds(userId));
    }
}