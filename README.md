# Bills Calculator

Webová aplikace pro evidenci faktur, výdajů, pokladní hotovosti a řidičských směn. Funguje v prohlížeči na počítači i na telefonu.

Vznikla jako port Android aplikace — stejná obchodní logika, nové rozhraní s účty a serverovým úložištěm.

## Co aplikace umí

- **Faktury** — seznam vydaných faktur s položkami, DPH, filtry, import z PDF
- **Výdaje** — evidence provozních nákladů
- **Hotovost** — počítání obsahu pokladny podle nominálů bankovek a mincí
- **Řidič** — záznamy směn s výpočtem odpracovaných hodin a výdělku
- **Trasy** — optimalizace pořadí zastávek, vzdálenosti přes OSRM, otevření v Google Maps / Waze / Mapy.com; parsování Google Maps krátkých odkazů
- **Report** — tisknutelný přehled všech dat jako text nebo PDF (CS / EN / RU / UA)
- **Import / Export** — záloha a obnova dat ve formátu JSON

Každý uživatel se registruje s e-mailem a heslem, data jsou oddělená per-účet. Rozhraní podporuje češtinu, angličtinu, ruštinu a ukrajinštinu.

---

## Požadavky

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- Port **80** musí být volný (frontend nginx)

---

## Spuštění (lokálně)

### 1. Vytvoř soubor `.env` v kořeni projektu

```env
POSTGRES_PASSWORD=silne-heslo
JWT_SECRET=nahodny-retezec-minimalne-32-znaku

# Volitelné — pouze pokud používáš Cloudflare Named Tunnel (viz sekce níže)
CF_TUNNEL_TOKEN=
```

### 2. Spusť kontejnery

```bash
git clone https://github.com/vovaaa312/BillsCalculatorFullstack.git
cd BillsCalculatorFullstack
docker compose up -d --build
```

