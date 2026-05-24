# Android Port Guideline

Guide for building an Android equivalent of the Cash Register System.
The business logic (model + util) is already portable plain Java — copy it directly.
Only the UI layer needs to be replaced.

---

## What to Copy Directly (Zero Changes)

These packages have no JavaFX or desktop dependencies after the refactor:

```
model/
  Faktura.java
  Polozka.java
  Vydaj.java
  Hotovost.java
  DriverShift.java
  TypPlatby.java
  StatusFaktury.java

util/
  DriverService.java
  ReportBuilder.java
  JsonIO.java        ← uses java.nio.file; adapt file path resolution for Android
```

`AppData.java` needs one change: replace `ObservableList` with `ArrayList` and add a simple observer interface (see below).

`I18n.java` uses `ResourceBundle` which is available on Android — but `.properties` files must be on the classpath. Either keep them or replace with Android `strings.xml`.

`Settings.java` uses `java.nio.file` — replace with Android `SharedPreferences`.

`PdfParser.java` and `PdfExporter.java` use Apache PDFBox — replace with an Android-compatible PDF library or remove PDF import (the core data model does not depend on it).

---

## Adapting AppData for Android

Replace `ObservableList` with plain `ArrayList` and a minimal observer:

```java
// Define once in your project:
public interface DataChangeListener {
    void onChanged();
}

public class AppData {
    private static final AppData INSTANCE = new AppData();
    public static AppData get() { return INSTANCE; }

    private final List<Faktura>     faktury      = new ArrayList<>();
    private final List<Vydaj>       vydaje       = new ArrayList<>();
    private final List<DriverShift> driverShifts = new ArrayList<>();
    private final Hotovost          hotovost     = new Hotovost();

    private final List<DataChangeListener> listeners = new ArrayList<>();

    public void addListener(DataChangeListener l) { listeners.add(l); }
    public void notifyChanged() { for (DataChangeListener l : listeners) l.onChanged(); }

    // Call notifyChanged() after any add/remove/edit operation
    public void addFaktura(Faktura f)     { faktury.add(f);     notifyChanged(); }
    public void removeFaktura(Faktura f)  { faktury.remove(f);  notifyChanged(); }
    // ... same pattern for vydaje and driverShifts

    public List<Faktura>     getFaktury()      { return faktury; }
    public List<Vydaj>       getVydaje()       { return vydaje; }
    public List<DriverShift> getDriverShifts() { return driverShifts; }
    public Hotovost          getHotovost()     { return hotovost; }

    // All computed totals are identical to the JavaFX version
    public int getTotalFaktury() { ... }
    // ...
}
```

Each Android `Fragment` or `Activity` registers as a listener and calls `recyclerView.getAdapter().notifyDataSetChanged()` (or a `DiffUtil` update) in response.

---

## Android Project Structure

Mirror the existing package structure:

```
com.example.pokladna/
├── model/           ← copied from JavaFX project (plain Java)
├── util/            ← copied from JavaFX project (adapt JsonIO, Settings)
├── ui/
│   ├── MainActivity.java        ← hosts BottomNavigationView + FragmentContainerView
│   ├── faktury/
│   │   ├── FakturyFragment.java
│   │   ├── FakturyAdapter.java  ← RecyclerView adapter
│   │   └── FakturaDialogFragment.java
│   ├── hotovost/
│   │   └── HotovostFragment.java
│   ├── vydaje/
│   │   ├── VydajeFragment.java
│   │   └── VydajAdapter.java
│   ├── driver/
│   │   ├── DriverFragment.java
│   │   ├── DriverAdapter.java
│   │   └── DriverDialogFragment.java
│   ├── report/
│   │   └── ReportFragment.java
│   └── io/
│       └── IoFragment.java      ← or a bottom sheet / drawer
└── res/
    ├── layout/
    ├── values/strings.xml       ← replaces .properties files
    └── values-cs/strings.xml
```

---

## Navigation

Use `BottomNavigationView` with 5 items matching the current tabs:

| Tab | Icon suggestion | Fragment |
|---|---|---|
| Faktury (Invoices) | `receipt` | `FakturyFragment` |
| Hotovost (Cash) | `payments` | `HotovostFragment` |
| Výdaje (Expenses) | `trending_down` | `VydajeFragment` |
| Řidič (Driver) | `directions_car` | `DriverFragment` |
| Report | `assessment` | `ReportFragment` |

IO (Save/Load) goes in the top `Toolbar` as an icon button — same pattern as the current desktop app.

---

## UI / UX Guidelines per Screen

### Faktury (Invoices)

**List screen:**
- `RecyclerView` with card items showing: customer name, amount, payment type chip, status chip, date
- Chips: colored — green for paid/cash, orange for transfer, red for unpaid
- FAB (`+`) to add a new invoice
- Top search bar (`SearchView`) that filters the list in real time
- Filter sheet (bottom sheet triggered by filter icon): payment type toggle group, status toggle group, amount range, date range — same filters as desktop
- Swipe-to-delete on list items with undo `Snackbar`
- Tap item to expand / show detail; long-press or swipe for context actions

**Add/Edit dialog:**
- `DialogFragment` or full-screen `Activity`
- Fields: customer name, payment type (`RadioGroup` or `ChipGroup`), status, date (`DatePickerDialog`)
- Line items section: inner `RecyclerView` or expandable list
- Each line item: name, quantity, unit price, VAT % — rest auto-computed
- `+` / `−` buttons to add/remove items
- Save button disabled until name is filled
- Validation errors shown as `TextInputLayout` error messages (inline, dialog stays open)

