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
        RoutePoint start = new RoutePoint(req.getStart());
        GeocodingHelper.resolve(start);

        List<RoutePoint> destinations = new ArrayList<>();
        for (String addr : req.getDestinations()) {
            RoutePoint p = new RoutePoint(addr);
            GeocodingHelper.resolve(p);
            destinations.add(p);
        }

        List<RoutePoint> optimized = RouteOptimizer.optimize(start, destinations);

        List<SegmentDto> segments = new ArrayList<>();
        RoutePoint prev = start;
        for (RoutePoint next : optimized) {
            GeocodingHelper.SegmentInfo info = GeocodingHelper.routeSegment(prev, next);
            double dist = info != null ? info.distanceKm : 0;
            int    dur  = info != null ? info.durationMin : 0;
            segments.add(new SegmentDto(prev, next, dist, dur));
            prev = next;
        }

        return new RouteResultDto(start, optimized, segments);
    }

    public RoutePoint geocode(String address) throws Exception {
        RoutePoint point = new RoutePoint(address);
        GeocodingHelper.resolve(point);
        return point;
    }
}
