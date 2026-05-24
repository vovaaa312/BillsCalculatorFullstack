# Cash Register System — Project Documentation

## Overview

Desktop cash register application built with JavaFX. Tracks invoices, cash in drawer, expenses, and driver shifts. Generates plain-text and PDF reports. Saves/loads all data as a hand-written JSON file. Supports Czech and English UI with live switching, and light/dark themes.

---

## Architecture

```
src/main/java/.../
├── model/          ← Pure Java domain objects (no JavaFX imports except ObservableList in AppData)
├── util/           ← Business logic, IO, report generation
├── controller/     ← JavaFX controllers (UI only, delegate logic to model/util)
├── i18n/           ← Localization engine
└── App.java        ← JavaFX entry point

src/main/resources/.../
├── *.fxml          ← View layouts
├── css/            ← light.css, dark.css
└── i18n/           ← messages_cs.properties, messages_en.properties
```

### Layer rules (enforced after refactor)
| Layer | May depend on | May NOT depend on |
|---|---|---|
| `model/` | `java.*`, `java.time.*` | JavaFX UI, i18n, controllers |
| `util/` | `model/`, `java.*` | JavaFX UI, controllers |
| `i18n/` | `java.*`, JavaFX properties | model, util, controllers |
| `controller/` | everything | — |

---

## Domain Model

### `Faktura` (Invoice)
| Field | Type | Description |
|---|---|---|
| `nazev` | `String` | Customer / item name |
| `castka` | `int` | Total amount in CZK (recomputed from polozky) |
| `typPlatby` | `TypPlatby` | `HOTOVOST` (cash) or `PREVOD` (bank transfer) |
| `status` | `StatusFaktury` | `SPLNENA` (paid) or `NESPLNENA` (unpaid) |
| `datum` | `LocalDate` | Invoice date |
| `polozky` | `List<Polozka>` | Line items (may be empty) |

Computed methods: `getSoucetMnozstvi()`, `getSoucetCenaBezDph()`, `getSoucetDph()`, `getSoucetKcCelkem()`, `recomputeCastkaFromPolozky()`.

### `Polozka` (Invoice line item)
| Field | Type | Description |
|---|---|---|
| `nazev` | `String` | Item description |
| `mnozstvi` | `int` | Quantity |
| `jcena` | `double` | Unit price incl. VAT |
| `jcenaBezDph` | `double` | Unit price excl. VAT |
| `cena` | `double` | Line price excl. VAT (= jcenaBezDph × mnozstvi) |
| `dphProcent` | `int` | VAT rate % |
| `dphCastka` | `double` | VAT amount in CZK |
| `kcCelkem` | `double` | Line total incl. VAT |

### `Vydaj` (Expense)
| Field | Type | Description |
|---|---|---|
| `nazev` | `String` | Expense name |
| `castka` | `int` | Amount in CZK |

### `Hotovost` (Cash drawer)
Tracks counts of banknotes (5000, 2000, 1000, 500, 200, 100 CZK) and a coins bucket (`mince` in CZK). `getTotal()` computes the full drawer value.

### `DriverShift` (Driver work shift)
| Field | Type | Description |
|---|---|---|
| `driverName` | `String` | Driver name |
| `start` | `LocalDateTime` | Shift start |
| `end` | `LocalDateTime` | Shift end |
| `kmStart` | `int` | Odometer at start (-1 = not set) |
| `kmEnd` | `int` | Odometer at end (-1 = not set) |
| `hourlyRate` | `double` | Rate in CZK/hour (stored per shift) |

Computed: `getTotalMinutes()`, `getTotalHours()`, `getDrivenKm()`, `getEarnings()`.

### `AppData` (Singleton state)
Single instance holds all four lists/objects. Also computes aggregate totals: `getTotalFaktury()`, `getTotalPrevodem()`, `getTotalHotovostFaktury()`, `getTotalNesplnene()`, `getTotalVydaje()`, `getOcekavanaHotovost()`, `getRozdil()`.

Uses `ObservableList` (JavaFX) so controllers can react to list changes. On Android replace with `ArrayList` + manual observer callbacks.

---

## Enums

### `TypPlatby`
`HOTOVOST`, `PREVOD`. Method `i18nKey()` returns the bundle key for localization (`"typ.HOTOVOST"` etc.).

### `StatusFaktury`
`SPLNENA`, `NESPLNENA`. Method `i18nKey()` returns `"status.SPLNENA"` etc.

---

## Utility Layer

### `JsonIO`
Hand-written JSON serializer/deserializer (no external libs). Saves and loads all `AppData` to a `.json` file chosen by the user. Format: single root object with keys `faktury`, `vydaje`, `driverShifts`, `hotovost`. DateTime stored as ISO-8601 string via `LocalDateTime.toString()` / `LocalDateTime.parse()`.

### `ReportBuilder`
Builds a monospaced ASCII report string from `AppData`. Sections in order:
1. Invoices table (name, amount, type, status) + subtotals footer
2. Cash drawer table (denominations × counts)
3. Driver shifts table (driver, start, end, hours, km) + total hours + total earnings
4. Expenses table
5. Total / balance table (expected vs actual cash, surplus/shortage)

Used by `ReportController` (display) and `PdfExporter` (PDF save).

