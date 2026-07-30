package com.vedbuk.famledgerapp.Service;

import com.vedbuk.famledgerapp.dto.AddMemberRequest;
import com.vedbuk.famledgerapp.dto.CreateHouseholdRequest;
import com.vedbuk.famledgerapp.dto.HouseholdResponse;
import com.vedbuk.famledgerapp.Entity.Household;
import com.vedbuk.famledgerapp.Entity.HouseholdMembership;
import com.vedbuk.famledgerapp.Entity.User;
import com.vedbuk.famledgerapp.Repository.HouseholdMembershipRepository;
import com.vedbuk.famledgerapp.Repository.HouseholdRepository;
import com.vedbuk.famledgerapp.Repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class HouseholdService {

    private final HouseholdRepository householdRepository;
    private final HouseholdMembershipRepository membershipRepository;
    private final UserRepository userRepository;

    public HouseholdService(HouseholdRepository householdRepository,
                            HouseholdMembershipRepository membershipRepository,
                            UserRepository userRepository) {
        this.householdRepository = householdRepository;
        this.membershipRepository = membershipRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public HouseholdResponse createHousehold(Long userId, CreateHouseholdRequest request) {
        User creator = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        // 1. Create and save Household
        Household household = new Household();
        household.setName(request.getName());
        household.setCreatedBy(creator);
        household.setCreatedAt(OffsetDateTime.now());

        // Generate 6-character unique uppercase invite code
        String generatedCode = UUID.randomUUID().toString().substring(0, 6).toUpperCase();
        household.setInviteCode(generatedCode);

        Household savedHousehold = householdRepository.save(household);

        // 2. Automatically make the creator a PARENT member
        HouseholdMembership membership = new HouseholdMembership();
        membership.setHousehold(savedHousehold);
        membership.setUser(creator);
        membership.setRole("PARENT");
        membership.setJoinedAt(OffsetDateTime.now());
        membershipRepository.save(membership);

        return mapToHouseholdResponse(savedHousehold);
    }

    // 💡 JOIN HOUSEHOLD VIA INVITE CODE (Used by mobile app Join Group feature)
    @Transactional
    public HouseholdResponse joinHouseholdByCode(Long userId, String inviteCode, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found!"));

        Household household = householdRepository.findByInviteCode(inviteCode.toUpperCase())
                .orElseThrow(() -> new RuntimeException("Invalid invite code! No household found."));

        // Check if user is already in this household
        List<HouseholdMembership> existingMemberships = membershipRepository.findByHouseholdId(household.getId());
        boolean isAlreadyMember = existingMemberships.stream()
                .anyMatch(m -> m.getUser().getId().equals(userId));

        if (isAlreadyMember) {
            throw new RuntimeException("You are already a member of this household!");
        }

        // Save new membership
        HouseholdMembership membership = new HouseholdMembership();
        membership.setHousehold(household);
        membership.setUser(user);
        membership.setRole(role != null ? role.toUpperCase() : "CHILD");
        membership.setJoinedAt(OffsetDateTime.now());
        membershipRepository.save(membership);

        return mapToHouseholdResponse(household);
    }

    @Transactional
    public HouseholdResponse addMember(Long currentUserId, Long householdId, AddMemberRequest request) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new RuntimeException("Household not found!"));

        // Verify that the person trying to add a member is a PARENT in this household
        List<HouseholdMembership> currentMemberships = membershipRepository.findByHouseholdId(householdId);
        boolean isParent = currentMemberships.stream()
                .anyMatch(m -> m.getUser().getId().equals(currentUserId) && "PARENT".equalsIgnoreCase(m.getRole()));

        if (!isParent) {
            throw new RuntimeException("Only PARENT members can add new members to this household!");
        }

        // Find target user by email
        User userToAdd = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("User with email " + request.getEmail() + " not found!"));

        // Check if user is already in the household
        boolean alreadyMember = currentMemberships.stream()
                .anyMatch(m -> m.getUser().getId().equals(userToAdd.getId()));

        if (alreadyMember) {
            throw new RuntimeException("User is already a member of this household!");
        }

        // Add member
        HouseholdMembership newMembership = new HouseholdMembership();
        newMembership.setHousehold(household);
        newMembership.setUser(userToAdd);
        newMembership.setRole(request.getRole().toUpperCase());
        newMembership.setJoinedAt(OffsetDateTime.now());
        membershipRepository.save(newMembership);

        return mapToHouseholdResponse(household);
    }

    @Transactional(readOnly = true)
    public List<HouseholdResponse> getUserHouseholds(Long userId) {
        List<HouseholdMembership> userMemberships = membershipRepository.findByUserId(userId);

        return userMemberships.stream()
                .map(m -> mapToHouseholdResponse(m.getHousehold()))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public HouseholdResponse getHouseholdById(Long householdId) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new RuntimeException("Household not found!"));

        return mapToHouseholdResponse(household);
    }

    @Transactional(readOnly = true)
    public HouseholdResponse getMyHousehold(Long userId) {
        List<HouseholdMembership> memberships = membershipRepository.findByUserId(userId);
        if (memberships.isEmpty()) {
            return null;
        }

        Household household = memberships.get(0).getHousehold();
        return mapToHouseholdResponse(household);
    }

    // 💡 Helper method to centralize DTO mapping (ensures inviteCode & member list are always included)
    private HouseholdResponse mapToHouseholdResponse(Household household) {
        List<HouseholdMembership> memberships = membershipRepository.findByHouseholdId(household.getId());

        List<HouseholdResponse.MemberInfo> memberList = memberships.stream()
                .map(m -> new HouseholdResponse.MemberInfo(
                        m.getUser().getId(),
                        m.getUser().getFullName(),
                        m.getUser().getEmail(),
                        m.getRole()
                ))
                .collect(Collectors.toList());

        return new HouseholdResponse(
                household.getId(),
                household.getName(),
                household.getInviteCode(), // 👈 Ensures invite code is ALWAYS present
                household.getCreatedBy() != null ? household.getCreatedBy().getId() : null,
                household.getCreatedBy() != null ? household.getCreatedBy().getFullName() : null,
                household.getCreatedAt(),
                memberList
        );
    }
}