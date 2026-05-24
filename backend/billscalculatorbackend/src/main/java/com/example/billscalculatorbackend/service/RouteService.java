package com.example.billscalculatorbackend.service;

import com.example.billscalculatorbackend.dto.RouteRequestDto;
import com.example.billscalculatorbackend.dto.RouteResultDto;
import com.example.billscalculatorbackend.dto.SegmentDto;
import com.example.billscalculatorbackend.model.RoutePoint;
import com.example.billscalculatorbackend.util.GeocodingHelper;
import com.example.billscalculatorbackend.util.RouteOptimizer;
import org.springframework.stereotype.Service;

import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

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

    public RoutePoint resolveMapsUrl(String shortUrl) throws Exception {
        String finalUrl = shortUrl;
        URL url = new URL(shortUrl);
        int maxRedirects = 10;
        while (maxRedirects-- > 0) {
            HttpURLConnection conn = (HttpURLConnection) url.openConnection();
            conn.setInstanceFollowRedirects(false);
            conn.setRequestProperty("User-Agent", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36");
            conn.setRequestProperty("Cookie", "CONSENT=YES+1; SOCS=CAISHAgCEhIaAB");
            conn.setConnectTimeout(6000);
            conn.setReadTimeout(6000);
            int status = conn.getResponseCode();
            if (status >= 300 && status < 400) {
                String location = conn.getHeaderField("Location");
                conn.disconnect();
                if (location == null) break;
                if (!location.startsWith("http")) {
                    location = url.getProtocol() + "://" + url.getHost() + location;
                }
                finalUrl = location;
                url = new URL(finalUrl);
            } else {
                conn.disconnect();
                break;
            }
        }
        // If stuck at consent.google.com, extract real URL from 'continue' param
        String searchUrl = finalUrl;
        if (finalUrl.contains("consent.google.com")) {
            Matcher cm = Pattern.compile("[?&]continue=([^&]+)").matcher(finalUrl);
            if (cm.find()) {
                searchUrl = URLDecoder.decode(cm.group(1), StandardCharsets.UTF_8);
            }
        }
        // 1. @lat,lon in URL path
        Matcher m = Pattern.compile("@(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)").matcher(searchUrl);
        if (m.find()) {
            return coordPoint(m.group(1), m.group(2));
        }
        // 2. ?q=lat,lon or ?ll=lat,lon (numeric)
        for (String p : new String[]{"[?&]q=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)", "[?&]ll=(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)"}) {
            m = Pattern.compile(p).matcher(searchUrl);
            if (m.find()) return coordPoint(m.group(1), m.group(2));
        }
        // 3. ?q=place_name — geocode via Nominatim, retry with shorter query on failure
        m = Pattern.compile("[?&]q=([^&#]+)").matcher(searchUrl);
        if (m.find()) {
            String query = URLDecoder.decode(m.group(1).replace("+", " "), StandardCharsets.UTF_8);
            String[] parts = query.split(",");
            for (int skip = 0; skip < parts.length; skip++) {
                StringBuilder sb = new StringBuilder();
                for (int i = skip; i < parts.length; i++) {
                    if (sb.length() > 0) sb.append(",");
                    sb.append(parts[i].trim());
                }
                String attempt = sb.toString();
                if (attempt.isEmpty()) continue;
                try {
                    RoutePoint pt = new RoutePoint(query);
                    pt.setResolved(false);
                    RoutePoint tmp = new RoutePoint(attempt);
                    GeocodingHelper.resolve(tmp);
                    pt.setLat(tmp.getLat());
                    pt.setLon(tmp.getLon());
                    pt.setResolved(true);
                    return pt;
                } catch (Exception ignored) { }
            }
        }
        throw new RuntimeException("Cannot extract coordinates from: " + searchUrl);
    }

    private RoutePoint coordPoint(String latStr, String lonStr) {
        double lat = Double.parseDouble(latStr);
        double lon = Double.parseDouble(lonStr);
        String name = GeocodingHelper.reverseGeocode(lat, lon);
        RoutePoint pt = new RoutePoint(name != null ? name : lat + ", " + lon);
        pt.setLat(lat);
        pt.setLon(lon);
        pt.setResolved(true);
        return pt;
    }
}
