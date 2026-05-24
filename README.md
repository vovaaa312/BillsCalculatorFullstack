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

Každý uživatel se registruje s e-mailem a heslem, data jsou oddělená per-účet.

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
    - "80:80"   # nebo jiný port
```

---

## Stack

- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query
- **Backend** — Spring Boot 3, Spring Security + JWT, Spring Data JPA
- **Databáze** — PostgreSQL 16
- **Mapové podklady** — OpenStreetMap (Leaflet), Nominatim, OSRM