### Hotovost (Cash Drawer)

- Vertical list: one row per denomination (5000, 2000, 1000, 500, 200, 100 CZK) + coins row
- Each row: denomination label | `NumberPicker` or `+`/`−` buttons | running subtotal
- Large total label at the top (updates live as counts change)
- Coins row: direct number entry via `TextInputEditText` with numeric keyboard

### Výdaje (Expenses)

- `RecyclerView` with simple rows: name + amount
- FAB to add; tap to edit; swipe-to-delete with undo
- Total bar at the bottom pinned above the FAB

### Řidič (Driver Shifts)

**List screen:**
- `RecyclerView` with cards: driver name, date, start→end time, hours in H:mm format, km (if set), earnings
- FAB to add shift
- Filter bar (collapsible): name search, date range, hours range
- Totals bar: total hours + total earnings (for currently filtered shifts)
- Swipe-to-delete; tap to edit; long-press context menu

**Add/Edit dialog:**
- `DialogFragment`
- Driver name field
- Start: `DatePickerDialog` + two `NumberPicker` wheels (hours 0–23, minutes 0–59) side by side with colon separator — same UX as current desktop spinners
- End: same pattern
- Optional km start / km end fields (numeric input, shown as a collapsible section)
- Hourly rate field (numeric)
- End-before-start error shown inline, dialog stays open

### Report

- `ScrollView` containing a `TextView` with monospace font showing the ASCII report (identical to desktop output from `ReportBuilder.build(data)`)
- Toolbar actions: Refresh, Share (Android share intent with text/plain), Export PDF
- PDF export: use Android's `PdfDocument` API or a library

### IO (Save / Load)

- Accessible from toolbar icon (opens as bottom sheet or separate screen)
- File path field: use Android `Storage Access Framework` (`ACTION_OPEN_DOCUMENT`, `ACTION_CREATE_DOCUMENT`) instead of desktop file chooser
- Three buttons: Save, Load, Clear all — same logic as desktop
- Status log area showing result messages
- "Clear all" requires confirmation dialog

---

## Localization

Replace `ResourceBundle` + `.properties` files with Android `strings.xml`:

```xml
<!-- res/values/strings.xml (English default) -->
<string name="tab_faktury">Invoices</string>
<string name="faktury_total">Total: %d Kč</string>

<!-- res/values-cs/strings.xml (Czech) -->
<string name="tab_faktury">Faktury</string>
<string name="faktury_total">Celkem: %d Kč</string>
```

All i18n keys from `messages_en.properties` map 1:1 to string resource names (replace `.` with `_`).

`I18n.t(key)` calls become `getString(R.string.key_name)` inside Activities/Fragments, or `context.getString(...)` in adapters.

Language switching: Android handles it automatically via system locale. To allow in-app switching (same as desktop), use `AppCompatDelegate.setApplicationLocales()`.

---

## Theme (Light / Dark)

Use Android's built-in day/night mode:

```xml
<!-- res/values/themes.xml -->
<style name="Theme.Pokladna" parent="Theme.MaterialComponents.DayNight">
    ...
</style>
```

Toggle with:
```java
AppCompatDelegate.setDefaultNightMode(
    currentMode == MODE_NIGHT_YES ? MODE_NIGHT_NO : MODE_NIGHT_YES
);
```

Save preference to `SharedPreferences` (replaces `Settings.java`).

---

## Data Persistence (JSON)

`JsonIO.java` uses `java.nio.file.Files` — replace file access with Android's content URI streams:

```java
// Save
try (OutputStream out = getContentResolver().openOutputStream(uri)) {
    out.write(JsonIO.serialize(AppData.get()).getBytes(StandardCharsets.UTF_8));
}

// Load
try (InputStream in = getContentResolver().openInputStream(uri)) {
    String json = new String(in.readAllBytes(), StandardCharsets.UTF_8);
    JsonIO.deserialize(AppData.get(), json);
}
```

Refactor `JsonIO` to expose `serialize(AppData) → String` and `deserialize(AppData, String)` methods, then call them from the platform-specific file I/O code (already partially structured this way).

---

## PDF Import (PdfParser)

Apache PDFBox does not run on Android. Options:
- Use `com.itextpdf:itext7-core` (Android compatible build)
- Use `com.tom_roush:pdfbox-android`
- Or skip PDF import on Android — require manual invoice entry only

The parser logic (text parsing, column detection) in `PdfParser.java` can be reused once a text extraction library is chosen.

---

## Summary: Files by Portability

| File | Android action |
|---|---|
| `model/*.java` | Copy directly, zero changes |
| `util/ReportBuilder.java` | Copy directly |
| `util/DriverService.java` | Copy directly |
| `util/JsonIO.java` | Extract serialize/deserialize; replace file I/O |
| `util/Settings.java` | Replace with SharedPreferences |
| `util/PdfExporter.java` | Replace with Android PdfDocument |
| `util/PdfParser.java` | Replace PDFBox with Android-compatible lib |
| `util/ThemeManager.java` | Replace with AppCompatDelegate night mode |
| `i18n/I18n.java` | Replace with Android getString() |
| `model/AppData.java` | Replace ObservableList with ArrayList + listener |
| `controller/*.java` | Replace entirely with Fragments + Adapters |
| `*.fxml` | Replace entirely with XML layout files |
| `*.properties` | Replace with strings.xml |
| `css/*.css` | Replace with themes.xml + styles.xml |
