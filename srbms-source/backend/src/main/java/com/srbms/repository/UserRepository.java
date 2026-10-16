package com.srbms.repository;

import com.srbms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByCccd(String cccd);

    Optional<User> findByEmail(String email);

    Optional<User> findBySdt(String sdt);

    boolean existsByCccd(String cccd);

    boolean existsByEmail(String email);

    boolean existsBySdt(String sdt);
}
