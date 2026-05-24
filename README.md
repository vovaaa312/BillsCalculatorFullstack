# Bills Calculator

Web aplikace pro evidenci faktur, výdajů, pokladní hotovosti a řidičských směn. Funguje v prohlížeči na počítači i na telefonu.

Vznikla jako port Android aplikace — stejná obchodní logika, nové rozhraní s účty a serverovým úložištěm.

## Co aplikace umí

- **Faktury** — seznam vydaných faktur s položkami, DPH, filtry, import z PDF
- **Výdaje** — evidence provozních nákladů
- **Hotovost** — počítání obsahu pokladny podle nominálů bankovek a mincí
- **Řidič** — záznamy směn s výpočtem odpracovaných hodin a výdělku
- **Trasy** — optimalizace pořadí zastávek (nearest-neighbour), vzdálenosti přes OSRM, otevření v Google Maps / Waze / Mapy.cz
- **Report** — tisknutelný přehled všech dat jako text nebo PDF
- **Import / Export** — záloha a obnova dat ve formátu JSON

Každý uživatel se registruje s e-mailem a heslem, data jsou oddělená per-účet. Rozhraní lze přepnout mezi češtinou a angličtinou.

---

## Požadavky

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- Otevřené porty **3000** (web) a **8080** (API) — nebo jen 3000 pokud je backend pouze interní

---

## Spuštění

```bash
git clone https://github.com/vovaaa312/BillsCalculatorFullstack.git
cd BillsCalculatorFullstack
docker compose up -d --build
```

Aplikace bude dostupná na [http://localhost:3000](http://localhost:3000).

Při prvním spuštění se automaticky vytvoří databáze a tabulky. Zaregistruj nový účet přes tlačítko **Registrovat**.

### Zastavení

```bash
docker compose down
```

Data v PostgreSQL jsou uložena ve volume `pg_data` a přežijí restart kontejnerů.

Pro smazání všech dat včetně databáze:

```bash
docker compose down -v
```

---

## Nasazení na server (VPS / home server)

1. Nainstaluj Docker a Docker Compose na server
2. Zkopíruj nebo naklonuj repozitář
3. Nastav proměnné prostředí v `docker-compose.yml` nebo v souboru `.env`:

```env
POSTGRES_PASSWORD=silne-heslo
JWT_SECRET=nahodny-retezec-minimalne-32-znaku
```

4. Spusť:

```bash
docker compose up -d --build
```

5. Pokud chceš přistupovat přes doménu nebo HTTPS, postav před aplikaci **nginx** nebo **Caddy** jako reverse proxy na port 3000.

Příklad Caddy konfigurace:

```
bills.example.com {
    reverse_proxy localhost:3000
}
```

---

## Změna portu

Ve výchozím nastavení běží web na portu 3000. Změna v `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "80:80"
```

---

## Stack

- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query
- **Backend** — Spring Boot 3, Spring Security + JWT, Spring Data JPA
- **Databáze** — PostgreSQL 16
- **Mapové podklady** — OpenStreetMap (Leaflet), Nominatim, OSRM

---
---

# Bills Calculator (English)

Web app for tracking invoices, expenses, cash register contents, and driver shifts. Works in the browser on desktop and mobile.

Started as a port of an Android app — same business logic, new interface with accounts and server-side storage.

## What it does

- **Invoices** — list of issued invoices with line items, VAT, filters, PDF import
- **Expenses** — track operational costs
- **Cash** — count register contents by banknote and coin denomination
- **Driver** — shift records with hours worked and earnings calculated
- **Routes** — stop order optimization (nearest-neighbour), distances via OSRM, open in Google Maps / Waze / Mapy.cz
- **Report** — printable summary of all data as text or PDF
- **Import / Export** — backup and restore data in JSON format

Each user registers with an email and password; data is isolated per account. The UI supports Czech and English.

---

## Requirements

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- Open ports **3000** (web) and **8080** (API) — or just 3000 if the backend is internal only

---

## Running

```bash
git clone https://github.com/vovaaa312/BillsCalculatorFullstack.git
cd BillsCalculatorFullstack
docker compose up -d --build
```

The app will be available at [http://localhost:3000](http://localhost:3000).

On first run the database and tables are created automatically. Register a new account using the **Register** button.

### Stopping

```bash
docker compose down
```

PostgreSQL data is stored in the `pg_data` volume and survives container restarts.

To delete all data including the database:

```bash
docker compose down -v
```

---

## Deploying to a server (VPS / home server)

1. Install Docker and Docker Compose on the server
2. Copy or clone the repository
3. Set environment variables in `docker-compose.yml` or a `.env` file:

```env
POSTGRES_PASSWORD=strong-password
JWT_SECRET=random-string-at-least-32-chars
```

4. Run:

```bash
docker compose up -d --build
```

5. To access via a domain or HTTPS, put **nginx** or **Caddy** in front as a reverse proxy on port 3000.

Example Caddy config:

```
bills.example.com {
    reverse_proxy localhost:3000
}
```

---

## Changing the port

By default the web runs on port 3000. Change in `docker-compose.yml`:

```yaml
frontend:
  ports:
    - "80:80"
```

---

## Stack

- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query
- **Backend** — Spring Boot 3, Spring Security + JWT, Spring Data JPA
- **Database** — PostgreSQL 16
- **Maps** — OpenStreetMap (Leaflet), Nominatim, OSRM
