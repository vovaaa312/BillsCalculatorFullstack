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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
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

    private String followRedirects(String inputUrl) throws Exception {
        String finalUrl = inputUrl;
        URL url = new URL(inputUrl);
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
        return finalUrl;
    }

    private Map<String, String> parseQuery(String query) {
        Map<String, String> map = new LinkedHashMap<>();
        if (query == null || query.isBlank()) return map;
        for (String pair : query.split("&")) {
            int eq = pair.indexOf('=');
            if (eq < 0) continue;
            String key = URLDecoder.decode(pair.substring(0, eq), StandardCharsets.UTF_8);
            String val = URLDecoder.decode(pair.substring(eq + 1), StandardCharsets.UTF_8);
            map.put(key, val);
        }
        return map;
    }

    // Parse "lat,lon" string
    private RoutePoint latLonPoint(String s) {
        String[] parts = s.split(",");
        return coordPoint(parts[0].trim(), parts[1].trim());
    }

    // Parse "lon,lat" string (Mapy.cz order)
    private RoutePoint lonLatPoint(String s) {
        String[] parts = s.split(",");
        return coordPoint(parts[1].trim(), parts[0].trim());
    }

    public List<RoutePoint> resolveRouteUrl(String inputUrl) throws Exception {
        String resolved = followRedirects(inputUrl);
        // Handle consent.google.com
        if (resolved.contains("consent.google.com")) {
            Matcher cm = Pattern.compile("[?&]continue=([^&]+)").matcher(resolved);
            if (cm.find()) resolved = URLDecoder.decode(cm.group(1), StandardCharsets.UTF_8);
        }

        URL url = new URL(resolved);
        String host = url.getHost();
        Map<String, String> params = parseQuery(url.getQuery());

        // --- Google Maps: ?api=1&origin=lat,lon&destination=lat,lon&waypoints=lat,lon|lat,lon ---
        if (host.contains("google.com") && resolved.contains("/maps/dir")) {
            String origin = params.get("origin");
            String destination = params.get("destination");
            if (origin != null && destination != null
                    && origin.matches("-?\\d+\\.\\d+,-?\\d+\\.\\d+")
                    && destination.matches("-?\\d+\\.\\d+,-?\\d+\\.\\d+")) {
                List<RoutePoint> pts = new ArrayList<>();
                pts.add(latLonPoint(origin));
                String wps = params.get("waypoints");
                if (wps != null) for (String w : wps.split("\\|")) if (!w.isBlank()) pts.add(latLonPoint(w));
                pts.add(latLonPoint(destination));
                return pts;
            }
            // Path format: /maps/dir/Place+Name/Place+Name/...
            String path = url.getPath();
            Matcher dirM = Pattern.compile("/maps/dir/(.+)").matcher(path);
            if (dirM.find()) {
                String[] segments = dirM.group(1).split("/");
                List<RoutePoint> pts = new ArrayList<>();
                for (String seg : segments) {
                    if (seg.isBlank()) continue;
                    String decoded = URLDecoder.decode(seg.replace("+", " "), StandardCharsets.UTF_8);
                    Matcher coordM = Pattern.compile("^(-?\\d+\\.\\d+),(-?\\d+\\.\\d+)$").matcher(decoded);
                    if (coordM.matches()) {
                        pts.add(coordPoint(coordM.group(1), coordM.group(2)));
                    } else {
                        RoutePoint pt = new RoutePoint(decoded);
                        try { GeocodingHelper.resolve(pt); } catch (Exception ignored) {}
                        pts.add(pt);
                    }
                }
                if (pts.size() >= 2) return pts;
            }
        }

        // --- Mapy.cz: ?start=lon,lat&end=lon,lat&waypoints=lon,lat;lon,lat ---
        if (host.contains("mapy.")) {
            String startP = params.get("start");
            String endP = params.get("end");
            if (startP != null && endP != null) {
                List<RoutePoint> pts = new ArrayList<>();
                pts.add(lonLatPoint(startP));
                String wps = params.get("waypoints");
                if (wps != null) for (String w : wps.split(";")) if (!w.isBlank()) pts.add(lonLatPoint(w));
                pts.add(lonLatPoint(endP));
                return pts;
            }
        }

        throw new RuntimeException("Cannot parse route from URL: " + resolved);
    }

    public RoutePoint resolveMapsUrl(String shortUrl) throws Exception {
        String finalUrl = followRedirects(shortUrl);
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
