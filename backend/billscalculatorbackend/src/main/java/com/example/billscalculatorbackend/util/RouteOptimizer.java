package com.example.billscalculatorbackend.util;

import com.example.billscalculatorbackend.model.RoutePoint;

import java.util.ArrayList;
import java.util.List;

public class RouteOptimizer {

    public static List<RoutePoint> optimize(RoutePoint start, List<RoutePoint> destinations) {
        List<RoutePoint> remaining = new ArrayList<>(destinations);
        List<RoutePoint> result    = new ArrayList<>();
        RoutePoint current = start;
        while (!remaining.isEmpty()) {
            RoutePoint nearest = null;
            double minDist = Double.MAX_VALUE;
            for (RoutePoint candidate : remaining) {
                double d = GeocodingHelper.distanceKm(current, candidate);
                if (d < minDist) { minDist = d; nearest = candidate; }
            }
            result.add(nearest);
            remaining.remove(nearest);
            current = nearest;
        }
        return result;
    }
}
