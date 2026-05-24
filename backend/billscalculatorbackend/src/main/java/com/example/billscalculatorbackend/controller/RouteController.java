package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.dto.RouteRequestDto;
import com.example.billscalculatorbackend.dto.RouteResultDto;
import com.example.billscalculatorbackend.model.RoutePoint;
import com.example.billscalculatorbackend.service.RouteService;
import com.example.billscalculatorbackend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/routes")
public class RouteController extends BaseController {

    private final RouteService routeService;

    public RouteController(UserService userService, RouteService routeService) {
        super(userService);
        this.routeService = routeService;
    }

    @PostMapping("/optimize")
    public ResponseEntity<RouteResultDto> optimize(@RequestBody RouteRequestDto req) throws Exception {
        return ResponseEntity.ok(routeService.optimizeRoute(req));
    }

    @PostMapping("/geocode")
    public ResponseEntity<RoutePoint> geocode(@RequestBody Map<String, String> body) throws Exception {
        return ResponseEntity.ok(routeService.geocode(body.get("address")));
    }

    @GetMapping("/resolve-maps-url")
    public ResponseEntity<RoutePoint> resolveMapsUrl(@RequestParam String url) throws Exception {
        return ResponseEntity.ok(routeService.resolveMapsUrl(url));
    }
}
