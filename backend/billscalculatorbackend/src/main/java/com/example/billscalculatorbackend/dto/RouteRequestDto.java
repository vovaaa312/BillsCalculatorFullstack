package com.example.billscalculatorbackend.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RouteRequestDto {
    private String start;
    private List<String> destinations;
}