Aplikace bude dostupná na [http://localhost](http://localhost).

Při prvním spuštění se automaticky vytvoří databáze a tabulky. Zaregistruj nový účet přes tlačítko **Registrovat**.

> **Poznámka:** Kontejnery jsou nastaveny na `restart: unless-stopped` — po restartu systému se automaticky spustí bez zásahu.

### Zastavení

```bash
docker compose down
```

Data v PostgreSQL jsou uložena ve volume `pg_data` a přežijí restart kontejnerů.

**Nikdy nespouštěj `docker compose down -v`** — tím se smaže databáze i všechna data.

### Přestavění po změně kódu

```bash
# Pouze frontend (zachová databázi)
docker compose up -d --build frontend

# Pouze backend (zachová databázi)
docker compose up -d --build backend

# Oboje (zachová databázi)
docker compose up -d --build frontend backend
```

---

## Přístup z telefonu přes Tailscale (doporučeno pro osobní použití)

Tailscale vytvoří privátní síť mezi tvými zařízeními — bez otevřených portů, bez domény, bez konfigurace routeru.

### Co je potřeba udělat jednou

1. **Na počítači (server):** nainstaluj a přihlaš se do [Tailscale](https://tailscale.com/download)
2. **Na telefonu:** nainstaluj Tailscale (Android / iOS) a přihlaš se **stejným účtem**
3. Hotovo — žádná další konfigurace není potřeba

### Jak se připojit z telefonu

Zjisti Tailscale IP adresu serveru:

```powershell
tailscale ip -4
```

Otevři v prohlížeči telefonu:

```
http://<tailscale-ip>
```

### Statická adresa přes MagicDNS

Místo IP adresy lze používat hostname počítače — přejdi na [tailscale.com/admin/machines](https://tailscale.com/admin/machines) a v nastavení účtu zapni **MagicDNS**. Pak bude aplikace dostupná na adrese:

```
http://<jmeno-pocitace>.<tailnet-name>.ts.net
```

Tato adresa se nemění ani po restartu.

> **Poznámka:** Aplikace běží na portu 80. Docker ji vystavuje na všech síťových rozhraních (`0.0.0.0:80`), takže Tailscale ji vidí automaticky bez jakýchkoliv změn v `docker-compose.yml`.

---

## Zpřístupnění přes Cloudflare Named Tunnel (statická doména, automatický start)

Pokud chceš, aby aplikace byla dostupná na pevné URL (`https://bills.tvojadomena.com`) pokaždé, když spustíš kontejnery — použij Named Tunnel. Tunnel token uložíš jednou do `.env` a cloudflared kontejner se spustí automaticky spolu s aplikací.

### Předpoklady

- Doména přidaná do Cloudflare (DNS spravuje Cloudflare)
- Účet na [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) (zdarma)

### 1. Vytvoř tunnel v Cloudflare dashboardu

1. Přejdi na **Zero Trust → Networks → Tunnels → Create a tunnel**
2. Typ: **Cloudflared** → dej mu název (např. `bills-calculator`) → Next
3. Na obrazovce "Install connector" **zkopíruj token** z příkazu — je to část za `--token` (dlouhý řetězec)
4. Přejdi na **Public Hostname → Add a public hostname**:
   - Subdomain: `bills` (nebo cokoliv)
   - Domain: tvoje doména spravovaná přes Cloudflare
   - Service type: `HTTP`, URL: `frontend:80`
5. Ulož

### 2. Přidej token do `.env`

```env
CF_TUNNEL_TOKEN=eyJhIjoiX...celý token...
```

### 3. Spusť kontejnery včetně tunelu

```bash
docker compose --profile tunnel up -d
```

Nebo pokud chceš mít tunnel vždy zapnutý (přidej `--profile tunnel` do každého příkazu), nastav `COMPOSE_PROFILES=tunnel` v `.env`:

```env
COMPOSE_PROFILES=tunnel
```

Pak stačí běžné `docker compose up -d` — cloudflared se spustí automaticky.

Aplikace bude dostupná na `https://bills.tvojadomena.com`.

> **Poznámka:** Na rozdíl od Quick Tunnel je URL vždy stejná a tunnel se obnoví automaticky i po restartu systému (`restart: unless-stopped`).

---

## Zpřístupnění přes Cloudflare Quick Tunnel (bez účtu, bez domény)

Pokud chceš aplikaci zpřístupnit z jiné sítě (telefon, jiný počítač, testování) bez pevné IP nebo domény, použij Cloudflare Quick Tunnel. Vygeneruje dočasnou veřejnou URL zdarma a bez registrace.

### Jednorázové spuštění

```bash
cloudflared tunnel --url http://localhost:80 --no-autoupdate
```

V terminálu se zobrazí URL ve tvaru `https://neco-neco.trycloudflare.com`. Tato URL je platná dokud běží proces.

> **Upozornění:** URL se mění při každém novém spuštění cloudflared — po restartu bude jiná.

### Instalace cloudflared (pokud chybí)

```bash
# Linux (amd64)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
```

### Automatický start cloudflared po restartu systému (systemd)

Pokud chceš, aby se tunel spustil automaticky po restartu počítače, vytvoř systemd service:

```bash
sudo nano /etc/systemd/system/cloudflared-tunnel.service
```

Obsah souboru:

```ini
[Unit]
Description=Cloudflare Quick Tunnel (Bills Calculator)
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:80 --no-autoupdate
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Aktivace:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared-tunnel
sudo systemctl start cloudflared-tunnel
```

Zobrazení aktuální URL tunelu (hledej řádek s `trycloudflare.com`):

```bash
sudo journalctl -u cloudflared-tunnel -n 50 --no-pager | grep trycloudflare
```

---

## Přístup v lokální síti přes mDNS (`.local`)

Pokud jsou všechna zařízení ve stejné Wi-Fi a máš `avahi-daemon` nainstalovaný:

```bash
sudo apt install avahi-daemon
```

Aplikace bude dostupná na `http://jmeno-pocitace.local` bez nutnosti znát IP adresu.

Pokud avahi inzeruje špatnou IP (např. adresu Docker sítě), uprav `/etc/avahi/avahi-daemon.conf`:

```ini
[server]
allow-interfaces=wlp0s20f3   # název Wi-Fi rozhraní (zjisti přes: ip link)
```

---

## Stack

- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, react-i18next
- **Backend** — Spring Boot 3, Spring Security + JWT, Spring Data JPA
- **Databáze** — PostgreSQL 16
- **Mapové podklady** — OpenStreetMap (Leaflet), Nominatim, OSRM, Mapy.com

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
- **Routes** — stop order optimization, distances via OSRM, open in Google Maps / Waze / Mapy.com; Google Maps short link parsing
- **Report** — printable summary of all data as text or PDF (CS / EN / RU / UA)
- **Import / Export** — backup and restore data in JSON format

Each user registers with an email and password; data is isolated per account. The UI supports Czech, English, Russian, and Ukrainian.

---

## Requirements

- [Docker](https://docs.docker.com/get-docker/) + Docker Compose
- Port **80** must be free (frontend nginx)

---

## Running locally

### 1. Create a `.env` file in the project root

```env
POSTGRES_PASSWORD=strong-password
JWT_SECRET=random-string-at-least-32-chars

# Optional — only needed if you use Cloudflare Named Tunnel (see section below)
CF_TUNNEL_TOKEN=
```

### 2. Start containers

```bash
git clone https://github.com/vovaaa312/BillsCalculatorFullstack.git
cd BillsCalculatorFullstack
docker compose up -d --build
```

The app will be available at [http://localhost](http://localhost).

On first run the database and tables are created automatically. Register a new account using the **Register** button.

> **Note:** Containers are set to `restart: unless-stopped` — they restart automatically after a system reboot with no manual intervention.

### Stopping

```bash
docker compose down
```

PostgreSQL data is stored in the `pg_data` volume and survives container restarts.

**Never run `docker compose down -v`** — that deletes the database and all data.

### Rebuilding after code changes

```bash
# Frontend only (preserves database)
docker compose up -d --build frontend

# Backend only (preserves database)
docker compose up -d --build backend

# Both (preserves database)
docker compose up -d --build frontend backend
```

---

## Access from phone via Tailscale (recommended for personal use)

Tailscale creates a private network between your devices — no open ports, no domain, no router config needed.

### One-time setup

1. **On the server (PC):** install and log in to [Tailscale](https://tailscale.com/download)
2. **On the phone:** install Tailscale (Android / iOS) and log in with **the same account**
3. Done — no further configuration needed

### How to connect from the phone

Get the Tailscale IP of the server:

```powershell
tailscale ip -4
```

Open in the phone browser:

```
http://<tailscale-ip>
```

### Static address via MagicDNS

Instead of the IP you can use the computer's hostname — go to [tailscale.com/admin/machines](https://tailscale.com/admin/machines) and enable **MagicDNS** in account settings. The app will then be available at:

```
http://<machine-name>.<tailnet-name>.ts.net
```

This address never changes even after a reboot.

> **Note:** The app runs on port 80. Docker binds it to all network interfaces (`0.0.0.0:80`), so Tailscale can reach it automatically with no changes to `docker-compose.yml`.

---

## Public access via Cloudflare Named Tunnel (static domain, automatic start)

If you want the app available at a fixed URL (`https://bills.yourdomain.com`) every time you start the containers — use a Named Tunnel. Store the tunnel token once in `.env` and the cloudflared container starts automatically alongside the app.

### Prerequisites

- A domain added to Cloudflare (DNS managed by Cloudflare)
- A [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) account (free plan works)

### 1. Create a tunnel in the Cloudflare dashboard

1. Go to **Zero Trust → Networks → Tunnels → Create a tunnel**
2. Type: **Cloudflared** → name it (e.g. `bills-calculator`) → Next
3. On the "Install connector" screen **copy the token** from the command — it's the long string after `--token`
4. Go to **Public Hostname → Add a public hostname**:
   - Subdomain: `bills` (or anything you like)
   - Domain: your Cloudflare-managed domain
   - Service type: `HTTP`, URL: `frontend:80`
5. Save

### 2. Add the token to `.env`

```env
CF_TUNNEL_TOKEN=eyJhIjoiX...full token...
```

### 3. Start containers including the tunnel

```bash
docker compose --profile tunnel up -d
```

To always start the tunnel without specifying the profile every time, add `COMPOSE_PROFILES=tunnel` to `.env`:

```env
COMPOSE_PROFILES=tunnel
```

Then plain `docker compose up -d` starts cloudflared automatically.

The app will be available at `https://bills.yourdomain.com`.

> **Note:** Unlike Quick Tunnel, the URL is always the same and the tunnel reconnects automatically after a system reboot (`restart: unless-stopped`).

---

## Public access via Cloudflare Quick Tunnel (no account, no domain)

To access the app from another network (phone, another PC, testing) without a static IP or domain, use Cloudflare Quick Tunnel. It generates a temporary public URL for free with no registration.

### One-off run

```bash
cloudflared tunnel --url http://localhost:80 --no-autoupdate
```

The terminal will print a URL like `https://something-something.trycloudflare.com`. Valid as long as the process runs.

> **Note:** The URL changes every time cloudflared restarts — after a reboot you'll get a new URL.

### Installing cloudflared (if missing)

```bash
# Linux (amd64)
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o /usr/local/bin/cloudflared
chmod +x /usr/local/bin/cloudflared
```

### Auto-start cloudflared on system boot (systemd)

```bash
sudo nano /etc/systemd/system/cloudflared-tunnel.service
```

File contents:

```ini
[Unit]
Description=Cloudflare Quick Tunnel (Bills Calculator)
After=network-online.target docker.service
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/local/bin/cloudflared tunnel --url http://localhost:80 --no-autoupdate
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl daemon-reload
sudo systemctl enable cloudflared-tunnel
sudo systemctl start cloudflared-tunnel
```

Check the current tunnel URL (look for the `trycloudflare.com` line):

```bash
sudo journalctl -u cloudflared-tunnel -n 50 --no-pager | grep trycloudflare
```

---

## Local network access via mDNS (`.local`)

If all devices are on the same Wi-Fi and you have `avahi-daemon` installed:

```bash
sudo apt install avahi-daemon
```

The app will be reachable at `http://machine-name.local` without knowing the IP address.

If avahi advertises the wrong IP (e.g. a Docker network address), edit `/etc/avahi/avahi-daemon.conf`:

```ini
[server]
allow-interfaces=wlp0s20f3   # your Wi-Fi interface name (check with: ip link)
```

---

## Stack

- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS 4, TanStack Query, react-i18next
- **Backend** — Spring Boot 3, Spring Security + JWT, Spring Data JPA
- **Database** — PostgreSQL 16
- **Maps** — OpenStreetMap (Leaflet), Nominatim, OSRM, Mapy.com
