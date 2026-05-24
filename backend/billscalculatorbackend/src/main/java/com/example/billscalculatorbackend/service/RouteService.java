package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.dto.RouteRequestDto;
import com.example.billscalculatorbackend.dto.RouteResultDto;
import com.example.billscalculatorbackend.dto.SegmentDto;
import com.example.billscalculatorbackend.model.RoutePoint;
import com.example.billscalculatorbackend.util.GeocodingHelper;
import com.example.billscalculatorbackend.util.RouteOptimizer;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class RouteService {

    public RouteResultDto optimizeRoute(RouteRequestDto req) throws Exception {
        List<RoutePoint> points = req.getPoints();
        if (points == null || points.size() < 2)
            throw new IllegalArgumentException("At least 2 points required");

        RoutePoint start = points.get(0);
        List<RoutePoint> destinations = new ArrayList<>(points.subList(1, points.size()));

        List<RoutePoint> optimized = RouteOptimizer.optimize(start, destinations);

        List<SegmentDto> segments = new ArrayList<>();
        RoutePoint prev = start;
        double totalDist = 0;
        double totalDur = 0;
        for (RoutePoint next : optimized) {
            GeocodingHelper.SegmentInfo info = GeocodingHelper.routeSegment(prev, next);
            double dist = info != null ? info.distanceKm : 0;
            int dur = info != null ? info.durationMin : 0;
            totalDist += dist;
            totalDur += dur;
            segments.add(new SegmentDto(prev, next, dist, dur));
            prev = next;
        }

        List<RoutePoint> orderedPoints = new ArrayList<>();
        orderedPoints.add(start);
        orderedPoints.addAll(optimized);

        return new RouteResultDto(orderedPoints, segments, totalDist, totalDur);
    }

    public RoutePoint geocode(String address) throws Exception {
        RoutePoint point = new RoutePoint(address);
        GeocodingHelper.resolve(point);
        return point;
    }
}
