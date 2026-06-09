package com.example.billscalculatorbackend.repository;

import com.example.billscalculatorbackend.model.DataArchive;
import com.example.billscalculatorbackend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface DataArchiveRepository extends JpaRepository<DataArchive, Long> {
    List<DataArchive> findByUserOrderByCreatedAtDesc(User user);
}
