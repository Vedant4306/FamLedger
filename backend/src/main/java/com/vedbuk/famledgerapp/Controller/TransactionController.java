package com.vedbuk.famledgerapp.Controller;

import com.vedbuk.famledgerapp.Service.ExportService;
import com.vedbuk.famledgerapp.dto.TransactionRequest;
import com.vedbuk.famledgerapp.dto.TransactionResponse;
import com.vedbuk.famledgerapp.Security.JwtUtil;
import com.vedbuk.famledgerapp.Service.TransactionService;
import org.springframework.core.io.InputStreamResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/transactions")
public class TransactionController {

    private final TransactionService transactionService;
    private final ExportService exportService;
    private final JwtUtil jwtUtil;

    public TransactionController(TransactionService transactionService,ExportService exportService, JwtUtil jwtUtil) {
        this.transactionService = transactionService;
        this.exportService=exportService;
        this.jwtUtil = jwtUtil;
    }

    // 1. Create a personal or household-tagged transaction
    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody TransactionRequest request) {

        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtUtil.extractUserId(token);

        return ResponseEntity.ok(transactionService.createTransaction(userId, request));
    }

    // 2. Fetch all transactions belonging to the logged-in user
    @GetMapping
    public ResponseEntity<List<TransactionResponse>> getUserTransactions(
            @RequestHeader("Authorization") String authHeader) {

        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtUtil.extractUserId(token);

        return ResponseEntity.ok(transactionService.getUserTransactions(userId));
    }

    // 3. Fetch shared household transactions (Includes child entries automatically if caller is PARENT)
    @GetMapping("/household/{householdId}")
    public ResponseEntity<List<TransactionResponse>> getHouseholdTransactions(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable("householdId") Long householdId) {

        String token = authHeader.replace("Bearer ", "");
        Long userId = jwtUtil.extractUserId(token);

        return ResponseEntity.ok(transactionService.getHouseholdTransactions(userId, householdId));
    }

    @GetMapping("/household/{householdId}/member/{memberUserId}")
    public ResponseEntity<List<TransactionResponse>> getMemberTransactions(
            @RequestHeader("Authorization") String authHeader,
            @PathVariable("householdId") Long householdId,
            @PathVariable("memberUserId") Long memberUserId) {

        String token = authHeader.replace("Bearer ", "");
        Long currentUserId = jwtUtil.extractUserId(token);

        return ResponseEntity.ok(
                transactionService.getTransactionsByHouseholdAndMember(householdId, memberUserId, currentUserId)
        );
    }

    @PutMapping("/{id}")
    public ResponseEntity<TransactionResponse> updateTransaction(
            @PathVariable Long id,
            @RequestBody TransactionRequest request,
            @RequestHeader("Authorization") String tokenHeader) {

        String token = tokenHeader.replace("Bearer ", "");
        String userEmail = jwtUtil.extractEmail(token);
        return ResponseEntity.ok(transactionService.updateTransaction(id, request, userEmail));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(
            @PathVariable Long id,
            @RequestHeader("Authorization") String tokenHeader) {

        String token = tokenHeader.replace("Bearer ", "");
        String userEmail = jwtUtil.extractEmail(token);
        transactionService.deleteTransaction(id, userEmail);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/export/excel")
    public ResponseEntity<InputStreamResource> downloadExcelStatement(
            @RequestHeader("Authorization") String tokenHeader) throws IOException {

        String token = tokenHeader.replace("Bearer ", "");
        Long userId = jwtUtil.extractUserId(token);

        ByteArrayInputStream in = exportService.exportTransactionsToExcel(userId);

        HttpHeaders headers = new HttpHeaders();
        headers.add("Content-Disposition", "attachment; filename=FamLedger_Statement.xlsx");

        return ResponseEntity.ok()
                .headers(headers)
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
                .body(new InputStreamResource(in));
    }
}