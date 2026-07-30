package com.vedbuk.famledgerapp.Repository;

import com.vedbuk.famledgerapp.Entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByAccountId(Long accountId);
    List<Transaction> findByHouseholdId(Long householdId);
    List<Transaction> findByHouseholdIdAndUserId(Long householdId, Long userId);
    List<Transaction> findByUserId(Long userId);
    List<Transaction> findByAccountOwnerId(Long userId);
}