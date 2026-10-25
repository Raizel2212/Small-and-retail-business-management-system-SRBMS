package com.srbms.repository;

import com.srbms.entity.ExpenseTransaction;
import com.srbms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<ExpenseTransaction, Long> {

    List<ExpenseTransaction> findByUserOrderByTransactionDateDescIdDesc(User user);

    List<ExpenseTransaction> findByUserAndTransactionDateBetweenOrderByTransactionDateDescIdDesc(
            User user, LocalDate startDate, LocalDate endDate);

    long countByUser(User user);
}
