package com.example.billscalculatorbackend.repository;

import com.example.billscalculatorbackend.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    @Query("SELECT f FROM Invoice f LEFT JOIN FETCH f.items WHERE f.user = :user ORDER BY f.date DESC")
    List<Invoice> findByUserWithItems(@Param("user") User user);

    @Query("""
        SELECT DISTINCT f FROM Invoice f LEFT JOIN FETCH f.items
        WHERE f.user = :user
          AND (CAST(:name AS string) IS NULL OR LOWER(f.name) LIKE LOWER(CONCAT('%', CAST(:name AS string), '%')))
          AND (CAST(:paymentType AS string) IS NULL OR f.paymentType = :paymentType)
          AND (CAST(:status AS string) IS NULL OR f.status = :status)
          AND (CAST(:dateFrom AS date) IS NULL OR f.date >= :dateFrom)
          AND (CAST(:dateTo AS date) IS NULL OR f.date <= :dateTo)
          AND (CAST(:amountMin AS integer) IS NULL OR f.amount >= :amountMin)
          AND (CAST(:amountMax AS integer) IS NULL OR f.amount <= :amountMax)
        ORDER BY f.date DESC
    """)
    List<Invoice> findFiltered(
        @Param("user") User user,
        @Param("name") String name,
        @Param("paymentType") PaymentType paymentType,
        @Param("status") InvoiceStatus status,
        @Param("dateFrom") LocalDate dateFrom,
        @Param("dateTo") LocalDate dateTo,
        @Param("amountMin") Integer amountMin,
        @Param("amountMax") Integer amountMax
    );

    void deleteByUser(User user);
}
