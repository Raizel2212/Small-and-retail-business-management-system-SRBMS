package com.srbms.repository;

import com.srbms.entity.HouseholdBusiness;
import com.srbms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface HouseholdBusinessRepository extends JpaRepository<HouseholdBusiness, Long> {

    Optional<HouseholdBusiness> findByUser(User user);

    Optional<HouseholdBusiness> findByUserId(Long userId);
}
