package com.vedbuk.famledgerapp.Repository;

import com.vedbuk.famledgerapp.Entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByOwnerId(Long ownerId);
    List<Account> findByHouseholdId(Long householdId);
}