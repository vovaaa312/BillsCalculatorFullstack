package com.example.billscalculatorbackend.util;

import com.example.billscalculatorbackend.model.RoutePoint;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

public class GeocodingHelper {

    private static final Logger log = LoggerFactory.getLogger(GeocodingHelper.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String NOMINATIM_URL =
            "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=";

    public static void resolve(RoutePoint point) throws Exception {
        String query = URLEncoder.encode(point.getAddress(), StandardCharsets.UTF_8);
        HttpURLConnection conn = (HttpURLConnection) new URL(NOMINATIM_URL + query).openConnection();
        conn.setRequestProperty("User-Agent", "BillsCalculatorApp/1.0");
        conn.setConnectTimeout(8000);
        conn.setReadTimeout(8000);
        if (conn.getResponseCode() != 200) throw new Exception("Geocoding HTTP " + conn.getResponseCode());
        String body = readBody(conn);
        JsonNode arr = MAPPER.readTree(body);
        if (!arr.isArray() || arr.isEmpty()) throw new Exception("Address not found: " + point.getAddress());
        JsonNode obj = arr.get(0);
        point.setLat(obj.get("lat").asDouble());
        point.setLon(obj.get("lon").asDouble());
        point.setResolved(true);
        Thread.sleep(1100);
    }

    public static class SegmentInfo {
        public final double distanceKm;
        public final int    durationMin;
        public SegmentInfo(double distanceKm, int durationMin) {
            this.distanceKm = distanceKm;
            this.durationMin = durationMin;
        }
    }

    public static SegmentInfo routeSegment(RoutePoint from, RoutePoint to) {
        try {
            String url = "https://router.project-osrm.org/route/v1/driving/"
                    + from.getLon() + "," + from.getLat() + ";"
                    + to.getLon()   + "," + to.getLat()
                    + "?overview=false";
            HttpURLConnection conn = (HttpURLConnection) new URL(url).openConnection();
            conn.setRequestProperty("User-Agent", "BillsCalculatorApp/1.0");
            conn.setConnectTimeout(6000);
            conn.setReadTimeout(6000);
            if (conn.getResponseCode() != 200) return null;
            JsonNode root  = MAPPER.readTree(readBody(conn));
            JsonNode route = root.get("routes").get(0);
            return new SegmentInfo(route.get("distance").asDouble() / 1000.0,
                    (int) Math.ceil(route.get("duration").asDouble() / 60.0));
        } catch (Exception e) {
            log.warn("OSRM segment error: {}", e.getMessage());
            return null;
        }
    }

    public static double distanceKm(RoutePoint a, RoutePoint b) {
        final double R = 6371.0;
        double dLat = Math.toRadians(b.getLat() - a.getLat());
        double dLon = Math.toRadians(b.getLon() - a.getLon());
        double sa = Math.sin(dLat/2), so = Math.sin(dLon/2);
        double c = sa*sa + Math.cos(Math.toRadians(a.getLat()))*Math.cos(Math.toRadians(b.getLat()))*so*so;
        return R * 2 * Math.atan2(Math.sqrt(c), Math.sqrt(1-c));
    }

    private static String readBody(HttpURLConnection conn) throws Exception {
        BufferedReader reader = new BufferedReader(new InputStreamReader(conn.getInputStream(), StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) sb.append(line);
        reader.close();
        return sb.toString();
    }
}
