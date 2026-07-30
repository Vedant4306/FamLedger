package com.vedbuk.famledgerapp.Controller;

import com.vedbuk.famledgerapp.Entity.User;
import com.vedbuk.famledgerapp.Security.JwtUtil;
import com.vedbuk.famledgerapp.Service.AccountService;
import com.vedbuk.famledgerapp.dto.AccountResponse;
import com.vedbuk.famledgerapp.dto.CreateAccountRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    private final AccountService accountService;
    private final JwtUtil jwtUtil;

    public AccountController(AccountService accountService, JwtUtil jwtUtil) {
        this.accountService = accountService;
        this.jwtUtil = jwtUtil;
    }

    @GetMapping
    public ResponseEntity<List<AccountResponse>> getMyAccounts(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtUtil.extractUserId(token);
        return ResponseEntity.ok(accountService.getUserAccounts(userId));
    }

    @PostMapping
    public ResponseEntity<AccountResponse> createAccount(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody CreateAccountRequest request) {

        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtUtil.extractUserId(token);
        return ResponseEntity.ok(accountService.createAccount(userId, request));
    }
}