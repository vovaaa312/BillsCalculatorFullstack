package com.example.billscalculatorbackend.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RoutePoint {
    private String name;
    private double lat;
    private double lon;
    private boolean resolved;

    public RoutePoint(String name) {
        this.name = name;
        this.resolved = false;
    }
}
