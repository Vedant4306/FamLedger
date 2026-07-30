package com.vedbuk.famledgerapp.Repository;

import com.vedbuk.famledgerapp.Entity.HouseholdMembership;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HouseholdMembershipRepository extends JpaRepository<HouseholdMembership, Long> {
    List<HouseholdMembership> findByUserId(Long userId);
    List<HouseholdMembership> findByHouseholdId(Long householdId);
}