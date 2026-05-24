package com.example.billscalculatorbackend.dto;

import com.example.billscalculatorbackend.model.RoutePoint;
import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class SegmentDto {
    private RoutePoint from;
    private RoutePoint to;
    private double distanceKm;
    private int durationMin;
}
