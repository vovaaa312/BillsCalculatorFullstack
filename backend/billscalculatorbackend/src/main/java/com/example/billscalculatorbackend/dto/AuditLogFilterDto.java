package com.example.billscalculatorbackend.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AuditLogFilterDto {
    private String userEmail;
    private String action;
    private String category;
    private String status;
    private String dateFrom;
    private String dateTo;
}