### `PdfExporter`
Renders the ASCII report string to PDF using Apache PDFBox. Uses a monospaced font to preserve table alignment.

### `PdfParser`
Parses supplier PDF invoices (Czech format) using PDFBox text extraction. Extracts customer name, line items, amounts. Handles "Akce" rows with discount columns.

### `DriverService`
Stateless utility for driver calculations:
- `earnings(DriverShift)` — uses shift's own `hourlyRate`
- `totalEarnings(List<DriverShift>)` — sum of all shifts' earnings
- `totalHours(List<DriverShift>)` — sum of hours

### `Settings`
Persists locale and theme to `~/.pokladna-settings.json`. Hand-written JSON, no deps. Read once on first access (`ensureLoaded`), written on every change.

### `ThemeManager`
Swaps CSS stylesheets on the main `Scene` and any secondary windows (IO window). Exposes `ObjectProperty<Theme>` for reactive bindings.

---

## i18n System (`I18n`)

- Two locales: `CS` (Czech, default) and `EN` (English)
- `ResourceBundle` loaded from `messages_cs.properties` / `messages_en.properties`
- `I18n.t(key)` — plain lookup
- `I18n.format(key, args...)` — `String.format` with bundle pattern
- `I18n.binding(key)` — `StringBinding` that updates automatically when locale changes (used to bind `Label.textProperty()` etc.)
- `I18n.formatBinding(key, argsCallable)` — formatted binding recomputed on locale change
- `I18n.setLocale(locale)` — triggers live UI update without restart

---

## Controllers

### `MainController`
- Loads all tab FXMLs at startup via `FXMLLoader`
- Top toolbar: IO button (opens floating window), language toggle, theme toggle
- Tab order: Faktury → Hotovost → Výdaje → Řidič → Report
- Triggers `ReportController.refresh()` when Report tab is selected

### `FakturyController`
- `TreeTableView<Object>` — root-level rows are `Faktura`, children are `Polozka` items + a synthetic `SoucetRow` footer
- Filters: text search, amount range, payment type radio buttons, status radio buttons, date range pickers
- Add/Edit dialog: inline validation (OK disabled when name empty), `Polozka` sub-table editable inline
- PDF import via `PdfParser`; supports drag-and-drop of PDF files onto the table
- Delete key removes selected invoice

### `HotovostController`
- One `Spinner<Integer>` per denomination
- Spinners sync to `Hotovost` POJO getters/setters via listener
- Row totals and grand total recomputed on every spinner change
- `syncFromModel()` — called by IoController after JSON load to refresh spinner values

### `VydajeController`
- Simple `TableView<Vydaj>` with Add/Edit/Delete dialog
- Edit updates the existing object in-place (no re-add)

### `DriverController`
- `FilteredList<DriverShift>` with predicate updated from filter panel
- Filters: name search, date range pickers, hours range text fields
- Add/Edit dialog: `DatePicker` + `Spinner<Integer>` for H and M (editable, digit-only, clamped)
- `lastRate` field persists hourly rate across dialog opens; saved into each shift
- Table earnings column reads `shift.getEarnings()` (uses stored rate)
- Double-click, Delete key, context menu all supported

### `ReportController`
- `TextArea` displaying `ReportBuilder.build(data)`
- Refreshes on tab select and on locale change
- PDF export via `PdfExporter`

### `IoController`
- File path field + Browse button → JSON file selection
- Save, Load, Clear buttons
- Load calls `HotovostController.syncFromModel()` via stored reference (set by `MainController` after tab load — *note: currently loaded indirectly through tab `getUserData()`*)
- On app close: dialog offers to open IO window before closing

---

## Persistence Format (JSON)

```json
{
  "faktury": [
    {
      "nazev": "Customer name",
      "castka": 1000,
      "typ": "HOTOVOST",
      "status": "SPLNENA",
      "datum": "2026-04-29",
      "polozky": [
        {
          "nazev": "Item", "mnozstvi": 1, "jcena": 1000.0,
          "jcenaBezDph": 826.45, "cena": 826.45, "dphProcent": 21,
          "dphCastka": 173.55, "kcCelkem": 1000.0
        }
      ]
    }
  ],
  "vydaje": [
    { "nazev": "Fuel", "castka": 500 }
  ],
  "driverShifts": [
    {
      "driverName": "Jan", "start": "2026-04-29T08:00",
      "end": "2026-04-29T16:30", "kmStart": 12000,
      "kmEnd": 12350, "hourlyRate": 150.0
    }
  ],
  "hotovost": {
    "k5000": 2, "k2000": 1, "k1000": 3,
    "k500": 4, "k200": 5, "k100": 6, "mince": 37
  }
}
```

---

## Known Technical Debt

- `DriverController.setupTable()` has dead code (unused local `startCol` variable, redundant first `setCellValueFactory` call on `colStart`)
- `VydajeController` edit dialog creates a new `Vydaj` and copies fields — inconsistent with other controllers that mutate in-place
- `ReportBuilder.fakturyTableToString()` footer width calculation hardcodes `c2` as the value column — fragile if labels are wider
- `IoController` accesses `HotovostController` indirectly through tab `getUserData()` — implicit coupling
- `AppData` uses `ObservableList` (JavaFX) — the only JavaFX dependency remaining in the model layer; replace with `ArrayList` + callback interface for non-JavaFX targets
