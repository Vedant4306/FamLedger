package com.vedbuk.famledgerapp.dto;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AddMemberRequest {
    private String email;
    private String role; // "PARENT" or "CHILD"
}