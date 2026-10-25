package com.srbms.repository;

import com.srbms.entity.Product;
import com.srbms.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long> {

    List<Product> findByUserOrderByNameAsc(User user);

    Optional<Product> findByUserAndNameIgnoreCase(User user, String name);

    List<Product> findByUserAndNameContainingIgnoreCaseOrderByNameAsc(User user, String keyword);
}
