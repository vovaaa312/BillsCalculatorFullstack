package com.example.billscalculatorbackend.controller;

import com.example.billscalculatorbackend.dto.RouteRequestDto;
import com.example.billscalculatorbackend.dto.RouteResultDto;
import com.example.billscalculatorbackend.model.RoutePoint;
import com.example.billscalculatorbackend.model.SavedRoute;
import com.example.billscalculatorbackend.service.RouteService;
import com.example.billscalculatorbackend.service.SavedRouteService;
import com.example.billscalculatorbackend.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/routes")
public class RouteController extends BaseController {

    private final RouteService routeService;
    private final SavedRouteService savedRouteService;

    public RouteController(UserService userService, RouteService routeService, SavedRouteService savedRouteService) {
        super(userService);
        this.routeService = routeService;
        this.savedRouteService = savedRouteService;
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

    @GetMapping("/resolve-route-url")
    public ResponseEntity<List<RoutePoint>> resolveRouteUrl(@RequestParam String url) throws Exception {
        return ResponseEntity.ok(routeService.resolveRouteUrl(url));
    }

    @GetMapping("/saved")
    public List<SavedRoute> getSaved() {
        return savedRouteService.getAll(currentUser());
    }

    @PostMapping("/saved")
    public ResponseEntity<SavedRoute> save(@RequestBody SavedRoute body) {
        return ResponseEntity.status(201).body(savedRouteService.save(currentUser(), body.getName(), body.getPoints()));
    }

    @DeleteMapping("/saved/{id}")
    public ResponseEntity<Void> deleteSaved(@PathVariable Long id) {
        savedRouteService.delete(currentUser(), id);
        return ResponseEntity.noContent().build();
    }
}
