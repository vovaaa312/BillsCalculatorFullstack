package com.example.billscalculatorbackend.model;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class RoutePoint {
    private String address;
    private double lat;
    private double lon;
    private boolean resolved;

    public RoutePoint(String address) {
        this.address = address;
        this.resolved = false;
    }
}
