package com.example.billscalculatorbackend.dto;

import com.example.billscalculatorbackend.model.RoutePoint;
import lombok.AllArgsConstructor;
import lombok.Getter;

import java.util.List;

@Getter
@AllArgsConstructor
public class RouteResultDto {
    private RoutePoint start;
    private List<RoutePoint> optimizedRoute;
    private List<SegmentDto> segments;
}
