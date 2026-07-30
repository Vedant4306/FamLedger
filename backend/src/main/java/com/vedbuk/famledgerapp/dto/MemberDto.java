package com.vedbuk.famledgerapp.dto;

public class MemberDto {
    private Long userId;
    private String fullName;
    private String email;
    private String role; // "PARENT" or "CHILD"

    public MemberDto() {}

    public MemberDto(Long userId, String fullName, String email, String role) {
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