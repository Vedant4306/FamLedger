package com.vedbuk.famledgerapp.Entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.OffsetDateTime;

@Entity
@Table(
        name = "household_memberships",
        uniqueConstraints = @UniqueConstraint(columnNames = {"household_id", "user_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class HouseholdMembership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    private Household household;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String role = "CHILD"; // Default: 'PARENT' or 'CHILD'

    @Column(name = "joined_at", insertable = false, updatable = false)
    private OffsetDateTime joinedAt;
}