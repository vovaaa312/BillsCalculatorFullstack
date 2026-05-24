# Гайд: Миграция BillsCalculator на Full-Stack Web (React + Spring Boot + PostgreSQL)

> Приложение уже существует в двух версиях: JavaFX (десктоп) → Android.
> Этот гайд описывает третий порт: веб-приложение с аккаунтами, серверным хранением данных и аутентификацией.
> Бизнес-логика (модели + утилиты) снова переносится без изменений — меняется только слой UI и персистентности.

---

## Содержание

1. [Обзор архитектуры](#1-обзор-архитектуры)
2. [Что переносить без изменений](#2-что-переносить-без-изменений)
3. [Структура проекта](#3-структура-проекта)
4. [База данных — PostgreSQL схема](#4-база-данных--postgresql-схема)
5. [Backend — Spring Boot](#5-backend--spring-boot)
6. [Аутентификация и аккаунты](#6-аутентификация-и-аккаунты)
7. [PDF парсер — адаптация под Spring](#7-pdf-парсер--адаптация-под-spring)
8. [Маршруты — адаптация геокодинга и OSRM](#8-маршруты--адаптация-геокодинга-и-osrm)
9. [Frontend — React TypeScript](#9-frontend--react-typescript)
10. [Экраны — детальное описание каждой вкладки](#10-экраны--детальное-описание-каждой-вкладки)
11. [REST API — полный список эндпоинтов](#11-rest-api--полный-список-эндпоинтов)
12. [Импорт/экспорт JSON и PDF](#12-импортэкспорт-json-и-pdf)
13. [Локализация](#13-локализация)
14. [Порядок реализации](#14-порядок-реализации)
15. [Зависимости (pom.xml и package.json)](#15-зависимости-pomxml-и-packagejson)

---

## 1. Обзор архитектуры

```
┌─────────────────────────────────────┐
│           React TypeScript          │  ← SPA, Vite, Tailwind CSS
│  7 вкладок = 7 React-компонентов   │
└──────────────┬──────────────────────┘
               │ HTTP/JSON (REST)
┌──────────────▼──────────────────────┐
│         Spring Boot 3.x             │
│  MVC: Controller → Service → Repo   │
│  Spring Security + JWT              │
│  Mulitpart upload (PDF/image OCR)   │
└──────────────┬──────────────────────┘
               │ JPA/Hibernate
┌──────────────▼──────────────────────┐
│         PostgreSQL 16               │
│  users, faktury, polozky, vydaje,   │
│  driver_shifts, hotovost            │
└─────────────────────────────────────┘
```

**Ключевые отличия от Android-версии:**
- Данные хранятся на сервере, привязаны к аккаунту пользователя
- Несколько пользователей — каждый видит только свои данные
- OCR выполняется на сервере (Tesseract или Google Cloud Vision)
- Геокодинг и OSRM-запросы делает бэкенд (нет CORS-проблем)
- PDF-экспорт генерируется на сервере и скачивается клиентом

---

## 2. Что переносить без изменений

Эти классы — чистая Java, без Android/JavaFX зависимостей. Копировать 1:1 в backend-модуль:

| Класс (Android путь) | Действие в Spring |
|---|---|
| `model/Faktura.java` | Скопировать, сделать `@Entity` JPA |
| `model/Polozka.java` | Скопировать, сделать `@Entity` JPA |
| `model/Vydaj.java` | Скопировать, сделать `@Entity` JPA |
| `model/Hotovost.java` | Скопировать, сделать `@Entity` JPA |
| `model/DriverShift.java` | Скопировать, сделать `@Entity` JPA |
| `model/TypPlatby.java` | Скопировать без изменений (`enum`) |
| `model/StatusFaktury.java` | Скопировать без изменений (`enum`) |
| `util/ReportBuilder.java` | Скопировать без изменений (`@Service`) |
| `util/DriverService.java` | Скопировать без изменений (`@Service`) |
| `util/RouteOptimizer.java` | Скопировать без изменений (`@Service`) |
| `util/PdfParser.java` | Скопировать, убрать Android-импорты — логика та же |

**Не переносить:**
- `AppData.java` — заменяется JPA Repository + аккаунт-scope
- `AppDatabase.java` и все Room-классы — заменяется PostgreSQL + Spring Data JPA
- Все `Fragment`, `Adapter`, `DialogFragment` — заменяется React
- `PdfImportHelper.java` (ML Kit) — заменяется Tesseract4J или Google Vision API
- `JsonIO.java` — заменяется Jackson (уже в Spring Boot стартере)

---

## 3. Структура проекта

```
bills-calculator-web/
├── backend/                          ← Spring Boot Maven проект
│   └── src/main/java/com/example/bills/
│       ├── BillsApplication.java
│       ├── config/
│       │   ├── SecurityConfig.java
│       │   └── JwtConfig.java
│       ├── model/                    ← скопировано из Android + JPA аннотации
│       │   ├── Faktura.java
│       │   ├── Polozka.java
│       │   ├── Vydaj.java
│       │   ├── Hotovost.java
│       │   ├── DriverShift.java
│       │   ├── TypPlatby.java
│       │   ├── StatusFaktury.java
│       │   └── User.java             ← новый
│       ├── repository/
│       │   ├── FakturaRepository.java
│       │   ├── PolozkaRepository.java
│       │   ├── VydajRepository.java
│       │   ├── HotovostRepository.java
│       │   ├── DriverShiftRepository.java
│       │   └── UserRepository.java
│       ├── service/
│       │   ├── FakturaService.java
│       │   ├── HotovostService.java
│       │   ├── VydajService.java
│       │   ├── DriverService.java    ← скопировано из Android
│       │   ├── ReportService.java    ← обёртка над ReportBuilder
│       │   ├── PdfParserService.java ← скопировано + Tesseract
│       │   ├── OcrService.java
│       │   ├── RouteService.java
│       │   └── UserService.java
│       ├── controller/
│       │   ├── AuthController.java
│       │   ├── FakturaController.java
│       │   ├── HotovostController.java
│       │   ├── VydajController.java
│       │   ├── DriverController.java
│       │   ├── ReportController.java
│       │   ├── RouteController.java
│       │   └── IoController.java
│       ├── dto/                      ← Request/Response DTO классы
│       │   ├── LoginRequest.java
│       │   ├── RegisterRequest.java
│       │   ├── JwtResponse.java
│       │   ├── FakturaDto.java
│       │   ├── FakturaFilterDto.java
│       │   └── RouteRequestDto.java
│       └── util/
│           ├── ReportBuilder.java    ← скопировано из Android
│           ├── RouteOptimizer.java   ← скопировано из Android
│           └── PdfParser.java        ← скопировано из Android
│   └── src/main/resources/
│       └── application.properties
│
├── frontend/                         ← React TypeScript (Vite)
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx                   ← роутинг React Router
│   │   ├── api/                      ← Axios клиенты
│   │   │   ├── client.ts             ← базовый Axios instance + JWT interceptor
│   │   │   ├── faktury.ts
│   │   │   ├── hotovost.ts
│   │   │   ├── vydaje.ts
│   │   │   ├── driver.ts
│   │   │   ├── report.ts
│   │   │   ├── routes.ts
│   │   │   └── auth.ts
│   │   ├── components/               ← переиспользуемые компоненты
│   │   │   ├── Layout.tsx            ← сайдбар + заголовок
│   │   │   ├── Sidebar.tsx
│   │   │   └── Modal.tsx
│   │   ├── pages/                    ← 7 вкладок = 7 страниц
│   │   │   ├── FakturyPage.tsx
│   │   │   ├── HotovostPage.tsx
│   │   │   ├── VydajePage.tsx
│   │   │   ├── DriverPage.tsx
│   │   │   ├── ReportPage.tsx
│   │   │   ├── RoutesPage.tsx
│   │   │   └── IoPage.tsx
│   │   ├── hooks/                    ← React Query хуки
│   │   │   ├── useFaktury.ts
│   │   │   ├── useHotovost.ts
│   │   │   ├── useVydaje.ts
│   │   │   └── useDriver.ts
│   │   └── types/                    ← TypeScript типы = модели Android
│   │       ├── faktura.ts
│   │       ├── vydaj.ts
│   │       ├── hotovost.ts
│   │       └── driver.ts
│   ├── package.json
│   └── vite.config.ts
│
└── docker-compose.yml                ← PostgreSQL + backend + frontend
```

---

## 4. База данных — PostgreSQL схема

### Таблица `users`

```sql
CREATE TABLE users (
    id          BIGSERIAL PRIMARY KEY,
    email       VARCHAR(255) UNIQUE NOT NULL,
    password    VARCHAR(255) NOT NULL,        -- bcrypt hash
    created_at  TIMESTAMP DEFAULT NOW()
);
```

### Таблица `faktury`

```sql
CREATE TABLE faktury (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nazev       VARCHAR(500) NOT NULL,
    castka      INTEGER NOT NULL DEFAULT 0,
    typ_platby  VARCHAR(20) NOT NULL,         -- 'HOTOVOST' | 'PREVOD'
    status      VARCHAR(20) NOT NULL,         -- 'SPLNENA' | 'NESPLNENA'
    datum       DATE NOT NULL
);
```

### Таблица `polozky`

```sql
CREATE TABLE polozky (
    id              BIGSERIAL PRIMARY KEY,
    faktura_id      BIGINT NOT NULL REFERENCES faktury(id) ON DELETE CASCADE,
    nazev           VARCHAR(500) NOT NULL,
    mnozstvi        INTEGER NOT NULL DEFAULT 1,
    jcena           NUMERIC(12,2) NOT NULL DEFAULT 0,
    jcena_bez_dph   NUMERIC(12,2) NOT NULL DEFAULT 0,
    cena            NUMERIC(12,2) NOT NULL DEFAULT 0,
    dph_procent     INTEGER NOT NULL DEFAULT 21,
    dph_castka      NUMERIC(12,2) NOT NULL DEFAULT 0,
    kc_celkem       NUMERIC(12,2) NOT NULL DEFAULT 0
);
```

### Таблица `vydaje`

```sql
CREATE TABLE vydaje (
    id      BIGSERIAL PRIMARY KEY,
    user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    nazev   VARCHAR(500) NOT NULL,
    castka  INTEGER NOT NULL DEFAULT 0
);
```

### Таблица `driver_shifts`

```sql
CREATE TABLE driver_shifts (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    driver_name  VARCHAR(255) NOT NULL,
    start_time   TIMESTAMP NOT NULL,
    end_time     TIMESTAMP NOT NULL,
    km_start     INTEGER NOT NULL DEFAULT -1,
    km_end       INTEGER NOT NULL DEFAULT -1,
    hourly_rate  NUMERIC(10,2) NOT NULL DEFAULT 0
);
```

### Таблица `hotovost`

```sql
CREATE TABLE hotovost (
    id        BIGSERIAL PRIMARY KEY,
    user_id   BIGINT UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kusy5000  INTEGER NOT NULL DEFAULT 0,
    kusy2000  INTEGER NOT NULL DEFAULT 0,
    kusy1000  INTEGER NOT NULL DEFAULT 0,
    kusy500   INTEGER NOT NULL DEFAULT 0,
    kusy200   INTEGER NOT NULL DEFAULT 0,
    kusy100   INTEGER NOT NULL DEFAULT 0,
    mince     INTEGER NOT NULL DEFAULT 0
);
```

> Каждая таблица содержит `user_id` — данные строго изолированы по аккаунту.
> Hotovost: одна строка на пользователя (UPSERT по user_id).

---

## 5. Backend — Spring Boot

### JPA Entity: Faktura

```java
@Entity
@Table(name = "faktury")
public class Faktura {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    private String nazev;
    private int castka;

    @Enumerated(EnumType.STRING)
    private TypPlatby typPlatby;

    @Enumerated(EnumType.STRING)
    private StatusFaktury status;

    private LocalDate datum;

    @OneToMany(mappedBy = "faktura", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Polozka> polozky = new ArrayList<>();

    // методы recomputeCastkaFromPolozky(), getSoucetKcCelkem() и др. — скопировать из Android
}
```

### Repository с фильтрацией

```java
public interface FakturaRepository extends JpaRepository<Faktura, Long> {

    List<Faktura> findByUserOrderByDatumDesc(User user);

    @Query("""
        SELECT f FROM Faktura f
        WHERE f.user = :user
          AND (:nazev IS NULL OR LOWER(f.nazev) LIKE LOWER(CONCAT('%',:nazev,'%')))
          AND (:typPlatby IS NULL OR f.typPlatby = :typPlatby)
          AND (:status IS NULL OR f.status = :status)
          AND (:dateFrom IS NULL OR f.datum >= :dateFrom)
          AND (:dateTo IS NULL OR f.datum <= :dateTo)
          AND (:amountMin IS NULL OR f.castka >= :amountMin)
          AND (:amountMax IS NULL OR f.castka <= :amountMax)
        ORDER BY f.datum DESC
    """)
    List<Faktura> findFiltered(
        @Param("user") User user,
        @Param("nazev") String nazev,
        @Param("typPlatby") TypPlatby typPlatby,
        @Param("status") StatusFaktury status,
        @Param("dateFrom") LocalDate dateFrom,
        @Param("dateTo") LocalDate dateTo,
        @Param("amountMin") Integer amountMin,
        @Param("amountMax") Integer amountMax
    );
}
```

### Service: FakturaService

```java
@Service
@RequiredArgsConstructor
public class FakturaService {

    private final FakturaRepository fakturaRepo;

    public List<Faktura> getAll(User user) {
        return fakturaRepo.findByUserOrderByDatumDesc(user);
    }

    public List<Faktura> getFiltered(User user, FakturaFilterDto filter) {
        return fakturaRepo.findFiltered(
            user,
            filter.getNazev(),
            filter.getTypPlatby(),
            filter.getStatus(),
            filter.getDateFrom(),
            filter.getDateTo(),
            filter.getAmountMin(),
            filter.getAmountMax()
        );
    }

    public Faktura create(User user, Faktura faktura) {
        faktura.setUser(user);
        faktura.recomputeCastkaFromPolozky();
        faktura.getPolozky().forEach(p -> p.setFaktura(faktura));
        return fakturaRepo.save(faktura);
    }

    public Faktura update(User user, Long id, Faktura updated) {
        Faktura existing = fakturaRepo.findById(id)
            .filter(f -> f.getUser().equals(user))
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        // обновить поля
        existing.setNazev(updated.getNazev());
        existing.setTypPlatby(updated.getTypPlatby());
        existing.setStatus(updated.getStatus());
        existing.setDatum(updated.getDatum());
        existing.getPolozky().clear();
        existing.getPolozky().addAll(updated.getPolozky());
        existing.getPolozky().forEach(p -> p.setFaktura(existing));
        existing.recomputeCastkaFromPolozky();
        return fakturaRepo.save(existing);
    }

    public void delete(User user, Long id) {
        fakturaRepo.findById(id)
            .filter(f -> f.getUser().equals(user))
            .ifPresent(fakturaRepo::delete);
    }
}
```

### Controller: FakturaController

```java
@RestController
@RequestMapping("/api/faktury")
@RequiredArgsConstructor
public class FakturaController {

    private final FakturaService service;
    private final UserService userService;

    private User currentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userService.findByEmail(email);
    }

    @GetMapping
    public List<Faktura> getAll(@ModelAttribute FakturaFilterDto filter) {
        return filter.isEmpty()
            ? service.getAll(currentUser())
            : service.getFiltered(currentUser(), filter);
    }

    @PostMapping
    public ResponseEntity<Faktura> create(@RequestBody Faktura faktura) {
        return ResponseEntity.status(201).body(service.create(currentUser(), faktura));
    }

    @PutMapping("/{id}")
    public Faktura update(@PathVariable Long id, @RequestBody Faktura faktura) {
        return service.update(currentUser(), id, faktura);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.delete(currentUser(), id);
        return ResponseEntity.noContent().build();
    }
}
```

> Такой же паттерн (Repository → Service → Controller) для всех остальных сущностей:
> `Vydaj`, `DriverShift`, `Hotovost` (upsert), маршруты (stateless).

---

## 6. Аутентификация и аккаунты

### Зависимости (pom.xml)

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.6</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.6</version>
    <scope>runtime</scope>
</dependency>
```

### SecurityConfig

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http, JwtFilter jwtFilter) throws Exception {
        return http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(s -> s.sessionCreationPolicy(STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
```

### AuthController

```java
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final JwtService jwtService;
    private final PasswordEncoder encoder;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (userService.existsByEmail(req.getEmail())) {
            return ResponseEntity.badRequest().body("Email already registered");
        }
        User user = userService.create(req.getEmail(), encoder.encode(req.getPassword()));
        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(new JwtResponse(token));
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        User user = userService.findByEmail(req.getEmail());
        if (user == null || !encoder.matches(req.getPassword(), user.getPassword())) {
            return ResponseEntity.status(401).body("Invalid credentials");
        }
        return ResponseEntity.ok(new JwtResponse(jwtService.generateToken(user.getEmail())));
    }
}
```

### Frontend: хранение токена

```typescript
// src/api/client.ts
import axios from 'axios';

export const api = axios.create({ baseURL: '/api' });

api.interceptors.request.use(config => {
    const token = localStorage.getItem('jwt');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

api.interceptors.response.use(
    r => r,
    err => {
        if (err.response?.status === 401) {
            localStorage.removeItem('jwt');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);
```

---

## 7. PDF парсер — адаптация под Spring

### Что остаётся

`util/PdfParser.java` полностью переносится без изменений — это чистая текст-логика (регексы, парсинг колонок). Весь код остаётся.

### Что меняется: извлечение текста

В Android использовался ML Kit (OCR для изображений) + `pdfbox-android`. В Spring используем:

```xml
<!-- PDFBox для PDF-файлов -->
<dependency>
    <groupId>org.apache.pdfbox</groupId>
    <artifactId>pdfbox</artifactId>
    <version>3.0.2</version>
</dependency>

<!-- Tesseract для OCR изображений -->
<dependency>
    <groupId>net.sourceforge.tess4j</groupId>
    <artifactId>tess4j</artifactId>
    <version>5.11.0</version>
</dependency>
```

### OcrService

```java
@Service
public class OcrService {

    // Tesseract требует установки tessdata (пакет language data)
    private final Tesseract tesseract;

    public OcrService() {
        tesseract = new Tesseract();
        tesseract.setDatapath("/usr/share/tesseract-ocr/4.00/tessdata");
        tesseract.setLanguage("ces+eng"); // Czech + English
    }

    public String extractTextFromPdf(MultipartFile file) throws Exception {
        try (PDDocument doc = PDDocument.load(file.getInputStream())) {
            PDFTextStripper stripper = new PDFTextStripper();
            String text = stripper.getText(doc);
            if (!text.isBlank()) return text; // PDF с текстовым слоем
        }
        // Сканированный PDF / изображение — OCR
        return tesseract.doOCR(ImageIO.read(file.getInputStream()));
    }
}
```

### PdfParserService (контроллер для парсинга)

```java
@Service
@RequiredArgsConstructor
public class PdfParserService {

    private final OcrService ocrService;

    public List<Faktura> parseUpload(MultipartFile file) throws Exception {
        String text = ocrService.extractTextFromPdf(file);
        Faktura faktura = PdfParser.parse(text); // копия из Android
        return faktura != null ? List.of(faktura) : List.of();
    }
}
```

### Endpoint загрузки

```java
@PostMapping(value = "/faktury/import-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<List<Faktura>> importPdf(
    @RequestParam("file") MultipartFile file
) throws Exception {
    List<Faktura> parsed = pdfParserService.parseUpload(file);
    List<Faktura> saved = parsed.stream()
        .map(f -> fakturaService.create(currentUser(), f))
        .toList();
    return ResponseEntity.ok(saved);
}
```

**Замена ML Kit на сервере:**

| Android (ML Kit) | Spring (Tesseract/PDFBox) |
|---|---|
| `TextRecognizer.process(InputImage)` | `tesseract.doOCR(BufferedImage)` |
| `pdfbox-android` text extraction | `PDFTextStripper.getText(PDDocument)` |
| Обработка на устройстве | Обработка на сервере |
| `PdfParser.parse(text)` | `PdfParser.parse(text)` — без изменений |

---

## 8. Маршруты — адаптация геокодинга и OSRM

### Что остаётся

- `util/RouteOptimizer.java` — алгоритм ближайшего соседа, переносится без изменений
- `util/GeocodingHelper.java` — HTTP-запросы к Nominatim/OSRM, переносится почти без изменений (убрать Android-импорты `android.util.Log`, использовать `java.util.logging` или SLF4J)

### RouteService

```java
@Service
@RequiredArgsConstructor
public class RouteService {

    private final GeocodingHelper geocodingHelper; // скопировано из Android

    public RouteResultDto optimizeRoute(RouteRequestDto req) throws Exception {
        RoutePoint start = geocodingHelper.resolve(new RoutePoint(req.getStart()));
        List<RoutePoint> destinations = req.getDestinations().stream()
            .map(addr -> {
                try { return geocodingHelper.resolve(new RoutePoint(addr)); }
                catch (Exception e) { throw new RuntimeException(e); }
            }).toList();

        List<RoutePoint> optimized = RouteOptimizer.optimize(start, new ArrayList<>(destinations));

        List<SegmentDto> segments = new ArrayList<>();
        RoutePoint prev = start;
        for (RoutePoint next : optimized) {
            SegmentInfo info = geocodingHelper.routeSegment(prev, next);
            segments.add(new SegmentDto(prev, next, info));
            prev = next;
        }

        return new RouteResultDto(start, optimized, segments);
    }
}
```

### RouteController

```java
@RestController
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final RouteService routeService;

    @PostMapping("/optimize")
    public ResponseEntity<RouteResultDto> optimize(@RequestBody RouteRequestDto req) throws Exception {
        return ResponseEntity.ok(routeService.optimizeRoute(req));
    }

    @PostMapping("/geocode")
    public ResponseEntity<RoutePoint> geocode(@RequestBody Map<String, String> body) throws Exception {
        RoutePoint point = geocodingHelper.resolve(new RoutePoint(body.get("address")));
        return ResponseEntity.ok(point);
    }
}
```

**Карта на фронте:** заменить OsmDroid-фрагмент на **Leaflet.js** (React-Leaflet):

```tsx
// RoutesPage.tsx — карта результата
import { MapContainer, TileLayer, Marker, Polyline } from 'react-leaflet';

<MapContainer center={[50.08, 14.44]} zoom={8}>
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
    {points.map((p, i) => <Marker key={i} position={[p.lat, p.lon]} />)}
    <Polyline positions={points.map(p => [p.lat, p.lon])} />
</MapContainer>
```

---

## 9. Frontend — React TypeScript

### Стек

| Технология | Версия | Назначение |
|---|---|---|
| React | 18+ | UI framework |
| TypeScript | 5+ | типизация |
| Vite | 5+ | сборщик |
| React Router | 6+ | навигация между вкладками |
| TanStack Query (React Query) | 5+ | кэш данных + refetch |
| Axios | 1+ | HTTP клиент |
| Tailwind CSS | 3+ | стили |
| React Hook Form | 7+ | формы (диалоги) |
| Zod | 3+ | валидация форм |
| React-Leaflet | 4+ | карта маршрутов |
| date-fns | 3+ | форматирование дат |
| i18next | 23+ | локализация (CS/EN) |

### TypeScript типы (аналоги Java моделей)

```typescript
// src/types/faktura.ts
export type TypPlatby = 'HOTOVOST' | 'PREVOD';
export type StatusFaktury = 'SPLNENA' | 'NESPLNENA';

export interface Polozka {
    id?: number;
    nazev: string;
    mnozstvi: number;
    jcena: number;
    jcenaBezDph: number;
    cena: number;
    dphProcent: number;
    dphCastka: number;
    kcCelkem: number;
}

export interface Faktura {
    id?: number;
    nazev: string;
    castka: number;
    typPlatby: TypPlatby;
    status: StatusFaktury;
    datum: string;           // ISO date "2026-05-01"
    polozky: Polozka[];
}

export interface FakturaFilter {
    nazev?: string;
    typPlatby?: TypPlatby;
    status?: StatusFaktury;
    dateFrom?: string;
    dateTo?: string;
    amountMin?: number;
    amountMax?: number;
}
```

```typescript
// src/types/driver.ts
export interface DriverShift {
    id?: number;
    driverName: string;
    startTime: string;       // ISO datetime "2026-05-01T08:00"
    endTime: string;
    kmStart: number;         // -1 если не задан
    kmEnd: number;
    hourlyRate: number;
    // вычисляемые (можно считать на фронте или получать с бэка)
    totalMinutes?: number;
    earnings?: number;
    drivenKm?: number;
}

// src/types/hotovost.ts
export interface Hotovost {
    kusy5000: number;
    kusy2000: number;
    kusy1000: number;
    kusy500: number;
    kusy200: number;
    kusy100: number;
    mince: number;
}
```

### Хук для данных (React Query)

```typescript
// src/hooks/useFaktury.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as api from '../api/faktury';
import { Faktura, FakturaFilter } from '../types/faktura';

export function useFaktury(filter: FakturaFilter = {}) {
    return useQuery({
        queryKey: ['faktury', filter],
        queryFn: () => api.getFaktury(filter),
    });
}

export function useCreateFaktura() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: api.createFaktura,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['faktury'] }),
    });
}

export function useDeleteFaktura() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: api.deleteFaktura,
        onSuccess: () => qc.invalidateQueries({ queryKey: ['faktury'] }),
    });
}
```

### API клиент

```typescript
// src/api/faktury.ts
import { api } from './client';
import { Faktura, FakturaFilter } from '../types/faktura';

export const getFaktury = (filter: FakturaFilter) =>
    api.get<Faktura[]>('/faktury', { params: filter }).then(r => r.data);

export const createFaktura = (f: Faktura) =>
    api.post<Faktura>('/faktury', f).then(r => r.data);

export const updateFaktura = (id: number, f: Faktura) =>
    api.put<Faktura>(`/faktury/${id}`, f).then(r => r.data);

export const deleteFaktura = (id: number) =>
    api.delete(`/faktury/${id}`);

export const importPdf = (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return api.post<Faktura[]>('/faktury/import-pdf', form).then(r => r.data);
};
```

---

## 10. Экраны — детальное описание каждой вкладки

### Вкладка 1: Faktury (Счета / Накладные)

**Аналог:** `FakturyFragment.java` + `FakturaDialogFragment.java`

**Что показывает:**
- Таблица/список счетов с колонками: название, сумма, тип оплаты, статус, дата
- Поисковая строка (фильтр по названию в реальном времени)
- Кнопка фильтров (нижняя панель): тип оплаты, статус, диапазон суммы, диапазон дат
- Три счётчика внизу: итого наличные, итого переводом, итого неоплачено
- FAB (+) для создания нового счёта
- Кнопка импорта PDF/изображения

**Диалог добавления/редактирования:**
- Поле: название клиента (обязательно)
- Тип оплаты: переключатель НАЛИЧНЫЕ / ПЕРЕВОД
- Статус: ОПЛАЧЕН / НЕОПЛАЧЕН
- Дата: date picker
- Список позиций (товаров/услуг):
  - Каждая позиция: название, кол-во, цена с НДС, % НДС
  - Автоматический пересчёт: цена без НДС, сумма НДС, итого
  - Кнопки + / − для добавления/удаления позиций
- Кнопка "Сохранить" неактивна пока не заполнено название

**React компоненты:**
```
FakturyPage.tsx
├── FakturyFilter.tsx       (строка поиска + кнопка фильтра)
├── FakturyFilterPanel.tsx  (bottom sheet с расширенными фильтрами)
├── FakturyTable.tsx        (список с пагинацией)
├── FakturaRow.tsx          (одна строка, раскрывается с позициями)
├── FakturaDialog.tsx       (модал добавления/редактирования)
│   └── PolozkyTable.tsx    (внутренняя таблица позиций)
└── FakturySummary.tsx      (три счётчика снизу)
```

---

### Вкладка 2: Hotovost (Касса)

**Аналог:** `HotovostFragment.java`

**Что показывает:**
- 6 строк купюр (5000, 2000, 1000, 500, 200, 100 CZK):
  - Каждая: номинал | кнопка − | поле с количеством | кнопка + | подитог строки
- Строка монет: поле ввода суммой + кнопки ±
- Большой итог (обновляется при каждом изменении)
- Баланс:
  - Ожидаемая наличность = оплаченные наличкой счета − расходы
  - Фактически в кассе = сумма купюр + монеты
  - Разница (может быть отрицательной — недостача)

**Поведение:** любое изменение сразу отправляет PATCH/PUT на бэкенд (debounce 500ms).

**React компоненты:**
```
HotovostPage.tsx
├── DenomRow.tsx    (одна строка купюры — переиспользуется x6)
├── CoinsRow.tsx    (строка монет)
└── CashSummary.tsx (итог + баланс)
```

---

### Вкладка 3: Vydaje (Расходы)

**Аналог:** `VydajeFragment.java`

**Что показывает:**
- Список расходов: название + сумма
- FAB (+) для добавления
- Тап на строку — редактирование
- Удаление (кнопка или свайп)
- Итоговая сумма расходов внизу

**Диалог:** два поля — название (обязательно) и сумма.

**React компоненты:**
```
VydajePage.tsx
├── VydajeList.tsx
├── VydajRow.tsx
├── VydajDialog.tsx
└── VydajeSummary.tsx
```

---

### Вкладка 4: Driver (Смены водителей)

**Аналог:** `DriverFragment.java` + `DriverShiftDialogFragment.java`

**Что показывает:**
- Список смен: имя водителя, дата, начало→конец, часы (H:mm), км (если задан), заработок
- Поиск по имени водителя
- Фильтры: диапазон дат, диапазон часов
- Итоги: суммарные часы + суммарный заработок по текущему фильтру
- FAB (+) для добавления смены

**Диалог добавления/редактирования:**
- Имя водителя
- Начало: date picker + выбор часов (0–23) + выбор минут (0–59)
- Конец: аналогично с валидацией (конец не раньше начала)
- Одометр начало/конец (опционально, скрыты по умолчанию)
- Ставка в час (ЧЧЧ Kč/h) — сохраняется между открытиями диалога

**React компоненты:**
```
DriverPage.tsx
├── DriverFilter.tsx
├── DriverList.tsx
├── DriverShiftRow.tsx
├── DriverShiftDialog.tsx
│   ├── TimePickerField.tsx  (часы + минуты)
│   └── OdometerSection.tsx  (скрытая секция км)
└── DriverSummary.tsx
```

---

### Вкладка 5: Report (Отчёт)

**Аналог:** `ReportFragment.java` + `ReportBuilder.java`

**Что показывает:**
- Многосекционный текстовый отчёт с моноширинным шрифтом (аналог ASCII-таблиц)
- 7 секций (тот же `ReportBuilder.build()`):
  1. Все счета (клиент, сумма, тип, статус)
  2. Только переводы (с подитогом)
  3. Неоплаченные счета
  4. Касса (купюры × количество)
  5. Смены водителей (если есть)
  6. Расходы
  7. Итоговый баланс: ожидаемая vs фактическая наличность, разница

**Действия:**
- Кнопка "Скачать PDF" — GET `/api/report/pdf` → скачивает файл
- Кнопка "Скачать TXT" — GET `/api/report/txt` → скачивает файл

**Бэкенд:**

```java
@GetMapping("/report/pdf")
public ResponseEntity<byte[]> getPdf() {
    User user = currentUser();
    // Собираем AppData из БД для этого пользователя
    AppData data = buildAppData(user);
    String report = ReportBuilder.build(data, makeStrings());
    byte[] pdf = PdfExporter.export(report);  // скопировано из Android
    return ResponseEntity.ok()
        .header("Content-Disposition", "attachment; filename=report.pdf")
        .contentType(MediaType.APPLICATION_PDF)
        .body(pdf);
}
```

**React компоненты:**
```
ReportPage.tsx
└── ReportView.tsx  (pre с моноширинным шрифтом)
```

---

### Вкладка 6: Routes (Маршруты)

**Аналог:** `RoutesFragment.java` + `GeocodingHelper.java` + `RouteOptimizer.java`

**Что показывает:**
- Поле начальной точки (автодополнение из истории)
- Список точек назначения (добавить/удалить)
- Кнопка "Оптимизировать маршрут"
- Результат: упорядоченный список сегментов с расстоянием и временем
- Карта с маркерами и линиями (Leaflet)
- Ссылки "Открыть в Google Maps" / "Открыть в Mapy.cz" для каждого сегмента

**Поведение:**
1. Пользователь вводит адреса
2. Нажимает "Оптимизировать"
3. POST `/api/routes/optimize` с адресами
4. Бэкенд геокодирует → оптимизирует → считает сегменты OSRM
5. Фронт показывает результат + рисует маршрут на карте

**React компоненты:**
```
RoutesPage.tsx
├── AddressInput.tsx          (поле адреса + кнопка удаления)
├── RouteMap.tsx              (React-Leaflet карта)
├── RouteResultList.tsx       (список сегментов)
└── RouteSegmentRow.tsx       (один сегмент: откуда→куда, км, мин)
```

---

### Вкладка 7: IO (Импорт/Экспорт)

**Аналог:** `IoFragment.java` + `JsonIO.java`

**Что показывает:**
- Кнопка "Экспортировать JSON" — скачать все данные пользователя в JSON-файл
- Кнопка "Импортировать JSON" — загрузить JSON-файл, заменить данные
- Кнопка "Очистить все данные" — с подтверждением (удаляет все счета/расходы/смены/кассу)
- Лог последних операций

**Бэкенд:**

```java
// GET /api/io/export — скачать JSON
@GetMapping("/io/export")
public ResponseEntity<String> export() {
    AppData data = buildAppData(currentUser());
    return ResponseEntity.ok()
        .header("Content-Disposition", "attachment; filename=data.json")
        .contentType(MediaType.APPLICATION_JSON)
        .body(JsonIO.serialize(data));
}

// POST /api/io/import — загрузить JSON (заменяет текущие данные)
@PostMapping(value = "/io/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<Void> importData(@RequestParam("file") MultipartFile file) throws Exception {
    String json = new String(file.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
    AppData data = new AppData();
    JsonIO.deserialize(data, json);
    ioService.replaceAllData(currentUser(), data);
    return ResponseEntity.ok().build();
}

// DELETE /api/io/clear — удалить всё
@DeleteMapping("/io/clear")
public ResponseEntity<Void> clearAll() {
    ioService.clearAll(currentUser());
    return ResponseEntity.noContent().build();
}
```

---

## 11. REST API — полный список эндпоинтов

```
POST   /api/auth/register              регистрация
POST   /api/auth/login                 вход, возвращает JWT

GET    /api/faktury                    список (с фильтрами через query params)
POST   /api/faktury                    создать счёт
PUT    /api/faktury/{id}               обновить счёт
DELETE /api/faktury/{id}               удалить счёт
POST   /api/faktury/import-pdf         загрузить PDF/фото, вернуть распознанные счета

GET    /api/hotovost                   текущее состояние кассы
PUT    /api/hotovost                   обновить кассу (полная замена)

GET    /api/vydaje                     список расходов
POST   /api/vydaje                     добавить расход
PUT    /api/vydaje/{id}               обновить расход
DELETE /api/vydaje/{id}               удалить расход

GET    /api/driver                     список смен (с фильтрами)
POST   /api/driver                     добавить смену
PUT    /api/driver/{id}               обновить смену
DELETE /api/driver/{id}               удалить смену

GET    /api/report/text                отчёт в виде plain text
GET    /api/report/pdf                 отчёт в виде PDF (скачать)

POST   /api/routes/optimize            оптимизировать маршрут
POST   /api/routes/geocode             геокодировать один адрес

GET    /api/io/export                  экспорт всех данных в JSON
POST   /api/io/import                  импорт JSON (multipart)
DELETE /api/io/clear                   удалить все данные пользователя
```

**Параметры фильтрации для GET /api/faktury:**
```
?nazev=        строка (поиск по названию)
?typPlatby=    HOTOVOST | PREVOD
?status=       SPLNENA | NESPLNENA
?dateFrom=     2026-01-01 (ISO date)
?dateTo=       2026-12-31
?amountMin=    0
?amountMax=    99999
```

**Параметры фильтрации для GET /api/driver:**
```
?driverName=   строка
?dateFrom=     ISO date
?dateTo=       ISO date
?hoursMin=     0.0
?hoursMax=     24.0
```

---

## 12. Импорт/экспорт JSON и PDF

### Адаптация JsonIO.java

`JsonIO.serialize(AppData)` и `JsonIO.deserialize(AppData, String)` переносятся без изменений.  
На бэкенде используется как сервис:

```java
@Service
public class IoService {

    // внедрить все репозитории
    public AppData buildAppData(User user) {
        AppData data = new AppData();
        // загружаем из PostgreSQL
        data.getFaktury().addAll(fakturaRepo.findByUser(user));
        data.getVydaje().addAll(vydajRepo.findByUser(user));
        data.getDriverShifts().addAll(driverRepo.findByUser(user));
        hotovostRepo.findByUser(user).ifPresent(data::setHotovost);
        return data;
    }

    public void replaceAllData(User user, AppData data) {
        clearAll(user);
        data.getFaktury().forEach(f -> {
            f.setUser(user);
            f.getPolozky().forEach(p -> p.setFaktura(f));
            fakturaRepo.save(f);
        });
        data.getVydaje().forEach(v -> { v.setUser(user); vydajRepo.save(v); });
        data.getDriverShifts().forEach(s -> { s.setUser(user); driverRepo.save(s); });
        if (data.getHotovost() != null) {
            data.getHotovost().setUser(user);
            hotovostRepo.save(data.getHotovost());
        }
    }

    public void clearAll(User user) {
        fakturaRepo.deleteByUser(user);
        vydajRepo.deleteByUser(user);
        driverRepo.deleteByUser(user);
        hotovostRepo.deleteByUser(user);
    }
}
```

> Важно: Jackson (используется в Spring Boot по умолчанию) заменяет ручной `JsonIO.java` для REST-слоя.
> `JsonIO.java` нужен только для импорта/экспорта совместимого формата файлов (для совместимости с Android-версией).

---

## 13. Локализация

### Backend

Строки для отчёта (чешский/английский) — в `ReportBuilder` используется интерфейс `ReportStrings`.  
На бэкенде реализуй две фиксированные реализации: `CzechReportStrings` и `EnglishReportStrings`.

```java
// GET /api/report/text?lang=cs
@GetMapping("/report/text")
public ResponseEntity<String> getText(@RequestParam(defaultValue = "cs") String lang) {
    ReportStrings strings = "en".equals(lang) ? new EnglishReportStrings() : new CzechReportStrings();
    AppData data = buildAppData(currentUser());
    return ResponseEntity.ok(ReportBuilder.build(data, strings));
}
```

### Frontend

Используй `i18next` + `react-i18next`:

```bash
npm install i18next react-i18next
```

```typescript
// src/i18n/cs.json
{
  "faktury": "Faktury",
  "hotovost": "Hotovost",
  "vydaje": "Výdaje",
  "driver": "Řidič",
  "report": "Report",
  "routes": "Trasy",
  "io": "Import/Export",
  "add": "Přidat",
  "save": "Uložit",
  "cancel": "Zrušit",
  "delete": "Smazat"
}
```

```typescript
// src/i18n/index.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import cs from './cs.json';
import en from './en.json';

i18n.use(initReactI18next).init({
    lng: localStorage.getItem('lang') || 'cs',
    resources: { cs: { translation: cs }, en: { translation: en } },
});

export default i18n;
```

---

## 14. Порядок реализации

### Фаза 1: Backend Core (2–3 дня)

1. Создать Maven проект Spring Boot 3.x
2. Настроить `application.properties` (PostgreSQL, JWT secret, Tesseract path)
3. Скопировать `model/` из Android, добавить JPA-аннотации
4. Создать `UserRepository`, `UserService`, `AuthController` (register/login)
5. Реализовать `JwtService` + `JwtFilter` + `SecurityConfig`
6. Создать репозитории для всех сущностей
7. Создать сервисы: `FakturaService`, `HotovostService`, `VydajService`, `DriverService`
8. Создать контроллеры — все CRUD эндпоинты
9. Скопировать `ReportBuilder.java`, обернуть в `ReportService`
10. Эндпоинты `/report/text` и `/report/pdf`

### Фаза 2: PDF Парсер и OCR (1 день)

11. Добавить зависимости PDFBox + Tess4J в pom.xml
12. Скопировать `PdfParser.java`, убрать Android-импорты
13. Реализовать `OcrService` (PDFBox + Tesseract)
14. Эндпоинт `POST /faktury/import-pdf`

### Фаза 3: Маршруты (1 день)

15. Скопировать `GeocodingHelper.java` и `RouteOptimizer.java`
16. Заменить `android.util.Log` на `org.slf4j.Logger`
17. Реализовать `RouteService`
18. Эндпоинты `POST /routes/optimize` и `POST /routes/geocode`

### Фаза 4: Import/Export (0.5 дня)

19. Скопировать `JsonIO.java`, адаптировать для Spring (убрать `java.nio.file`)
20. Реализовать `IoService` (buildAppData, replaceAllData, clearAll)
21. Эндпоинты export/import/clear

### Фаза 5: Frontend основа (1 день)

22. Создать Vite + React + TS проект (`npm create vite@latest frontend -- --template react-ts`)
23. Установить все зависимости (Tailwind, React Router, React Query, Axios, i18next)
24. Настроить `src/api/client.ts` (Axios + JWT interceptor)
25. Создать Layout с сайдбаром (7 вкладок)
26. Страница Login + Register

### Фаза 6: Страницы (3–4 дня)

27. `FakturyPage` + `FakturaDialog` + `FakturaRow` + фильтры
28. `HotovostPage` с реальными значениями и расчётом баланса
29. `VydajePage` + диалог
30. `DriverPage` + диалог (выбор времени: часы + минуты)
31. `ReportPage` (просмотр + скачать PDF)
32. `RoutesPage` + React-Leaflet карта
33. `IoPage` (импорт/экспорт/очистка)

### Фаза 7: Финальная отладка (1 день)

34. Тестирование всех CRUD операций
35. Проверить PDF парсер на реальных файлах
36. Проверить маршруты (геокодинг + OSRM)
37. Добавить обработку ошибок (toast-уведомления, retry)

---

## 15. Зависимости (pom.xml и package.json)

### pom.xml (backend)

```xml
<parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>3.3.0</version>
</parent>

<dependencies>
    <!-- Web -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
    </dependency>

    <!-- Security + JWT -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-security</artifactId>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-api</artifactId>
        <version>0.12.6</version>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-impl</artifactId>
        <version>0.12.6</version>
        <scope>runtime</scope>
    </dependency>
    <dependency>
        <groupId>io.jsonwebtoken</groupId>
        <artifactId>jjwt-jackson</artifactId>
        <version>0.12.6</version>
        <scope>runtime</scope>
    </dependency>

    <!-- Database -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-data-jpa</artifactId>
    </dependency>
    <dependency>
        <groupId>org.postgresql</groupId>
        <artifactId>postgresql</artifactId>
        <scope>runtime</scope>
    </dependency>

    <!-- PDF parsing -->
    <dependency>
        <groupId>org.apache.pdfbox</groupId>
        <artifactId>pdfbox</artifactId>
        <version>3.0.2</version>
    </dependency>

    <!-- OCR (Tesseract) -->
    <dependency>
        <groupId>net.sourceforge.tess4j</groupId>
        <artifactId>tess4j</artifactId>
        <version>5.11.0</version>
    </dependency>

    <!-- Lombok (опционально, для @RequiredArgsConstructor) -->
    <dependency>
        <groupId>org.projectlombok</groupId>
        <artifactId>lombok</artifactId>
        <optional>true</optional>
    </dependency>

    <!-- Validation -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-validation</artifactId>
    </dependency>
</dependencies>
```

### application.properties (backend)

```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/bills_calculator
spring.datasource.username=postgres
spring.datasource.password=your_password

spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

jwt.secret=your-256-bit-secret-key-here-minimum-32-chars
jwt.expiration=86400000

# Tesseract (путь к tessdata, установить отдельно)
tesseract.datapath=/usr/share/tesseract-ocr/4.00/tessdata
tesseract.language=ces+eng

server.port=8080
```

### package.json (frontend)

```json
{
  "name": "bills-calculator-web",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.24.0",
    "@tanstack/react-query": "^5.50.0",
    "axios": "^1.7.0",
    "react-hook-form": "^7.52.0",
    "zod": "^3.23.0",
    "@hookform/resolvers": "^3.9.0",
    "react-leaflet": "^4.2.1",
    "leaflet": "^1.9.4",
    "i18next": "^23.12.0",
    "react-i18next": "^14.1.0",
    "date-fns": "^3.6.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/leaflet": "^1.9.0",
    "typescript": "^5.5.0",
    "vite": "^5.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

### vite.config.ts (proxy для разработки)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
    plugins: [react()],
    server: {
        proxy: {
            '/api': 'http://localhost:8080'
        }
    }
})
```

### docker-compose.yml

```yaml
version: '3.9'
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: bills_calculator
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: your_password
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8080:8080"
    depends_on:
      - postgres
    environment:
      SPRING_DATASOURCE_URL: jdbc:postgresql://postgres:5432/bills_calculator
      SPRING_DATASOURCE_USERNAME: postgres
      SPRING_DATASOURCE_PASSWORD: your_password
      JWT_SECRET: your-256-bit-secret-key-here

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend

volumes:
  pg_data:
```

---

## Краткая таблица соответствия Android → Web

| Android | Spring Boot | React |
|---|---|---|
| `Fragment` | `@RestController` | Page компонент (`*.tsx`) |
| `RecyclerView` + `Adapter` | - | `<table>` или list компонент |
| `DialogFragment` | - | `<Modal>` / `<Dialog>` |
| `Room` + `DAO` | `JpaRepository` + PostgreSQL | - |
| `AppData` (singleton) | Service + Repository слой | React Query cache |
| `DataChangeListener` | - | `queryClient.invalidateQueries()` |
| `SharedPreferences` | - | `localStorage` |
| `ML Kit` OCR | Tesseract4J | - |
| `OsmDroid` карта | - | React-Leaflet |
| `Nominatim` HTTP | `GeocodingHelper.java` (скопировать) | POST /api/routes/geocode |
| `OSRM` HTTP | `GeocodingHelper.routeSegment()` (скопировать) | POST /api/routes/optimize |
| `PdfParser.java` | `PdfParser.java` (скопировать) | POST /api/faktury/import-pdf |
| `PdfExporter.java` | `PdfExporter.java` (скопировать) | GET /api/report/pdf |
| `ReportBuilder.java` | `ReportBuilder.java` (скопировать) | GET /api/report/text |
| `JsonIO.java` | `JsonIO.java` (скопировать) | GET/POST /api/io/* |
| `strings.xml` | `ReportStrings` (CS/EN impl) | `i18next` + JSON файлы |
| Navigation Drawer | - | Sidebar с React Router |
