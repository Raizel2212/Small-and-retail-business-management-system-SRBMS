package com.srbms.repository;

import com.srbms.entity.RevenueTransaction;
import com.srbms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface RevenueRepository extends JpaRepository<RevenueTransaction, Long> {

    List<RevenueTransaction> findByUserOrderByTransactionDateDescIdDesc(User user);

    List<RevenueTransaction> findByUserAndTransactionDateBetweenOrderByTransactionDateDescIdDesc(
            User user, LocalDate startDate, LocalDate endDate);

    long countByUser(User user);
}
