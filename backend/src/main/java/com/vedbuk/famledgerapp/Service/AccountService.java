package com.vedbuk.famledgerapp.Service;

import com.vedbuk.famledgerapp.Entity.Account;
import com.vedbuk.famledgerapp.Entity.User;
import com.vedbuk.famledgerapp.Repository.AccountRepository;
import com.vedbuk.famledgerapp.Repository.UserRepository;
import com.vedbuk.famledgerapp.dto.AccountResponse;
import com.vedbuk.famledgerapp.dto.CreateAccountRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AccountService {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;

    public AccountService(AccountRepository accountRepository, UserRepository userRepository) {
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<AccountResponse> getUserAccounts(Long userId) {
        List<Account> accounts = accountRepository.findByOwnerId(userId);
        return accounts.stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    @Transactional
    public AccountResponse createAccount(Long userId, CreateAccountRequest request) {
        User owner = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        Account account = new Account();
        account.setOwner(owner);
        account.setName(request.getName());
        account.setType(request.getType() != null ? request.getType().toUpperCase() : "BANK");
        account.setCurrency(request.getCurrency() != null ? request.getCurrency().toUpperCase() : "INR");
        account.setCurrentBalance(request.getInitialBalance() != null ? request.getInitialBalance() : BigDecimal.ZERO);

        Account savedAccount = accountRepository.save(account);
        return mapToResponse(savedAccount);
    }

    private AccountResponse mapToResponse(Account account) {
        AccountResponse resp = new AccountResponse();
        resp.setId(account.getId());
        resp.setOwnerId(account.getOwner() != null ? account.getOwner().getId() : null);
        resp.setOwnerName(account.getOwner() != null ? account.getOwner().getFullName() : null);
        resp.setHouseholdId(account.getHousehold() != null ? account.getHousehold().getId() : null);
        resp.setName(account.getName());
        resp.setType(account.getType());
        resp.setCurrency(account.getCurrency());
        resp.setCurrentBalance(account.getCurrentBalance());
        resp.setCreatedAt(account.getCreatedAt());
        return resp;
    }
}