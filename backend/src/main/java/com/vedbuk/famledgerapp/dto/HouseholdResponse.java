package com.vedbuk.famledgerapp.dto;

import java.time.OffsetDateTime;
import java.util.List;

public class HouseholdResponse {
    private Long id;
    private String name;
    private String inviteCode;
    private Long createdById;
    private String createdByName;
    private OffsetDateTime createdAt;
    private List<MemberInfo> members;

    // Default Constructor
    public HouseholdResponse() {}

    // Full Constructor
    public HouseholdResponse(Long id, String name, String inviteCode, Long createdById, String createdByName, OffsetDateTime createdAt, List<MemberInfo> members) {
        this.id = id;
        this.name = name;
        this.inviteCode = inviteCode;
        this.createdById = createdById;
        this.createdByName = createdByName;
        this.createdAt = createdAt;
        this.members = members;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getInviteCode() { return inviteCode; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }

    public Long getCreatedById() { return createdById; }
    public void setCreatedById(Long createdById) { this.createdById = createdById; }

    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }

    public List<MemberInfo> getMembers() { return members; }
    public void setMembers(List<MemberInfo> members) { this.members = members; }

    // Static Inner Class for Family Members
    public static class MemberInfo {
        private Long userId;
        private String fullName;
        private String email;
        private String role;

        public MemberInfo() {}

        public MemberInfo(Long userId, String fullName, String email, String role) {
            this.userId = userId;
            this.fullName = fullName;
            this.email = email;
            this.role = role;
        }

        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }

        public String getFullName() { return fullName; }
        public void setFullName(String fullName) { this.fullName = fullName; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }
}