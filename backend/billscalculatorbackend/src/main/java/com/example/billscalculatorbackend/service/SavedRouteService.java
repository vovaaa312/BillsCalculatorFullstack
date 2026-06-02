package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.model.RoutePoint;
import com.example.billscalculatorbackend.model.SavedRoute;
import com.example.billscalculatorbackend.model.User;
import com.example.billscalculatorbackend.repository.SavedRouteRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SavedRouteService {

    private final SavedRouteRepository repo;
    private final ObjectMapper mapper;

    public List<SavedRoute> getAll(User user) {
        List<SavedRoute> routes = repo.findByUserOrderByCreatedAtDesc(user);
        routes.forEach(r -> r.setPoints(deserialize(r.getPointsJson())));
        return routes;
    }

    public SavedRoute save(User user, String name, List<RoutePoint> points) {
        SavedRoute r = new SavedRoute();
        r.setUser(user);
        r.setName(name != null && !name.isBlank() ? name : "Route " + LocalDateTime.now());
        r.setPointsJson(serialize(points));
        r.setCreatedAt(LocalDateTime.now());
        SavedRoute saved = repo.save(r);
        saved.setPoints(points);
        return saved;
    }

    public void delete(User user, Long id) {
        repo.findById(id)
                .filter(r -> r.getUser().getId().equals(user.getId()))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        repo.deleteById(id);
    }

    private String serialize(List<RoutePoint> points) {
        try {
            return mapper.writeValueAsString(points);
        } catch (Exception e) {
            throw new RuntimeException("Failed to serialize points", e);
        }
    }

    private List<RoutePoint> deserialize(String json) {
        try {
            return mapper.readValue(json, new TypeReference<>() {});
        } catch (Exception e) {
            return List.of();
        }
    }
}
