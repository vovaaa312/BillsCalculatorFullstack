package com.example.billscalculatorbackend.dto;

import com.example.billscalculatorbackend.model.RoutePoint;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class RouteResultDto {
    private List<RoutePoint> orderedPoints;
    private List<SegmentDto> segments;
    private double totalDistanceKm;
    private double totalDurationMin;
}
