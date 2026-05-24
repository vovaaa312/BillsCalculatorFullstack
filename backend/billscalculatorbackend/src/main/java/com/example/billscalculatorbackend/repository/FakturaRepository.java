package com.example.billscalculatorbackend.repository;

import com.example.billscalculatorbackend.model.*;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.List;

public interface FakturaRepository extends JpaRepository<Faktura, Long> {

    @Query("SELECT f FROM Faktura f LEFT JOIN FETCH f.polozky WHERE f.user = :user ORDER BY f.datum DESC")
    List<Faktura> findByUserWithPolozky(@Param("user") User user);

    @Query("""
        SELECT DISTINCT f FROM Faktura f LEFT JOIN FETCH f.polozky
        WHERE f.user = :user
          AND (:nazev IS NULL OR LOWER(f.nazev) LIKE LOWER(CONCAT('%',:nazev,'%')))
          AND (:typPlatby IS NULL OR f.typPlatby = :typPlatby)
          AND (:status IS NULL OR f.status = :status)
          AND (:dateFrom IS NULL OR f.datum >= :dateFrom)
          AND (:dateTo IS NULL OR f.datum <= :dateTo)
          AND (:amountMin IS NULL OR f.castka >= :amountMin)
          AND (:amountMax IS NULL OR f.castka <= :amountMax)
        ORDER BY f.datum DESC
    """)
    List<Faktura> findFiltered(
        @Param("user") User user,
        @Param("nazev") String nazev,
        @Param("typPlatby") TypPlatby typPlatby,
        @Param("status") StatusFaktury status,
        @Param("dateFrom") LocalDate dateFrom,
        @Param("dateTo") LocalDate dateTo,
        @Param("amountMin") Integer amountMin,
        @Param("amountMax") Integer amountMax
    );

    void deleteByUser(User user);
}
