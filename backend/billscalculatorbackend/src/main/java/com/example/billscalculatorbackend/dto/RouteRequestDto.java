package com.example.billscalculatorbackend.dto;

import com.example.billscalculatorbackend.model.RoutePoint;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class RouteRequestDto {
    private List<RoutePoint> points;
}
