package com.example.billscalculatorbackend.repository;

import com.example.billscalculatorbackend.model.DriverShift;
import com.example.billscalculatorbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface DriverShiftRepository extends JpaRepository<DriverShift, Long> {

    List<DriverShift> findByUserOrderByStartDesc(User user);

    @Query("""
        SELECT d FROM DriverShift d
        WHERE d.user = :user
          AND (:driverName IS NULL OR LOWER(d.driverName) LIKE LOWER(CONCAT('%',:driverName,'%')))
          AND (:dateFrom IS NULL OR d.start >= :dateFrom)
          AND (:dateTo IS NULL OR d.start <= :dateTo)
        ORDER BY d.start DESC
    """)
    List<DriverShift> findFiltered(
        @Param("user") User user,
        @Param("driverName") String driverName,
        @Param("dateFrom") LocalDateTime dateFrom,
        @Param("dateTo") LocalDateTime dateTo
    );

    void deleteByUser(User user);
}
