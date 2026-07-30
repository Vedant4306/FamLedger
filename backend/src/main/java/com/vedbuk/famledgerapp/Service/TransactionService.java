package com.vedbuk.famledgerapp.Service;

import com.vedbuk.famledgerapp.dto.TransactionRequest;
import com.vedbuk.famledgerapp.dto.TransactionResponse;
import com.vedbuk.famledgerapp.Entity.Account;
import com.vedbuk.famledgerapp.Entity.Household;
import com.vedbuk.famledgerapp.Entity.HouseholdMembership;
import com.vedbuk.famledgerapp.Entity.Transaction;
import com.vedbuk.famledgerapp.Entity.User;
import com.vedbuk.famledgerapp.Repository.AccountRepository;
import com.vedbuk.famledgerapp.Repository.HouseholdMembershipRepository;
import com.vedbuk.famledgerapp.Repository.HouseholdRepository;
import com.vedbuk.famledgerapp.Repository.TransactionRepository;
import com.vedbuk.famledgerapp.Repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final HouseholdRepository householdRepository;
    private final HouseholdMembershipRepository membershipRepository;

    public TransactionService(TransactionRepository transactionRepository,
                              AccountRepository accountRepository,
                              UserRepository userRepository,
                              HouseholdRepository householdRepository,
                              HouseholdMembershipRepository membershipRepository) {
        this.transactionRepository = transactionRepository;
        this.accountRepository = accountRepository;
        this.userRepository = userRepository;
        this.householdRepository = householdRepository;
        this.membershipRepository = membershipRepository;
    }

    @Transactional
    public TransactionResponse createTransaction(Long userId, TransactionRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        Account account;
        if (request.getAccountId() != null) {
            account = accountRepository.findById(request.getAccountId())
                    .orElseThrow(() -> new RuntimeException("Account not found!"));

            // Check ownership
            if (!account.getOwner().getId().equals(userId)) {
                throw new RuntimeException("Unauthorized account access!");
            }
        } else {
            // AUTOMATIC FALLBACK: Fetch the user's default "Main Account"
            List<Account> userAccounts = accountRepository.findByOwnerId(userId);
            if (userAccounts.isEmpty()) {
                throw new RuntimeException("No accounts found for user. Please register again.");
            }
            account = userAccounts.get(0); // Uses the primary default account
        }
        // Handle Optional Household Tagging
        Household household = null;
        if (request.getHouseholdId() != null) {
            household = householdRepository.findById(request.getHouseholdId())
                    .orElseThrow(() -> new RuntimeException("Household not found!"));

            // Verify that the user actually belongs to this household
            List<HouseholdMembership> userMemberships = membershipRepository.findByUserId(userId);
            Long targetHouseholdId = request.getHouseholdId();
            boolean isMember = userMemberships.stream()
                    .anyMatch(m -> m.getHousehold().getId().equals(targetHouseholdId));

            if (!isMember) {
                throw new RuntimeException("You are not a member of this household!");
            }
        }

        Account transferAccount = null;

        // Perform balance updates based on transaction type
        if ("EXPENSE".equalsIgnoreCase(request.getType())) {
            account.setCurrentBalance(account.getCurrentBalance().subtract(request.getAmount()));
        } else if ("INCOME".equalsIgnoreCase(request.getType())) {
            account.setCurrentBalance(account.getCurrentBalance().add(request.getAmount()));
        } else if ("TRANSFER".equalsIgnoreCase(request.getType())) {
            if (request.getTransferAccountId() == null) {
                throw new RuntimeException("Destination account required for transfer!");
            }
            transferAccount = accountRepository.findById(request.getTransferAccountId())
                    .orElseThrow(() -> new RuntimeException("Transfer destination account not found!"));

            account.setCurrentBalance(account.getCurrentBalance().subtract(request.getAmount()));
            transferAccount.setCurrentBalance(transferAccount.getCurrentBalance().add(request.getAmount()));
            accountRepository.save(transferAccount);
        } else {
            throw new RuntimeException("Invalid transaction type! Allowed: EXPENSE, INCOME, TRANSFER");
        }

        accountRepository.save(account);

        // Save Transaction
        Transaction tx = new Transaction();
        tx.setUser(user);
        tx.setAccount(account);
        tx.setTransferAccount(transferAccount);
        tx.setHousehold(household);
        tx.setAmount(request.getAmount());
        tx.setType(request.getType().toUpperCase());
        tx.setCategory(request.getCategory());
        tx.setDescription(request.getDescription());
        tx.setTransactionDate(request.getTransactionDate() != null ? request.getTransactionDate() : OffsetDateTime.now());

        Transaction savedTx = transactionRepository.save(tx);

        return mapToResponse(savedTx);
    }

    public List<TransactionResponse> getUserTransactions(Long userId) {
        // Fetch all user accounts
        List<Account> userAccounts = accountRepository.findByOwnerId(userId);
        List<Long> accountIds = userAccounts.stream().map(Account::getId).collect(Collectors.toList());

        return transactionRepository.findAll().stream()
                .filter(tx -> accountIds.contains(tx.getAccount().getId()))
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<TransactionResponse> getHouseholdTransactions(Long currentUserId, Long householdId) {
        // 1. Verify caller belongs to the requested household and identify their role
        HouseholdMembership currentMember = membershipRepository.findByHouseholdId(householdId).stream()
                .filter(m -> m.getUser().getId().equals(currentUserId))
                .findFirst()
                .orElseThrow(() -> new RuntimeException("You are not a member of this household!"));

        boolean isParent = "PARENT".equalsIgnoreCase(currentMember.getRole());

        // 2. Fetch all members in this household
        List<HouseholdMembership> allMemberships = membershipRepository.findByHouseholdId(householdId);

        // 3. Find user IDs of all CHILD members in this household
        List<Long> childUserIds = allMemberships.stream()
                .filter(m -> "CHILD".equalsIgnoreCase(m.getRole()))
                .map(m -> m.getUser().getId())
                .collect(Collectors.toList());

        // 4. Find all account IDs owned by those CHILD members
        List<Long> childAccountIds = accountRepository.findAll().stream()
                .filter(acc -> childUserIds.contains(acc.getOwner().getId()))
                .map(Account::getId)
                .collect(Collectors.toList());

        // 5. Filter transactions:
        // - Always include transactions explicitly tagged with this householdId
        // - If caller is a PARENT, also include any transaction linked to a child's account
        return transactionRepository.findAll().stream()
                .filter(tx -> {
                    boolean isHouseholdTagged = tx.getHousehold() != null && tx.getHousehold().getId().equals(householdId);
                    boolean isChildTransaction = isParent && childAccountIds.contains(tx.getAccount().getId());

                    return isHouseholdTagged || isChildTransaction;
                })
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    private TransactionResponse mapToResponse(Transaction tx) {
        TransactionResponse resp = new TransactionResponse();

        resp.setId(tx.getId());

        // Account Mapping (with null safety)
        if (tx.getAccount() != null) {
            resp.setAccountId(tx.getAccount().getId());
            resp.setAccountName(tx.getAccount().getName());
        }

        // Transfer Account Mapping
        if (tx.getTransferAccount() != null) {
            resp.setTransferAccountId(tx.getTransferAccount().getId());
            resp.setTransferAccountName(tx.getTransferAccount().getName());
        }

        // Household Mapping
        if (tx.getHousehold() != null) {
            resp.setHouseholdId(tx.getHousehold().getId());
            resp.setHouseholdName(tx.getHousehold().getName());
        }

        // 💡 User Mapping (Links transaction to specific child/parent)
        if (tx.getUser() != null) {
            resp.setUserId(tx.getUser().getId());
            resp.setUserName(tx.getUser().getFullName());
        }

        resp.setAmount(tx.getAmount());
        resp.setType(tx.getType());
        resp.setCategory(tx.getCategory());
        resp.setDescription(tx.getDescription());
        resp.setTransactionDate(tx.getTransactionDate());
        resp.setCreatedAt(tx.getCreatedAt());

        return resp;
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getTransactionsByHouseholdAndMember(Long householdId, Long targetUserId, Long currentUserId) {
        // 1. Verify caller is a PARENT or requesting their own data
        List<HouseholdMembership> memberships = membershipRepository.findByHouseholdId(householdId);

        boolean isCallerParent = memberships.stream()
                .anyMatch(m -> m.getUser().getId().equals(currentUserId) && "PARENT".equalsIgnoreCase(m.getRole()));

        if (!isCallerParent && !targetUserId.equals(currentUserId)) {
            throw new RuntimeException("Access Denied: Only PARENTs can view other family members' transactions.");
        }

        // 2. Fetch target user's transactions tagged to this household
        List<Transaction> transactions = transactionRepository.findByHouseholdIdAndUserId(householdId, targetUserId);

        return transactions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public TransactionResponse updateTransaction(Long transactionId, TransactionRequest request, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        // Check ownership / authorization
        if (!tx.getAccount().getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to modify this transaction");
        }

        Account account = tx.getAccount();

        // 1. REVERSE old transaction impact on account balance
        if ("EXPENSE".equalsIgnoreCase(tx.getType())) {
            account.setCurrentBalance(account.getCurrentBalance().add(tx.getAmount()));
        } else if ("INCOME".equalsIgnoreCase(tx.getType())) {
            account.setCurrentBalance(account.getCurrentBalance().subtract(tx.getAmount()));
        }

        // 2. APPLY new values
        tx.setAmount(request.getAmount());
        tx.setType(request.getType());
        tx.setCategory(request.getCategory());
        tx.setDescription(request.getDescription());

        if (request.getTransactionDate() != null) {
            tx.setTransactionDate(request.getTransactionDate());
        }

        // 3. APPLY new transaction impact on account balance
        if ("EXPENSE".equalsIgnoreCase(request.getType())) {
            account.setCurrentBalance(account.getCurrentBalance().subtract(request.getAmount()));
        } else if ("INCOME".equalsIgnoreCase(request.getType())) {
            account.setCurrentBalance(account.getCurrentBalance().add(request.getAmount()));
        }

        accountRepository.save(account);
        Transaction updatedTx = transactionRepository.save(tx);
        return mapToResponse(updatedTx);
    }

    @Transactional
    public void deleteTransaction(Long transactionId, String userEmail) {
        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Transaction tx = transactionRepository.findById(transactionId)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        if (!tx.getAccount().getOwner().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized to delete this transaction");
        }

        Account account = tx.getAccount();

        // Revert transaction impact on account balance before deleting
        if ("EXPENSE".equalsIgnoreCase(tx.getType())) {
            account.setCurrentBalance(account.getCurrentBalance().add(tx.getAmount()));
        } else if ("INCOME".equalsIgnoreCase(tx.getType())) {
            account.setCurrentBalance(account.getCurrentBalance().subtract(tx.getAmount()));
        }

        accountRepository.save(account);
        transactionRepository.delete(tx);
    }
}