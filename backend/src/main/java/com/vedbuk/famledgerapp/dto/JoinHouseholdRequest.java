package com.vedbuk.famledgerapp.dto;

public class JoinHouseholdRequest {
    private String inviteCode;
    private String role; // "PARENT" or "CHILD"

    public JoinHouseholdRequest() {}

    public JoinHouseholdRequest(String inviteCode, String role) {
        this.inviteCode = inviteCode;
        this.role = role;
    }

    public String getInviteCode() { return inviteCode; }
    public void setInviteCode(String inviteCode) { this.inviteCode = inviteCode; }

    public String getRole() { return role; }
    public void setRole(String role) { this.role = role; }
}