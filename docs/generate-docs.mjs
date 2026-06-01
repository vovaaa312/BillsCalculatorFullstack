import {
  Document, Packer, Paragraph, TextRun, HeadingLevel,
  Table, TableRow, TableCell, BorderStyle, WidthType,
  AlignmentType, PageBreak, ShadingType, Header, Footer,
  NumberFormat, convertInchesToTwip, TableLayoutType,
} from 'docx';
import { writeFileSync } from 'fs';

// ─── helpers ────────────────────────────────────────────────────────────────

const FONT = 'Times New Roman';
const FONT_CODE = 'Courier New';
const SIZE_BODY = 24;        // 12pt  (half-points)
const SIZE_H1   = 32;        // 16pt
const SIZE_H2   = 28;        // 14pt
const SIZE_H3   = 26;        // 13pt
const SIZE_H4   = 24;        // 12pt bold

const ACCENT = '2F5496';     // dark blue for headings

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 276 },
    alignment: AlignmentType.JUSTIFIED,
    children: [new TextRun({
      text, font: FONT, size: SIZE_BODY,
      bold: opts.bold, italic: opts.italic,
    })],
  });
}

function code(text) {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    indent: { left: 720 },
    children: [new TextRun({
      text, font: FONT_CODE, size: 18,
    })],
    border: {
      left: { style: BorderStyle.SINGLE, size: 6, color: '888888' },
    },
  });
}

function codeBlock(lines) {
  return lines.map(l => code(l));
}

function h1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    pageBreakBefore: true,
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text: text.toUpperCase(), font: FONT, size: SIZE_H1, bold: true, color: ACCENT })],
  });
}

function h2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    children: [new TextRun({ text, font: FONT, size: SIZE_H2, bold: true, color: ACCENT })],
  });
}

function h3(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 160, after: 60 },
    children: [new TextRun({ text, font: FONT, size: SIZE_H3, bold: true })],
  });
}

function h4(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_4,
    spacing: { before: 120, after: 40 },
    children: [new TextRun({ text, font: FONT, size: SIZE_H4, bold: true, italics: true })],
  });
}

function bullet(text, level = 0) {
  return new Paragraph({
    bullet: { level },
    spacing: { before: 40, after: 40 },
    children: [new TextRun({ text, font: FONT, size: SIZE_BODY })],
  });
}

function gap(n = 1) {
  return Array.from({ length: n }, () => new Paragraph({ children: [new TextRun('')] }));
}

function captionTbl(text) {
  return new Paragraph({
    spacing: { before: 40, after: 80 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, font: FONT, size: 20, italics: true })],
  });
}

function captionFig(text) {
  return new Paragraph({
    spacing: { before: 40, after: 80 },
    alignment: AlignmentType.CENTER,
    children: [new TextRun({ text, font: FONT, size: 20, italics: true })],
  });
}

// ─── table builder ──────────────────────────────────────────────────────────
function tbl(headers, rows, colWidths) {
  const total = 9000;
  const w = colWidths || headers.map(() => Math.floor(total / headers.length));

  const makeCell = (text, isHeader = false) => new TableCell({
    width: { size: w[0], type: WidthType.DXA },
    shading: isHeader ? { fill: '2F5496', type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
    children: [new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new TextRun({
        text: String(text), font: FONT, size: 20,
        bold: isHeader, color: isHeader ? 'FFFFFF' : '000000',
      })],
    })],
  });

  const headerRow = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) => new TableCell({
      width: { size: w[i] || Math.floor(total / headers.length), type: WidthType.DXA },
      shading: { fill: '2F5496', type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
      children: [new Paragraph({
        alignment: AlignmentType.LEFT,
        children: [new TextRun({ text: String(h), font: FONT, size: 20, bold: true, color: 'FFFFFF' })],
      })],
    })),
  });

  const dataRows = rows.map((row, ri) => new TableRow({
    children: row.map((cell, ci) => new TableCell({
      width: { size: w[ci] || Math.floor(total / headers.length), type: WidthType.DXA },
      shading: ri % 2 === 1 ? { fill: 'EBF3FF', type: ShadingType.CLEAR } : undefined,
      margins: { top: 60, bottom: 60, left: 80, right: 80 },
      children: [new Paragraph({
        children: [new TextRun({ text: String(cell), font: FONT, size: 20 })],
      })],
    })),
  }));

  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: total, type: WidthType.DXA },
    rows: [headerRow, ...dataRows],
  });
}

// ─── TITLE PAGE ─────────────────────────────────────────────────────────────
function titlePage() {
  return [
    ...gap(4),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'ТЕХНИЧЕСКАЯ ДОКУМЕНТАЦИЯ', font: FONT, size: 40, bold: true, color: ACCENT })],
    }),
    ...gap(1),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'BillsCalculator', font: FONT, size: 48, bold: true })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Система учёта финансов', font: FONT, size: 28, italics: true })],
    }),
    ...gap(3),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Версия документации: 1.0 MVP', font: FONT, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Дата составления: 2026-05-28', font: FONT, size: 24 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Автор: Makarenko Volodymyr', font: FONT, size: 24 })],
    }),
    ...gap(2),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'Репозиторий: github.com/vovaaa312/BillsCalculatorFullstack', font: FONT, size: 20, italics: true, color: '888888' })],
    }),
    new Paragraph({
      children: [new PageBreak()],
    }),
  ];
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONTENT
// ═══════════════════════════════════════════════════════════════════════════════

const sections = [

  // ──────────────────────────────────────────────────────────────────────────
  // ГЛАВА 1
  // ──────────────────────────────────────────────────────────────────────────
  h1('1. Обзор проекта'),

  h2('1.1 Назначение системы'),
  body('BillsCalculator — многопользовательское веб-приложение для управления финансовой деятельностью малого бизнеса. Система предназначена для ведения счетов (фактур), расходов, смен водителей, наличных средств, а также для построения маршрутов и генерации отчётов.'),
  body('Приложение рассчитано на сценарий, при котором один администратор управляет несколькими пользователями, каждый из которых работает со своими изолированными данными. Пользователи не видят данные друг друга. Администратор имеет доступ ко всему.'),

  h2('1.2 Основные возможности'),
  bullet('Учёт выставленных счетов (фактур) с детализацией по позициям и НДС'),
  bullet('Импорт счетов из PDF-файлов чешского формата (Apache PDFBox)'),
  bullet('Учёт расходов с фильтрацией по дате и сумме'),
  bullet('Учёт смен водителей (пробег, часовая ставка, автоматический расчёт заработка)'),
  bullet('Учёт наличных средств по номиналам (1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000 CZK)'),
  bullet('Построение оптимальных маршрутов (геокодирование через Nominatim + nearest-neighbour алгоритм)'),
  bullet('Генерация PDF-отчётов на четырёх языках (CS, EN, RU, UA)'),
  bullet('Экспорт и импорт данных пользователя в формате JSON'),
  bullet('Администрирование пользователей: одобрение регистраций, отключение, удаление'),
  bullet('Резервное копирование и восстановление базы всех пользователей (JSON-бэкап)'),
  bullet('Аутентификация через Google OAuth 2.0'),
  bullet('Сброс пароля по email (Gmail SMTP)'),
  bullet('Многоязычный интерфейс (CS, EN, RU, UA) с переключением через URL'),
  bullet('Поддержка светлой и тёмной темы'),
  bullet('Адаптивный интерфейс (mobile + desktop)'),

  h2('1.3 Текущий статус разработки'),
  body('Система находится в состоянии функционирующего MVP. Все ключевые модули реализованы и работоспособны. Приложение разворачивается через Docker Compose и протестировано в локальном окружении.'),
  body('Отсутствует ряд production-grade компонентов: rate limiting на API, настройка HTTPS в Nginx, аудит-лог административных операций. Все выявленные ограничения задокументированы в разделе 12 (Технический долг).'),

  h2('1.4 Ограничения MVP'),
  captionTbl('Таблица 1.1 — Ограничения текущей версии системы'),
  tbl(
    ['Ограничение', 'Описание', 'Приоритет устранения'],
    [
      ['Нет rate limiting', 'Эндпоинты /api/auth/login и /api/auth/register открыты для брутфорса без ограничений', 'Высокий'],
      ['Нет HTTPS', 'Nginx настроен только на порт 80; TLS не конфигурируется', 'Высокий'],
      ['Нет аудит-лога', 'Административные действия не логируются', 'Средний'],
      ['Нет валидации входных данных', 'Длины строк и форматы значений не проверяются на уровне backend', 'Средний'],
      ['Пароли в backup', 'passwordHash включён в JSON-бэкап', 'Средний'],
      ['Нет CI/CD', 'Деплой производится вручную через docker compose up --build', 'Низкий'],
      ['Ручной JSON парсер', 'JsonIO реализован без Jackson; уязвим к крайним случаям формата', 'Средний'],
      ['CORS открыт', 'Разрешены все origins (*) в SecurityConfig', 'Высокий (перед production)'],
    ],
    [2800, 4200, 1800]
  ),

  // ──────────────────────────────────────────────────────────────────────────
  // ГЛАВА 2
  // ──────────────────────────────────────────────────────────────────────────
  h1('2. Технологический стек'),

  h2('2.1 Используемые технологии'),
  captionTbl('Таблица 2.1 — Технологический стек проекта'),
  tbl(
    ['Компонент', 'Технология', 'Версия', 'Назначение'],
    [
      ['Frontend framework', 'React', '18.x', 'Построение пользовательского интерфейса'],
      ['Язык (frontend)', 'TypeScript', '5.x', 'Статическая типизация'],
      ['Инструмент сборки', 'Vite', '8.x', 'Сборка и dev-сервер'],
      ['CSS фреймворк', 'Tailwind CSS', '3.x', 'Утилитарная стилизация'],
      ['Маршрутизатор', 'React Router v6', '6.x', 'Клиентская маршрутизация с lang-префиксом'],
      ['Server state', 'TanStack React Query', '5.x', 'Кэш и синхронизация данных с API'],
      ['HTTP клиент', 'Axios', '1.x', 'HTTP-запросы к API с JWT interceptor'],
      ['Интернационализация', 'react-i18next', '14.x', 'i18n (CS, EN, RU, UA)'],
      ['Backend framework', 'Spring Boot', '3.x', 'REST API сервер'],
      ['Язык (backend)', 'Java', '21', 'Основной язык backend'],
      ['Безопасность', 'Spring Security', '6.x', 'Аутентификация и авторизация'],
      ['ORM', 'Spring Data JPA / Hibernate', '3.x', 'Работа с базой данных'],
      ['База данных', 'PostgreSQL', '16', 'Основное хранилище данных'],
      ['PDF парсинг', 'Apache PDFBox', '2.x', 'Чтение PDF-счетов'],
      ['Email', 'Spring Mail (Gmail SMTP)', '3.x', 'Письма сброса пароля'],
      ['Google OAuth', 'Google Identity Services', 'актуальная', 'Вход через Google аккаунт'],
      ['Reverse proxy', 'Nginx', 'alpine', 'Раздача статики, проксирование /api/*'],
      ['Контейнеризация', 'Docker + Docker Compose', 'актуальная', 'Оркестрация сервисов'],
      ['Построение отчётов', 'iText / PDFBox', 'актуальная', 'Генерация PDF-отчётов'],
      ['Геокодирование', 'Nominatim (OpenStreetMap)', 'REST API', 'Преобразование адресов в координаты'],
    ],
    [2200, 2200, 1400, 3200]
  ),

  // ──────────────────────────────────────────────────────────────────────────
  // ГЛАВА 3
  // ──────────────────────────────────────────────────────────────────────────
  h1('3. Архитектура системы'),

  h2('3.1 Общая схема взаимодействия компонентов'),
  body('Система построена как трёхуровневое веб-приложение: React SPA (frontend), Spring Boot (backend), PostgreSQL (база данных). Nginx выступает единой точкой входа: раздаёт собранную React-статику и проксирует запросы /api/* на backend.'),
  body('Все компоненты работают в изолированных Docker-контейнерах в рамках общей внутренней сети. PostgreSQL и backend недоступны снаружи — только через Nginx.'),

  captionFig('Рисунок 3.1 — Общая схема архитектуры системы (Mermaid)'),
  ...codeBlock([
    'graph TD',
    '    Browser["Браузер / React SPA"]',
    '    Nginx["Nginx (порт 80)"]',
    '    Backend["Spring Boot (порт 8080, внутренний)"]',
    '    DB["PostgreSQL (порт 5432, внутренний)"]',
    '    Google["Google Identity Services"]',
    '    Gmail["Gmail SMTP (порт 587)"]',
    '',
    '    Browser -->|HTTP :80| Nginx',
    '    Nginx -->|"/api/* proxy_pass"| Backend',
    '    Nginx -->|"/* → статика"| Nginx',
    '    Backend -->|JDBC| DB',
    '    Browser -->|OAuth token| Google',
    '    Browser -->|"token → /api/auth/google"| Backend',
    '    Backend -->|SMTP TLS| Gmail',
  ]),

  h2('3.2 Поток аутентификации'),
  body('Аутентификация реализована на основе JWT (HS256). Токен возвращается при успешном логине и сохраняется в localStorage браузера. Все последующие запросы включают заголовок Authorization: Bearer <token>.'),
  body('JwtFilter перехватывает каждый запрос, извлекает и верифицирует токен, устанавливает SecurityContext. Публичные маршруты (/api/auth/**) обходят фильтр.'),

  captionFig('Рисунок 3.2 — Последовательность аутентификации (Mermaid)'),
  ...codeBlock([
    'sequenceDiagram',
    '    participant B as Браузер',
    '    participant BE as Backend',
    '    participant DB as PostgreSQL',
    '',
    '    B->>BE: POST /api/auth/login {email, password}',
    '    BE->>DB: findByEmail()',
    '    DB-->>BE: User',
    '    BE->>BE: BCrypt.verify(password, hash)',
    '    BE->>BE: JwtService.generateToken()',
    '    BE-->>B: 200 {token}',
    '    B->>B: localStorage.setItem("token", ...)',
    '',
    '    Note over B,BE: Последующие запросы',
    '    B->>BE: GET /api/invoices',
    '    Note right of B: Authorization: Bearer <token>',
    '    BE->>BE: JwtFilter — верификация подписи',
    '    BE->>DB: findByUser(currentUser)',
    '    DB-->>BE: данные',
    '    BE-->>B: 200 JSON',
  ]),

  h2('3.3 Поток Google OAuth'),
  body('Пользователь инициирует вход через Google Sign-In на стороне браузера. После успешной авторизации Google возвращает id_token (JWT). Браузер отправляет этот токен на /api/auth/google. Backend верифицирует токен через Google tokeninfo API и действует в зависимости от состояния пользователя.'),

  captionFig('Рисунок 3.3 — Поток аутентификации через Google OAuth (Mermaid)'),
  ...codeBlock([
    'sequenceDiagram',
    '    participant B as Браузер',
    '    participant G as Google',
    '    participant BE as Backend',
    '    participant DB as PostgreSQL',
    '',
    '    B->>G: Google Sign-In',
    '    G-->>B: id_token',
    '    B->>BE: POST /api/auth/google {token}',
    '    BE->>G: Верификация id_token',
    '    G-->>BE: {email, name}',
    '    BE->>DB: findByEmail()',
    '    alt Пользователь активен',
    '        BE-->>B: 200 {jwt}',
    '    else Новый пользователь',
    '        BE->>DB: INSERT registration_requests (PENDING)',
    '        BE-->>B: 403 "Account pending"',
    '    else Отключён',
    '        BE-->>B: 403 "Account disabled"',
    '    end',
  ]),

  h2('3.4 Поток резервного копирования и восстановления'),
  captionFig('Рисунок 3.4 — Последовательность backup/restore (Mermaid)'),
  ...codeBlock([
    'sequenceDiagram',
    '    participant Admin as Администратор',
    '    participant BE as Backend',
    '    participant DB as PostgreSQL',
    '',
    '    Admin->>BE: GET /api/admin/backup',
    '    loop Для каждого пользователя',
    '        BE->>DB: invoices, expenses, driver_shifts, cash',
    '        DB-->>BE: данные',
    '        BE->>BE: JsonIO.serialize(AppData)',
    '    end',
    '    BE-->>Admin: JSON [{email, passwordHash, role, data}]',
    '',
    '    Admin->>BE: POST /api/admin/restore [массив]',
    '    loop Для каждой записи',
    '        BE->>DB: findByEmail()',
    '        alt Пользователь не найден',
    '            BE->>DB: createFull() — создать пользователя',
    '        end',
    '        BE->>DB: clearAll() — удалить текущие данные',
    '        BE->>DB: Вставить данные из backup',
    '        BE->>DB: deleteByEmail() — удалить pending requests',
    '    end',
    '    BE-->>Admin: {restored: N, skipped: M}',
  ]),

  h2('3.5 Docker-инфраструктура'),
  captionFig('Рисунок 3.5 — Docker Compose инфраструктура (Mermaid)'),
  ...codeBlock([
    'graph TD',
    '    subgraph docker-network["Docker internal network"]',
    '        postgres["postgres\\nimage: postgres:16\\nport: 5432 (internal)\\nvolume: pgdata"]',
    '        backend["backend\\nbuild: ./backend\\nport: 8080 (internal)\\ndepends: postgres"]',
    '        frontend["frontend\\nbuild: ./frontend\\nport: 80 (public)\\ndepends: backend"]',
    '    end',
    '    User -->|":80"| frontend',
    '    frontend -->|"proxy_pass :8080"| backend',
    '    backend -->|"jdbc :5432"| postgres',
  ]),

  // ──────────────────────────────────────────────────────────────────────────
  // ГЛАВА 4
  // ──────────────────────────────────────────────────────────────────────────
  h1('4. Структура репозитория'),

  h2('4.1 Дерево директорий'),
  ...codeBlock([
    'BillsCalculatorFullStack/',
    '├── backend/',
    '│   └── billscalculatorbackend/',
    '│       ├── src/main/java/com/example/billscalculatorbackend/',
    '│       │   ├── BillscalculatorbackendApplication.java',
    '│       │   ├── DataInitializer.java',
    '│       │   ├── config/',
    '│       │   │   ├── JwtFilter.java',
    '│       │   │   ├── JwtService.java',
    '│       │   │   └── SecurityConfig.java',
    '│       │   ├── controller/',
    '│       │   │   ├── AdminController.java',
    '│       │   │   ├── AuthController.java',
    '│       │   │   ├── BaseController.java',
    '│       │   │   ├── CashController.java',
    '│       │   │   ├── DriverController.java',
    '│       │   │   ├── ExpenseController.java',
    '│       │   │   ├── FakturaController.java',
    '│       │   │   ├── HotovostController.java',
    '│       │   │   ├── InvoiceController.java',
    '│       │   │   ├── IoController.java',
    '│       │   │   ├── ProfileController.java',
    '│       │   │   ├── ReportController.java',
    '│       │   │   ├── RouteController.java',
    '│       │   │   └── VydajController.java',
    '│       │   ├── dto/',
    '│       │   ├── model/',
    '│       │   ├── repository/',
    '│       │   ├── service/',
    '│       │   └── util/',
    '│       ├── Dockerfile',
    '│       └── pom.xml',
    '├── frontend/',
    '│   ├── src/',
    '│   │   ├── api/',
    '│   │   ├── components/',
    '│   │   ├── context/',
    '│   │   ├── hooks/',
    '│   │   ├── i18n/',
    '│   │   ├── pages/',
    '│   │   ├── types/',
    '│   │   └── utils/',
    '│   ├── Dockerfile',
    '│   ├── nginx.conf',
    '│   └── package.json',
    '├── docs/',
    '│   └── private/          # .gitignore — OAuth credentials',
    '├── docker-compose.yml',
    '├── .env                  # .gitignore — секреты',
    '└── README.md',
  ]),

  h2('4.2 Назначение ключевых файлов'),
  captionTbl('Таблица 4.1 — Ключевые файлы проекта'),
  tbl(
    ['Файл', 'Назначение'],
    [
      ['docker-compose.yml', 'Оркестрация контейнеров postgres, backend, frontend'],
      ['.env', 'Переменные окружения (секреты). Не коммитится в git'],
      ['backend/.../SecurityConfig.java', 'Spring Security: маршруты, CORS, JWT фильтр, stateless сессии'],
      ['backend/.../JwtFilter.java', 'OncePerRequestFilter — перехват и верификация JWT'],
      ['backend/.../JwtService.java', 'Генерация и валидация JWT (HS256)'],
      ['backend/.../JsonIO.java', 'Ручная сериализация/десериализация данных пользователя для export/import/backup'],
      ['backend/.../DataInitializer.java', 'Создаёт admin-пользователя при первом запуске если users пуст'],
      ['frontend/nginx.conf', 'SPA fallback (try_files), proxy_pass /api/ → backend:8080'],
      ['frontend/src/context/AuthContext.tsx', 'Глобальный контекст: token, login(), logout()'],
      ['frontend/src/api/client.ts', 'Axios instance с JWT interceptor и обработкой 401'],
      ['frontend/src/App.tsx', 'Маршрутизация React Router с lang-префиксом и LangPrivateRoute'],
      ['frontend/src/utils/date.ts', 'fmtDate() и fmtDateTime() — форматирование дат в DD.MM.YYYY'],
      ['frontend/src/hooks/useSortable.ts', 'Хук клиентской сортировки таблиц — useSortable<T>()'],
    ],
    [3500, 5500]
  ),

  // ──────────────────────────────────────────────────────────────────────────
  // ГЛАВА 5
  // ──────────────────────────────────────────────────────────────────────────
  h1('5. Backend'),

  h2('5.1 Слои приложения'),
  ...codeBlock([
    'HTTP Request',
    '    ↓',
    'Nginx proxy_pass',
    '    ↓',
    'JwtFilter (OncePerRequestFilter)',
    '    ↓',
    'Spring Security FilterChain',
    '    ↓',
    'Controller (@RestController)',
    '    ↓',
    'Service (@Service, @Transactional)',
    '    ↓',
    'Repository (JpaRepository)',
    '    ↓',
    'PostgreSQL (Hibernate / JPA)',
  ]),

  h2('5.2 Конфигурация безопасности (пакет config)'),

  h3('5.2.1 JwtService'),
  body('Отвечает за генерацию и валидацию JWT-токенов. Алгоритм подписи: HS256. Секрет читается из переменной окружения JWT_SECRET через application.properties. Срок действия токена задаётся там же. Предоставляет методы: generateToken(UserDetails), validateToken(String), extractUsername(String).'),

  h3('5.2.2 JwtFilter'),
  body('Наследует OncePerRequestFilter. Для каждого запроса извлекает заголовок Authorization, проверяет наличие схемы Bearer, передаёт токен в JwtService.validateToken(). При успешной валидации устанавливает UsernamePasswordAuthenticationToken в SecurityContextHolder. Публичные пути (/api/auth/**) не обрабатываются.'),

  h3('5.2.3 SecurityConfig'),
  body('Конфигурирует Spring Security Filter Chain:'),
  bullet('Сессии: STATELESS (JWT)'),
  bullet('CSRF: отключён'),
  bullet('Публичные маршруты: /api/auth/**'),
  bullet('CORS: разрешены все origins (*) — требует ужесточения до конкретного домена перед production'),
  bullet('Все остальные маршруты требуют аутентификации'),
  bullet('Маршруты /api/admin/** требуют роли ADMIN (проверка через @PreAuthorize или в контроллере)'),

  h2('5.3 Модели данных (пакет model)'),

  captionTbl('Таблица 5.1 — JPA-сущности'),
  tbl(
    ['Класс', 'Таблица БД', 'Описание', 'Ключевые поля'],
    [
      ['User', 'users', 'Пользователь системы', 'id, email, password (nullable), role, enabled, createdAt'],
      ['Invoice', 'faktury', 'Выставленный счёт', 'id, name, amount, paymentType, status, date, items, user'],
      ['InvoiceItem', 'polozky', 'Позиция счёта', 'id, name, quantity, unitPrice, vatPercent, totalPrice, invoice'],
      ['Expense', 'vydaje', 'Расход', 'id, name, amount, date, user'],
      ['DriverShift', 'driver_shifts', 'Смена водителя', 'id, driverName, start, end, kmStart, kmEnd, hourlyRate, user'],
      ['Cash', 'hotovost', 'Наличные по номиналам', 'id, count5000..count1, user'],
      ['RegistrationRequest', 'registration_requests', 'Заявка на регистрацию', 'id, email, passwordHash, status, createdAt'],
      ['PasswordResetToken', 'password_reset_tokens', 'Токен сброса пароля', 'id, token, email, expiresAt'],
    ],
    [1800, 1800, 2200, 3400]
  ),

  body('Класс AppData — не JPA-сущность. Используется исключительно как in-memory контейнер при сериализации/десериализации данных пользователя (export/import/backup). Содержит поля: List<Invoice> invoices, List<Expense> expenses, List<DriverShift> driverShifts, Cash cash.'),

  h3('Важные особенности модели User'),
  bullet('Поле password имеет аннотацию @Column(nullable = false), однако пользователи, зарегистрированные через Google OAuth, могут иметь null в этом поле. Это несоответствие задокументировано в разделе 12 (Технический долг).'),
  bullet('Поле role — enum Role {ADMIN, USER}. Хранится как строка через @Enumerated(EnumType.STRING).'),
  bullet('Флаг enabled определяет возможность входа. При enabled=false логин отклоняется с 403.'),

  h3('Важные особенности модели Invoice'),
  bullet('Связь с InvoiceItem через @OneToMany с @CascadeType.ALL — удаление счёта удаляет все его позиции.'),
  bullet('PaymentType: HOTOVOST (наличные), PREVOD (перевод).'),
  bullet('InvoiceStatus: NESPLNENA (не оплачен), SPLNENA (оплачен).'),

  h2('5.4 Репозитории (пакет repository)'),
  body('Все репозитории наследуют JpaRepository<T, Long>. Кастомные методы по соглашению именования Spring Data:'),

  captionTbl('Таблица 5.2 — Кастомные методы репозиториев'),
  tbl(
    ['Репозиторий', 'Ключевые методы', 'Примечания'],
    [
      ['UserRepository', 'findByEmail, existsByEmail', ''],
      ['InvoiceRepository', 'findByUserWithItems (JOIN FETCH), deleteByUser', 'JOIN FETCH предотвращает N+1 при загрузке позиций'],
      ['ExpenseRepository', 'findByUser, deleteByUser', ''],
      ['DriverShiftRepository', 'findByUserOrderByStartDesc, deleteByUser', ''],
      ['CashRepository', 'findByUser, deleteByUser', ''],
      ['RegistrationRequestRepository', 'existsByEmailAndStatus, findByStatusOrderByCreatedAtDesc, deleteByEmail', 'deleteByEmail требует @Transactional'],
      ['PasswordResetTokenRepository', 'findByToken, deleteByEmail', 'deleteByEmail требует @Transactional — исправлено'],
    ],
    [2500, 3500, 3000]
  ),

  h2('5.5 Сервисы (пакет service)'),

  h3('5.5.1 IoService'),
  body('Центральный сервис работы с данными пользователя. Используется для export/import/backup/restore:'),
  bullet('buildAppData(User) — собирает все данные пользователя в объект AppData'),
  bullet('exportJson(User) — сериализует через JsonIO.serialize()'),
  bullet('importJson(User, String) — десериализует JSON и заменяет данные пользователя'),
  bullet('replaceAllData(User, AppData) — транзакционная замена: clearAll() + вставка новых данных'),
  bullet('clearAll(User) — удаляет invoices, expenses, driver_shifts, cash для пользователя'),

  h3('5.5.2 UserService'),
  bullet('create(email, encodedPassword, role) — стандартное создание пользователя (enabled=true)'),
  bullet('createFull(email, passwordHash, role, enabled) — используется при restore backup, позволяет задать все поля явно'),
  bullet('findByEmail(String) — возвращает null если не найден (не Optional — потенциальный источник NPE)'),
  bullet('deleteById(Long) — удаление без cascade-очистки данных; вызывается только из AdminController после явного clearAll()'),

  h3('5.5.3 EmailService'),
  body('Отправляет письма через Gmail SMTP (порт 587, TLS). Используется только для сброса пароля: sendPasswordResetEmail(email, token). Credentials (MAIL_USERNAME, MAIL_PASSWORD) берутся из .env.'),

  h3('5.5.4 ReportService'),
  body('Агрегирует данные пользователя для формирования отчёта: сводка по инвойсам, расходам, сменам водителей. Разбивка по месяцам. Результат передаётся в PdfExporter.'),

  h3('5.5.5 RouteService'),
  body('Принимает список адресов, геокодирует их через GeocodingHelper (Nominatim API), затем передаёт координаты в RouteOptimizer. RouteOptimizer реализует алгоритм ближайшего соседа (nearest-neighbour) для задачи коммивояжёра (TSP). Результат содержит упорядоченный список точек и расстояния между ними.'),

  h3('5.5.6 PdfParserService'),
  body('Парсит PDF-файлы счетов чешского формата через Apache PDFBox (PdfParser.parse()). Извлекает структурированные данные: наименование клиента, позиции, суммы, даты. Результат конвертируется в объект Invoice.'),

  h2('5.6 Контроллеры (пакет controller)'),

  captionTbl('Таблица 5.3 — REST-контроллеры'),
  tbl(
    ['Контроллер', 'Базовый путь', 'Авторизация', 'Назначение'],
    [
      ['AuthController', '/api/auth', 'Публичный', 'Логин, регистрация, Google OAuth, reset password'],
      ['AdminController', '/api/admin', 'Только ADMIN', 'Пользователи, backup, restore'],
      ['ProfileController', '/api/profile', 'Авторизованный', 'Профиль, смена пароля'],
      ['InvoiceController', '/api/invoices', 'Авторизованный', 'CRUD счетов (английские имена)'],
      ['FakturaController', '/api/faktury', 'Авторизованный', 'CRUD счетов (чешские имена, legacy)'],
      ['ExpenseController', '/api/expenses', 'Авторизованный', 'CRUD расходов (английские имена)'],
      ['VydajController', '/api/vydaje', 'Авторизованный', 'CRUD расходов (чешские имена, legacy)'],
      ['DriverController', '/api/driver', 'Авторизованный', 'CRUD смен водителей'],
      ['CashController', '/api/cash', 'Авторизованный', 'Наличные средства'],
      ['HotovostController', '/api/hotovost', 'Авторизованный', 'Наличные (чешские имена, legacy)'],
      ['IoController', '/api/io', 'Авторизованный', 'Экспорт, импорт, очистка данных пользователя'],
      ['ReportController', '/api/report', 'Авторизованный', 'Генерация PDF-отчёта'],
      ['RouteController', '/api/routes', 'Авторизованный', 'Расчёт оптимального маршрута'],
    ],
    [2500, 2000, 1800, 3700]
  ),

  body('Замечание об именовании: в кодовой базе существует параллельная пара контроллеров FakturaController/InvoiceController и VydajController/ExpenseController. Это следствие рефакторинга с чешского на английские имена. Фронтенд использует оба набора путей. Рекомендуется унификация (см. раздел 12).'),

  body('Все защищённые контроллеры получают текущего пользователя следующим образом:'),
  ...codeBlock([
    '@GetMapping',
    'public ResponseEntity<?> getData(',
    '    @AuthenticationPrincipal UserDetails userDetails) {',
    '    User user = userService.findByEmail(userDetails.getUsername());',
    '    // работа с данными пользователя',
    '}',
  ]),

  h2('5.7 Утилиты (пакет util)'),

  h3('5.7.1 JsonIO'),
  body('Ручная реализация сериализации/десериализации данных пользователя в JSON без использования Jackson. Исторически создан для совместимости с форматом Android-приложения. Содержит собственные методы парсинга строк: extractArray(), splitObjects(), strField(), doubleField(), intField().'),
  body('Риск: парсер уязвим к нестандартным значениям строк. Присутствие символов " или { внутри значений полей может привести к некорректному результату. Рекомендуется заменить на Jackson ObjectMapper (см. раздел 12).'),

  h3('5.7.2 PdfExporter'),
  body('Генерирует PDF-отчёты. Использует мультиязычные строки через интерфейс ReportStrings с реализациями CzechReportStrings, EnglishReportStrings, RussianReportStrings, UkrainianReportStrings. Язык определяется параметром запроса.'),

  h3('5.7.3 GeocodingHelper'),
  body('Отправляет HTTP-запросы к Nominatim (OpenStreetMap) для геокодирования адресов. Результаты не кэшируются — каждый вызов RouteController генерирует N внешних HTTP-запросов. При высокой нагрузке или недоступности Nominatim маршрут не строится.'),

  h3('5.7.4 DataInitializer'),
  body('CommandLineRunner, выполняемый при старте приложения. Если таблица users пуста, создаёт администратора с credentials из application.properties (переменные ADMIN_EMAIL, ADMIN_PASSWORD). Обеспечивает первоначальную настройку системы без ручного вмешательства в БД.'),

  // ──────────────────────────────────────────────────────────────────────────
  // ГЛАВА 6
  // ──────────────────────────────────────────────────────────────────────────
  h1('6. Frontend'),

  h2('6.1 Структура приложения'),
  ...codeBlock([
    'frontend/src/',
    '├── api/',
    '│   ├── client.ts          # Axios instance с JWT interceptor',
    '│   ├── admin.ts           # Управление пользователями и бэкапами',
    '│   ├── driver.ts          # Смены водителей',
    '│   ├── faktury.ts         # Счета (инвойсы)',
    '│   ├── vydaje.ts          # Расходы',
    '│   └── profile.ts         # Профиль пользователя',
    '├── components/',
    '│   ├── Layout.tsx         # Основной layout с Sidebar',
    '│   ├── Sidebar.tsx        # Боковая навигация + переключатель языка',
    '│   ├── Modal.tsx          # Универсальное модальное окно',
    '│   └── SortableTh.tsx     # Заголовок сортируемой колонки таблицы',
    '├── context/',
    '│   └── AuthContext.tsx    # Глобальный контекст аутентификации',
    '├── hooks/',
    '│   └── useSortable.ts     # Хук клиентской сортировки таблиц',
    '├── i18n/',
    '│   ├── cs.json            # Чешский',
    '│   ├── en.json            # Английский',
    '│   ├── ru.json            # Русский',
    '│   └── ua.json            # Украинский',
    '├── pages/',
    '│   ├── LoginPage.tsx',
    '│   ├── RegisterPage.tsx',
    '│   ├── AdminPage.tsx',
    '│   ├── ProfilePage.tsx',
    '│   ├── FakturyPage.tsx    # Управление счетами',
    '│   ├── VydajePage.tsx     # Управление расходами',
    '│   ├── DriverPage.tsx     # Смены водителей',
    '│   ├── CashPage.tsx       # Наличные средства',
    '│   ├── ReportPage.tsx     # Отчёты',
    '│   ├── RoutePage.tsx      # Маршруты',
    '│   └── IoPage.tsx         # Импорт / экспорт',
    '├── types/',
    '│   ├── driver.ts',
    '│   ├── faktura.ts',
    '│   └── vydaj.ts',
    '└── utils/',
    '    └── date.ts            # fmtDate, fmtDateTime → DD.MM.YYYY',
  ]),

  h2('6.2 Маршрутизация'),
  body('Приложение использует URL-based локализацию. Каждый защищённый маршрут содержит lang-префикс в URL. Компонент LangPrivateRoute читает :lang из URL, применяет язык через i18n.changeLanguage() и проверяет аутентификацию.'),

  captionTbl('Таблица 6.1 — Маршруты React Router'),
  tbl(
    ['URL', 'Компонент', 'Доступ'],
    [
      ['/login', 'LoginPage', 'Публичный'],
      ['/register', 'RegisterPage', 'Публичный'],
      ['/:lang/register', 'RegisterPage', 'Публичный (с lang-параметром)'],
      ['/:lang/faktury', 'FakturyPage', 'Авторизованный'],
      ['/:lang/vydaje', 'VydajePage', 'Авторизованный'],
      ['/:lang/driver', 'DriverPage', 'Авторизованный'],
      ['/:lang/cash', 'CashPage', 'Авторизованный'],
      ['/:lang/report', 'ReportPage', 'Авторизованный'],
      ['/:lang/routes', 'RoutePage', 'Авторизованный'],
      ['/:lang/io', 'IoPage', 'Авторизованный'],
      ['/:lang/admin', 'AdminPage', 'Только ADMIN'],
      ['/:lang/profile', 'ProfilePage', 'Авторизованный'],
      ['/faktury', 'Redirect → /:lang/faktury', 'Редирект'],
    ],
    [2500, 2500, 4000]
  ),

  body('Переключение языка обновляет URL: pathname.replace("/{lang}/", "/{newLang}/"). Текущий язык сохраняется в localStorage для восстановления при следующем визите.'),

  h2('6.3 Контекст аутентификации'),
  body('AuthContext предоставляет глобальное состояние через React Context:'),
  bullet('token — строка JWT из localStorage'),
  bullet('login(token: string) — сохраняет токен в localStorage и обновляет состояние'),
  bullet('logout() — очищает токен, перенаправляет на /login'),
  body('Axios instance в client.ts добавляет Authorization: Bearer <token> к каждому запросу через request interceptor. Response interceptor перехватывает 401 и вызывает logout().'),

  h2('6.4 Кастомные хуки'),

  h3('6.4.1 useSortable<T>'),
  body('Реализует клиентскую сортировку массива данных. Принимает: items (массив), defaultKey (ключ по умолчанию), defaultDir (направление по умолчанию). Возвращает: sorted (отсортированный массив), sortKey, dir, sortBy (функция переключения). Сортировка использует String.localeCompare с опцией {numeric: true, sensitivity: "base"}.'),
  body('Применяется на страницах: FakturyPage, VydajePage, DriverPage. SortableTh — компонент заголовка таблицы, отображающий стрелки направления сортировки.'),

  h2('6.5 Ключевые страницы'),

  h3('6.5.1 FakturyPage (счета)'),
  bullet('Список счетов с фильтрацией по клиенту, типу оплаты, статусу, датам, суммам'),
  bullet('Раскрываемые строки (expand) для просмотра позиций счёта'),
  bullet('Клиентская сортировка по всем колонкам через useSortable'),
  bullet('Импорт счетов из PDF (POST /api/invoices/import-pdf)'),
  bullet('Создание и редактирование счёта через модальное окно'),
  bullet('Расчёт итогов: сумма без НДС, НДС, итого'),

  h3('6.5.2 AdminPage (администрирование)'),
  bullet('Таблица пользователей с поиском и фильтрами по роли и статусу'),
  bullet('Раздел pending registration requests (Approve / Reject)'),
  bullet('Download Backup: скачивает файл backup_YYYY-MM-DD_HH-MM.json'),
  bullet('Restore Backup: загрузка JSON → confirm dialog → POST /api/admin/restore'),
  bullet('Результат restore отображается inline: "Restored: N users, skipped: M"'),

  h3('6.5.3 DriverPage (смены водителей)'),
  bullet('Таблица смен с сортировкой (дата начала desc по умолчанию)'),
  bullet('Расчёт заработка = (kmEnd - kmStart) и totalHours × hourlyRate'),
  bullet('Фильтрация по имени водителя и периоду'),

  h3('6.5.4 ProfilePage (профиль)'),
  bullet('Отображение email, роли, даты создания'),
  bullet('Секция смены пароля отображается только если profile.hasPassword === true'),
  bullet('Пользователи Google OAuth не видят форму смены пароля'),

  h3('6.5.5 RegisterPage (регистрация)'),
  bullet('Поддерживает lang-параметр из URL и переключатель языка'),
  bullet('После отправки заявки отображает экран ожидания одобрения'),
  bullet('Если при входе через Google получен 403 "Account pending", перенаправляет на этот экран'),

  h2('6.6 Интернационализация'),
  body('Поддерживаются 4 языка: чешский (cs), английский (en), русский (ru), украинский (ua). Файлы переводов расположены в src/i18n/. Переключение языка меняет URL и вызывает i18n.changeLanguage(). Все строки интерфейса вынесены в ключи i18n.'),

  // ──────────────────────────────────────────────────────────────────────────
  // ГЛАВА 7
  // ──────────────────────────────────────────────────────────────────────────
  h1('7. База данных'),

  h2('7.1 Описание таблиц'),
  captionTbl('Таблица 7.1 — Таблицы базы данных bills_calculator'),
  tbl(
    ['Таблица', 'Назначение', 'Ключевые поля'],
    [
      ['users', 'Пользователи системы', 'id, email (unique), password (nullable), role, enabled, created_at'],
      ['faktury', 'Выставленные счета', 'id, name, amount, payment_type, status, date, user_id (FK)'],
      ['polozky', 'Позиции счетов', 'id, name, quantity, unit_price, unit_price_no_vat, price, vat_percent, vat_amount, total_price, invoice_id (FK)'],
      ['vydaje', 'Расходы', 'id, name, amount, date, user_id (FK)'],
      ['driver_shifts', 'Смены водителей', 'id, driver_name, start, end, km_start, km_end, hourly_rate, user_id (FK)'],
      ['hotovost', 'Наличные по номиналам', 'id, count_5000..count_1, user_id (FK, unique)'],
      ['registration_requests', 'Заявки на регистрацию', 'id, email, password_hash, status (PENDING/APPROVED/REJECTED), created_at'],
      ['password_reset_tokens', 'Токены сброса пароля', 'id, token, email, expires_at'],
    ],
    [2000, 2500, 5500]
  ),

  h2('7.2 ER-диаграмма'),
  captionFig('Рисунок 7.1 — ER-диаграмма базы данных (Mermaid)'),
  ...codeBlock([
    'erDiagram',
    '    users {',
    '        bigint id PK',
    '        varchar email UK',
    '        varchar password "nullable"',
    '        varchar role',
    '        boolean enabled',
    '        timestamp created_at',
    '    }',
    '    faktury {',
    '        bigint id PK',
    '        varchar name',
    '        numeric amount',
    '        varchar payment_type',
    '        varchar status',
    '        date date',
    '        bigint user_id FK',
    '    }',
    '    polozky {',
    '        bigint id PK',
    '        varchar name',
    '        int quantity',
    '        numeric unit_price',
    '        numeric unit_price_no_vat',
    '        numeric vat_percent',
    '        numeric vat_amount',
    '        numeric total_price',
    '        bigint invoice_id FK',
    '    }',
    '    vydaje {',
    '        bigint id PK',
    '        varchar name',
    '        numeric amount',
    '        date date',
    '        bigint user_id FK',
    '    }',
    '    driver_shifts {',
    '        bigint id PK',
    '        varchar driver_name',
    '        timestamp start',
    '        timestamp end',
    '        int km_start',
    '        int km_end',
    '        numeric hourly_rate',
    '        bigint user_id FK',
    '    }',
    '    hotovost {',
    '        bigint id PK',
    '        int count_5000',
    '        int count_1',
    '        bigint user_id FK UK',
    '    }',
    '    registration_requests {',
    '        bigint id PK',
    '        varchar email',
    '        varchar password_hash',
    '        varchar status',
    '        timestamp created_at',
    '    }',
    '    password_reset_tokens {',
    '        bigint id PK',
    '        varchar token UK',
    '        varchar email',
    '        timestamp expires_at',
    '    }',
    '',
    '    users ||--o{ faktury : "владеет"',
    '    users ||--o{ vydaje : "владеет"',
    '    users ||--o{ driver_shifts : "владеет"',
    '    users ||--o| hotovost : "владеет (1:1)"',
    '    faktury ||--o{ polozky : "содержит"',
  ]),

  h2('7.3 Связи и каскадные операции'),
  captionTbl('Таблица 7.2 — Каскадные операции'),
  tbl(
    ['Связь', 'Тип', 'Cascade', 'Поведение при удалении'],
    [
      ['users → faktury', '1:N', 'Нет в JPA', 'IoService.clearAll() вызывает deleteByUser() явно'],
      ['users → vydaje', '1:N', 'Нет в JPA', 'IoService.clearAll() вызывает deleteByUser() явно'],
      ['users → driver_shifts', '1:N', 'Нет в JPA', 'IoService.clearAll() вызывает deleteByUser() явно'],
      ['users → hotovost', '1:1', 'Нет в JPA', 'IoService.clearAll() вызывает deleteByUser() явно'],
      ['faktury → polozky', '1:N', 'CascadeType.ALL', 'Удаление Invoice удаляет все InvoiceItem автоматически'],
    ],
    [2200, 1400, 1600, 4800]
  ),

  body('Важно: каскадного удаления на уровне БД (ON DELETE CASCADE) нет. Вся очистка данных при удалении пользователя выполняется явно в AdminController: сначала IoService.clearAll(user), затем deleteByEmail() для registration_requests и password_reset_tokens, затем userService.deleteById(id).'),

  h2('7.4 Миграции'),
  body('Схема базы данных управляется через Hibernate DDL auto (предположительно create-drop или update в зависимости от настройки). Отдельного инструмента миграций (Flyway, Liquibase) нет. Это является техническим долгом: в production окружении изменения схемы невозможно применить без потери данных или ручного вмешательства. Рекомендуется добавить Flyway (см. раздел 12).'),

  // ──────────────────────────────────────────────────────────────────────────
  // ГЛАВА 8
  // ──────────────────────────────────────────────────────────────────────────
  h1('8. REST API'),

  h2('8.1 Аутентификация'),
  captionTbl('Таблица 8.1 — Эндпоинты аутентификации'),
  tbl(
    ['Метод', 'URL', 'Авторизация', 'Описание'],
    [
      ['POST', '/api/auth/login', 'Публичный', 'Вход по email/password → JWT'],
      ['POST', '/api/auth/register', 'Публичный', 'Создание заявки на регистрацию (status=PENDING)'],
      ['POST', '/api/auth/google', 'Публичный', 'Вход через Google id_token'],
      ['POST', '/api/auth/forgot-password', 'Публичный', 'Отправка письма сброса пароля'],
      ['POST', '/api/auth/reset-password', 'Публичный', 'Сброс пароля по токену'],
    ],
    [800, 2500, 1600, 5100]
  ),

  h2('8.2 Профиль'),
  captionTbl('Таблица 8.2 — Эндпоинты профиля'),
  tbl(
    ['Метод', 'URL', 'Авторизация', 'Описание'],
    [
      ['GET', '/api/profile', 'Авторизованный', 'Данные профиля: email, role, createdAt, hasPassword'],
      ['PUT', '/api/profile/password', 'Авторизованный', 'Смена пароля (oldPassword, newPassword)'],
    ],
    [800, 2000, 1600, 5600]
  ),

  h2('8.3 Администрирование'),
  captionTbl('Таблица 8.3 — Эндпоинты администрирования'),
  tbl(
    ['Метод', 'URL', 'Авторизация', 'Описание'],
    [
      ['GET', '/api/admin/users', 'ADMIN', 'Список всех пользователей'],
      ['GET', '/api/admin/requests', 'ADMIN', 'Список pending заявок на регистрацию'],
      ['POST', '/api/admin/requests/{id}/approve', 'ADMIN', 'Одобрить заявку → создать пользователя'],
      ['POST', '/api/admin/requests/{id}/reject', 'ADMIN', 'Отклонить заявку (status=REJECTED)'],
      ['DELETE', '/api/admin/users/{id}', 'ADMIN', 'Удалить пользователя и все его данные'],
      ['PUT', '/api/admin/users/{id}/toggle', 'ADMIN', 'Включить / отключить пользователя'],
      ['GET', '/api/admin/backup', 'ADMIN', 'Скачать JSON-бэкап всех пользователей'],
      ['POST', '/api/admin/restore', 'ADMIN', 'Восстановить из JSON-бэкапа'],
    ],
    [800, 2800, 1200, 5200]
  ),

  h2('8.4 Счета (Invoice)'),
  captionTbl('Таблица 8.4 — Эндпоинты управления счетами'),
  tbl(
    ['Метод', 'URL', 'Описание'],
    [
      ['GET', '/api/invoices', 'Список счетов с фильтрацией (name, paymentType, status, dateFrom, dateTo, amountMin, amountMax)'],
      ['POST', '/api/invoices', 'Создать счёт'],
      ['PUT', '/api/invoices/{id}', 'Обновить счёт'],
      ['DELETE', '/api/invoices/{id}', 'Удалить счёт (cascade удаляет позиции)'],
      ['POST', '/api/invoices/import-pdf', 'Импортировать счёт из PDF (multipart/form-data)'],
    ],
    [800, 2200, 7000]
  ),

  h2('8.5 Расходы, Смены водителей, Наличные'),
  captionTbl('Таблица 8.5 — Прочие CRUD-эндпоинты'),
  tbl(
    ['Ресурс', 'Базовый путь', 'Операции'],
    [
      ['Расходы', '/api/expenses', 'GET (фильтры), POST, PUT/{id}, DELETE/{id}'],
      ['Смены водителей', '/api/driver', 'GET (фильтры по driverName, dateFrom, dateTo), POST, PUT/{id}, DELETE/{id}'],
      ['Наличные', '/api/cash', 'GET (текущий state), PUT (обновить все номиналы)'],
    ],
    [2000, 2500, 5500]
  ),

  h2('8.6 Импорт / Экспорт / Маршрут / Отчёт'),
  captionTbl('Таблица 8.6 — Дополнительные эндпоинты'),
  tbl(
    ['Метод', 'URL', 'Описание'],
    [
      ['GET', '/api/io/export', 'Скачать JSON с данными текущего пользователя'],
      ['POST', '/api/io/import', 'Импортировать JSON (заменяет данные текущего пользователя)'],
      ['DELETE', '/api/io/clear', 'Удалить все данные текущего пользователя'],
      ['POST', '/api/routes/calculate', 'Рассчитать оптимальный маршрут (список адресов)'],
      ['GET', '/api/report', 'Получить агрегированные данные отчёта'],
      ['GET', '/api/report/pdf', 'Скачать PDF-отчёт (параметр lang: cs/en/ru/ua)'],
    ],
    [800, 2200, 7000]
  ),

  // ──────────────────────────────────────────────────────────────────────────
  // ГЛАВА 9
  // ──────────────────────────────────────────────────────────────────────────
  h1('9. Docker и инфраструктура'),

  h2('9.1 Сервисы Docker Compose'),
  captionTbl('Таблица 9.1 — Docker-сервисы'),
  tbl(
    ['Сервис', 'Image/Build', 'Порты', 'Зависимости', 'Назначение'],
    [
      ['postgres', 'postgres:16', '5432 (внутренний)', '—', 'База данных PostgreSQL'],
      ['backend', 'build: ./backend', '8080 (внутренний)', 'postgres (healthcheck)', 'Spring Boot REST API'],
      ['frontend', 'build: ./frontend', '80:80', 'backend', 'Nginx: статика React + proxy API'],
    ],
    [1400, 2000, 1800, 2200, 2600]
  ),

  h2('9.2 Переменные окружения'),
  body('Переменные читаются из файла .env в корне проекта. Файл не коммитится в git (добавлен в .gitignore).'),
  captionTbl('Таблица 9.2 — Переменные окружения'),
  tbl(
    ['Переменная', 'Назначение', 'Пример значения'],
    [
      ['POSTGRES_USER', 'Пользователь PostgreSQL', 'postgres'],
      ['POSTGRES_PASSWORD', 'Пароль PostgreSQL', 'секрет'],
      ['POSTGRES_DB', 'Имя базы данных', 'bills_calculator'],
      ['JWT_SECRET', 'Секрет подписи JWT (min 32 символа)', 'случайная строка'],
      ['JWT_EXPIRATION', 'Срок жизни JWT (мс)', '86400000'],
      ['GOOGLE_CLIENT_ID', 'Client ID Google OAuth', '1013520249642-...'],
      ['VITE_GOOGLE_CLIENT_ID', 'Тот же Client ID для Vite (frontend)', '1013520249642-...'],
      ['MAIL_USERNAME', 'Gmail адрес для отправки писем', 'user@gmail.com'],
      ['MAIL_PASSWORD', 'Gmail App Password (не основной пароль)', 'xxxx xxxx xxxx xxxx'],
      ['APP_BASE_URL', 'Базовый URL для ссылок в письмах', 'http://localhost'],
      ['ADMIN_EMAIL', 'Email первого администратора', 'admin@mail.com'],
      ['ADMIN_PASSWORD', 'Пароль первого администратора', 'секрет'],
    ],
    [3000, 3500, 3500]
  ),

  h2('9.3 Nginx конфигурация'),
  body('Nginx в frontend-контейнере выполняет две задачи: раздаёт собранную React-статику из /usr/share/nginx/html и проксирует все запросы /api/ на backend:8080.'),
  ...codeBlock([
    'server {',
    '    listen 80;',
    '',
    '    location / {',
    '        root /usr/share/nginx/html;',
    '        try_files $uri $uri/ /index.html;  # SPA fallback',
    '    }',
    '',
    '    location /api/ {',
    '        proxy_pass http://backend:8080;',
    '        proxy_set_header Host $host;',
    '        proxy_set_header X-Real-IP $remote_addr;',
    '    }',
    '}',
  ]),

  h2('9.4 Dockerfile — Backend'),
  body('Многоэтапная сборка: Maven-сборка в слое builder, копирование JAR-артефакта в облегчённый runtime образ на основе Eclipse Temurin 21 JRE Alpine.'),
  ...codeBlock([
    'FROM eclipse-temurin:21-jdk-alpine AS builder',
    'WORKDIR /app',
    'COPY mvnw pom.xml ./',
    'COPY .mvn .mvn',
    'RUN chmod +x mvnw && ./mvnw dependency:go-offline -q',
    'COPY src src',
    'RUN ./mvnw package -DskipTests -q',
    '',
    'FROM eclipse-temurin:21-jre-alpine',
    'WORKDIR /app',
    'COPY --from=builder /app/target/*.jar app.jar',
    'ENTRYPOINT ["java", "-jar", "app.jar"]',
  ]),

  h2('9.5 Dockerfile — Frontend'),
  body('Двухэтапная сборка: Node 20 Alpine собирает React-приложение через npm run build, результат копируется в Nginx Alpine образ. nginx.conf копируется для настройки SPA-роутинга и API-проксирования.'),
  ...codeBlock([
    'FROM node:20-alpine AS builder',
    'WORKDIR /app',
    'COPY package*.json ./',
    'RUN npm ci',
    'COPY . .',
    'RUN npm run build',
    '',
    'FROM nginx:alpine',
    'COPY --from=builder /app/dist /usr/share/nginx/html',
    'COPY nginx.conf /etc/nginx/conf.d/default.conf',
  ]),

  h2('9.6 Volumes и сети'),
  bullet('Volume pgdata: именованный volume для данных PostgreSQL. Данные сохраняются между перезапусками контейнеров.'),
  bullet('Сеть: все сервисы находятся в одной Docker-сети, создаваемой автоматически Docker Compose. Backend обращается к postgres по имени хоста postgres, frontend — к backend по имени backend.'),
  bullet('Порты снаружи: доступен только порт 80 (frontend/Nginx). PostgreSQL (5432) и backend (8080) недоступны извне.'),

  // ──────────────────────────────────────────────────────────────────────────
  // ГЛАВА 10
  // ──────────────────────────────────────────────────────────────────────────
  h1('10. Развёртывание'),

  h2('10.1 Локальный запуск через Docker Compose'),
  body('Требования: Docker Desktop установлен и запущен, git clone выполнен.'),

  h3('Шаг 1 — Создать .env файл'),
  ...codeBlock([
    '# Файл .env в корне проекта',
    'POSTGRES_USER=postgres',
    'POSTGRES_PASSWORD=yourpassword',
    'POSTGRES_DB=bills_calculator',
    'JWT_SECRET=your-very-long-random-secret-min-32-chars',
    'JWT_EXPIRATION=86400000',
    'GOOGLE_CLIENT_ID=your-google-client-id',
    'VITE_GOOGLE_CLIENT_ID=your-google-client-id',
    'MAIL_USERNAME=your@gmail.com',
    'MAIL_PASSWORD=abcd efgh ijkl mnop',
    'APP_BASE_URL=http://localhost',
    'ADMIN_EMAIL=admin@yourapp.com',
    'ADMIN_PASSWORD=yourAdminPassword123',
  ]),

  h3('Шаг 2 — Собрать и запустить'),
  ...codeBlock([
    'docker compose up -d --build',
  ]),

  h3('Шаг 3 — Проверить запуск'),
  ...codeBlock([
    'docker compose ps',
    '# Ожидаемый результат: все три контейнера в статусе "running"',
    '',
    '# Проверить логи backend',
    'docker compose logs backend --tail=50',
  ]),

  body('После успешного запуска приложение доступно по адресу http://localhost. Первый вход: email и пароль из переменных ADMIN_EMAIL и ADMIN_PASSWORD.'),

  h2('10.2 Обновление после изменений кода'),
  ...codeBlock([
    '# Пересобрать только frontend (если менялся только frontend)',
    'docker compose up -d --build frontend',
    '',
    '# Пересобрать только backend',
    'docker compose up -d --build backend',
    '',
    '# Пересобрать всё',
    'docker compose up -d --build',
  ]),

  h2('10.3 Настройка Google OAuth'),
  bullet('Создать проект в Google Cloud Console'),
  bullet('Включить Google+ API / People API'),
  bullet('Создать OAuth 2.0 Client ID (тип: Web Application)'),
  bullet('Добавить Authorized JavaScript origins: http://localhost (для dev), https://yourdomain.com (для prod)'),
  bullet('Добавить Authorized redirect URIs (если используется server-side flow)'),
  bullet('Скопировать Client ID в .env как GOOGLE_CLIENT_ID и VITE_GOOGLE_CLIENT_ID'),

  h2('10.4 Настройка Gmail SMTP'),
  bullet('В аккаунте Google включить двухфакторную аутентификацию'),
  bullet('Перейти в раздел «App passwords» (Пароли приложений)'),
  bullet('Создать пароль приложения для категории Mail'),
  bullet('Скопировать 16-символьный код в .env как MAIL_PASSWORD (без пробелов: abcdefghijklmnop)'),
  bullet('Указать email аккаунта в MAIL_USERNAME'),

  h2('10.5 Production-деплой на VPS'),
  body('Для production необходимо выполнить дополнительные шаги:'),

  h3('Настройка HTTPS через Certbot'),
  ...codeBlock([
    '# Установить certbot',
    'apt install certbot python3-certbot-nginx',
    '',
    '# Получить сертификат',
    'certbot --nginx -d yourdomain.com',
    '',
    '# Certbot автоматически изменит nginx.conf для перенаправления HTTP → HTTPS',
  ]),

  h3('Nginx конфигурация для production'),
  body('Необходимо добавить в nginx.conf: listen 443 ssl, ssl_certificate, ssl_certificate_key, redirect с 80 на 443, заголовки безопасности (HSTS, X-Frame-Options, CSP).'),

  h3('Ограничение CORS в production'),
  ...codeBlock([
    '// SecurityConfig.java — заменить allowedOrigins("*") на:',
    'config.setAllowedOrigins(List.of("https://yourdomain.com"));',
  ]),

  h2('10.6 Резервное копирование базы данных'),
  ...codeBlock([
    '# Создать дамп PostgreSQL из контейнера',
    'docker compose exec postgres pg_dump -U postgres bills_calculator > backup_$(date +%Y%m%d).sql',
    '',
    '# Восстановить из дампа',
    'docker compose exec -T postgres psql -U postgres bills_calculator < backup_20260528.sql',
    '',
    '# Альтернатива: использовать встроенный backup приложения',
    '# GET /api/admin/backup  — скачать JSON-бэкап',
    '# POST /api/admin/restore — восстановить из JSON',
  ]),

  h2('10.7 Порядок запуска сервисов'),
  captionFig('Рисунок 10.1 — Последовательность запуска системы (Mermaid)'),
  ...codeBlock([
    'sequenceDiagram',
    '    participant DC as Docker Compose',
    '    participant PG as PostgreSQL',
    '    participant BE as Backend',
    '    participant FE as Frontend/Nginx',
    '',
    '    DC->>PG: Запустить postgres',
    '    PG-->>DC: healthcheck OK',
    '    DC->>BE: Запустить backend (depends_on postgres)',
    '    BE->>PG: Hibernate DDL (create/update schema)',
    '    BE->>BE: DataInitializer — создать admin',
    '    BE-->>DC: Spring Boot started on port 8080',
    '    DC->>FE: Запустить frontend (depends_on backend)',
    '    FE-->>DC: Nginx started on port 80',
  ]),

  // ──────────────────────────────────────────────────────────────────────────
  // ГЛАВА 11
  // ──────────────────────────────────────────────────────────────────────────
  h1('11. Безопасность'),

  h2('11.1 Аутентификация и токены'),
  captionTbl('Таблица 11.1 — Механизмы аутентификации'),
  tbl(
    ['Компонент', 'Реализация', 'Статус'],
    [
      ['Хранение паролей', 'BCrypt (Spring Security PasswordEncoder)', 'Корректно'],
      ['JWT алгоритм', 'HS256', 'Приемлемо; рассмотреть RS256 для масштабирования'],
      ['JWT хранение', 'localStorage браузера', 'Уязвимо к XSS; альтернатива — httpOnly cookie'],
      ['Срок жизни токена', 'Configurable (JWT_EXPIRATION)', 'Корректно; нет refresh tokens'],
      ['Google OAuth верификация', 'Google tokeninfo API', 'Корректно'],
      ['Сброс пароля', 'Временный токен + email (24ч)', 'Корректно'],
    ],
    [2500, 3500, 4000]
  ),

  h2('11.2 Авторизация'),
  bullet('Реализована на уровне Spring Security: все маршруты требуют аутентификации кроме /api/auth/**'),
  bullet('Роли: ADMIN и USER. Администраторские операции (/api/admin/**) проверяются в контроллере'),
  bullet('Изоляция данных: каждый запрос к данным включает условие WHERE user = currentUser — прямой доступ к чужим данным невозможен'),

  h2('11.3 Известные риски'),
  captionTbl('Таблица 11.2 — Известные уязвимости и риски'),
  tbl(
    ['Риск', 'Описание', 'Критичность', 'Рекомендация'],
    [
      ['Нет rate limiting', '/api/auth/login открыт для брутфорса без ограничений числа запросов', 'Высокая', 'Добавить Bucket4j или nginx limit_req_zone'],
      ['CORS *', 'allowedOrigins("*") разрешает запросы с любого домена', 'Высокая (в prod)', 'Ограничить до конкретного домена'],
      ['Нет HTTPS', 'Данные передаются в открытом виде', 'Высокая (в prod)', 'Certbot + Let\'s Encrypt'],
      ['JWT в localStorage', 'Уязвимо к XSS-атакам', 'Средняя', 'Перейти на httpOnly cookie'],
      ['passwordHash в backup', 'BCrypt-хэши в JSON-файле', 'Средняя', 'Исключить пароли из backup или шифровать файл'],
      ['Нет валидации входных данных', 'Отсутствуют проверки длин строк и форматов', 'Средняя', 'Bean Validation (@NotBlank, @Size)'],
      ['XSS', 'React экранирует по умолчанию; рисков в текущей реализации минимально', 'Низкая', 'Мониторинг'],
      ['SQL Injection', 'JPA + параметризованные запросы; риска нет', 'Нет', 'Уже защищено'],
    ],
    [1800, 3000, 1400, 3800]
  ),

  // ──────────────────────────────────────────────────────────────────────────
  // ГЛАВА 12
  // ──────────────────────────────────────────────────────────────────────────
  h1('12. Технический долг'),

  h2('12.1 Критические проблемы'),

  h3('12.1.1 Дублирование контроллеров'),
  body('Существуют параллельные пары: FakturaController (/api/faktury) и InvoiceController (/api/invoices), VydajController (/api/vydaje) и ExpenseController (/api/expenses), HotovostController (/api/hotovost) и CashController (/api/cash). Frontend использует оба набора путей в зависимости от модуля. Необходимо унифицировать на английские пути и удалить чешские варианты.'),

  h3('12.1.2 Ручной JSON парсер (JsonIO)'),
  body('Класс JsonIO реализует сериализацию/десериализацию данных без использования Jackson. Парсер не обрабатывает корректно: экранированные символы внутри строк, числа с разделителем-запятой (европейский формат), вложенные объекты с нестандартными пробелами. Рекомендуется переписать с использованием ObjectMapper из Jackson (уже присутствует как зависимость Spring Boot).'),

  h3('12.1.3 Отсутствие миграций схемы БД'),
  body('Hibernate DDL auto управляет схемой. В production окружении это означает невозможность безопасного обновления без потери данных. Необходимо добавить Flyway или Liquibase и зафиксировать текущую схему как базовую миграцию.'),

  h2('12.2 Проблемы безопасности'),
  bullet('Rate limiting на auth-эндпоинтах: отсутствует. Добавить Bucket4j (в Spring Boot) или nginx limit_req_zone.'),
  bullet('CORS разрешён для всех origins. Ограничить до конкретного домена.'),
  bullet('Нет HTTPS в nginx.conf. Настроить Certbot + Let\'s Encrypt.'),
  bullet('JWT хранится в localStorage. Оценить переход на httpOnly cookie.'),
  bullet('passwordHash включён в JSON-бэкап. Рассмотреть исключение или шифрование.'),

  h2('12.3 Качество кода'),
  bullet('findByEmail() в UserService возвращает null вместо Optional<User>. Существует риск NPE при вызове без проверки.'),
  bullet('GeocodingHelper не кэширует результаты геокодирования. Каждый запрос на построение маршрута генерирует N запросов к внешнему API.'),
  bullet('Нет обработки ошибок при недоступности Nominatim API — RouteController вернёт 500.'),
  bullet('Строки отчётов дублируются в четырёх классах (CzechReportStrings, EnglishReportStrings и т.д.) вместо вынесения в JSON-файлы ресурсов.'),
  bullet('DataInitializer не проверяет корректность ADMIN_PASSWORD (минимальная длина и т.д.).'),

  h2('12.4 Инфраструктура'),
  bullet('Нет CI/CD pipeline. Деплой выполняется вручную.'),
  bullet('Нет автоматических бэкапов PostgreSQL по расписанию.'),
  bullet('Нет мониторинга и алертинга (healthcheck эндпоинт /actuator/health не проверен в конфигурации).'),
  bullet('Нет ограничений размера загружаемых файлов для PDF import (multipart.max-file-size).'),
  bullet('Нет ограничений размера тела запроса для POST /api/admin/restore (большой JSON может вызвать OOM).'),

  // ──────────────────────────────────────────────────────────────────────────
  // ГЛАВА 13
  // ──────────────────────────────────────────────────────────────────────────
  h1('13. Возможности для будущей платформы деплоя'),

  h2('13.1 Анализ переиспользуемых компонентов'),
  body('Планируется разработка платформы управления сервером, предоставляющей веб-панель для создания и управления сайтами, PostgreSQL базами данных, доменами, Docker-контейнерами, SSL-сертификатами, FTP/SFTP доступом и резервными копиями.'),

  captionTbl('Таблица 13.1 — Компоненты для переиспользования'),
  tbl(
    ['Компонент', 'Переиспользование', 'Необходимые изменения'],
    [
      ['Spring Boot + Spring Security + JWT', 'Полностью', 'Добавить refresh tokens, rate limiting'],
      ['Google OAuth', 'Полностью', 'Уже работает — скопировать конфиг'],
      ['Email (сброс пароля)', 'Полностью', 'Добавить шаблоны Thymeleaf'],
      ['Система ролей (ADMIN/USER)', 'Частично', 'Расширить до multi-tenant ролей'],
      ['Backup/Restore архитектура', 'Концепция', 'Переписать для backup отдельных сайтов'],
      ['Docker Compose инфраструктура', 'Частично', 'Динамическое создание compose-файлов'],
      ['React + React Query + i18n', 'Полностью', 'Переиспользовать UI-паттерны'],
      ['Nginx конфигурация', 'Частично', 'Динамическая генерация vhost-конфигов'],
      ['AdminPage как шаблон', 'Концепция', 'Расширить до панели управления'],
      ['useSortable + SortableTh', 'Полностью', 'Как есть'],
      ['fmtDate / fmtDateTime', 'Полностью', 'Как есть'],
    ],
    [2500, 1800, 5700]
  ),

  h2('13.2 Компоненты, требующие переработки'),
  bullet('JsonIO → заменить на Jackson ObjectMapper'),
  bullet('Hibernate DDL auto → Flyway миграции (обязательно для multi-tenant)'),
  bullet('Статическая конфигурация пользователей → динамическое создание tenant-изолированных БД'),
  bullet('Одна БД на всех → один PostgreSQL instance с несколькими схемами или отдельные instances'),

  h2('13.3 Новые сервисы для платформы'),
  captionTbl('Таблица 13.2 — Новые сервисы будущей платформы'),
  tbl(
    ['Сервис', 'Технология', 'Назначение'],
    [
      ['Docker Management Service', 'Docker Java SDK / Docker socket', 'Создание/управление контейнерами программно'],
      ['Domain Manager', 'Nginx Proxy Manager API / certbot CLI', 'Динамические vhost + SSL'],
      ['SSL Service', 'Certbot ACME + Let\'s Encrypt', 'Автоматический выпуск сертификатов'],
      ['Database Provisioner', 'PostgreSQL JDBC / psql CLI', 'Создание БД и пользователей по запросу'],
      ['FTP/SFTP Service', 'vsftpd / sshd в контейнере', 'Файловый доступ к сайтам'],
      ['Backup Scheduler', 'Spring @Scheduled + pg_dump', 'Автоматические бэкапы по cron'],
      ['Deployment Pipeline', 'Git + Docker build', 'CI/CD для пользовательских сайтов'],
    ],
    [2500, 2800, 4700]
  ),

  h2('13.4 Архитектурная дорожная карта'),
  captionFig('Рисунок 13.1 — Эволюция архитектуры (Mermaid)'),
  ...codeBlock([
    'graph TD',
    '    subgraph current["Текущий BillsCalculator (MVP)"]',
    '        A["Spring Boot API"] --> B["PostgreSQL"]',
    '        C["React SPA"] --> D["Nginx"]',
    '        D --> A',
    '    end',
    '',
    '    subgraph future["Будущая платформа деплоя"]',
    '        CP["Control Panel\\n(React + new pages)"]',
    '        API["Platform API\\n(Spring Boot extended)"]',
    '        DM["Docker Manager\\n(new service)"]',
    '        NM["Nginx Manager\\n(certbot + vhost)"]',
    '        DB_P["DB Provisioner\\n(new service)"]',
    '        FTPS["FTP/SFTP\\n(vsftpd container)"]',
    '        SCHED["Backup Scheduler\\n(@Scheduled)"]',
    '        PG["PostgreSQL"]',
    '',
    '        CP --> API',
    '        API --> DM',
    '        API --> NM',
    '        API --> DB_P',
    '        API --> SCHED',
    '        DB_P --> PG',
    '        NM -->|certbot| LETS["Let\'s Encrypt"]',
    '    end',
    '',
    '    current -->|"Эволюция"| future',
  ]),

  h3('Рекомендуемая последовательность разработки платформы'),
  bullet('Этап 1: Добавить Flyway, исправить JsonIO, устранить дублирование контроллеров. Привести MVP к production-ready состоянию.'),
  bullet('Этап 2: Разработать Docker Management Service — программное создание и управление контейнерами через Docker API.'),
  bullet('Этап 3: Разработать Domain + SSL Service — динамическая генерация Nginx vhost и автоматический выпуск сертификатов через certbot.'),
  bullet('Этап 4: Database Provisioner — создание PostgreSQL баз данных и пользователей по запросу из панели управления.'),
  bullet('Этап 5: Deployment Pipeline — загрузка кода пользователя (Git/FTP), сборка Docker-образа, деплой как нового контейнера.'),
  bullet('Этап 6: FTP/SFTP, Backup Scheduler, мониторинг.'),

  // ──────────────────────────────────────────────────────────────────────────
  // ПРИЛОЖЕНИЯ
  // ──────────────────────────────────────────────────────────────────────────
  h1('Приложение А — Полный список переменных окружения'),
  captionTbl('Таблица А.1 — Переменные окружения системы'),
  tbl(
    ['Переменная', 'Обязательная', 'Описание', 'Пример'],
    [
      ['POSTGRES_USER', 'Да', 'Пользователь PostgreSQL', 'postgres'],
      ['POSTGRES_PASSWORD', 'Да', 'Пароль PostgreSQL', 'secret123'],
      ['POSTGRES_DB', 'Да', 'Имя базы данных', 'bills_calculator'],
      ['JWT_SECRET', 'Да', 'Секрет подписи JWT, минимум 32 символа', 'randomStringHere...'],
      ['JWT_EXPIRATION', 'Нет', 'Срок жизни JWT в мс. По умолч.: 86400000 (24ч)', '86400000'],
      ['GOOGLE_CLIENT_ID', 'Нет', 'Google OAuth Client ID (если OAuth не нужен — оставить пустым)', '1013...apps.googleusercontent.com'],
      ['VITE_GOOGLE_CLIENT_ID', 'Нет', 'Тот же Client ID для Vite (frontend build)', '1013...apps.googleusercontent.com'],
      ['MAIL_USERNAME', 'Нет', 'Gmail адрес для SMTP', 'user@gmail.com'],
      ['MAIL_PASSWORD', 'Нет', 'Gmail App Password', 'abcd efgh ijkl mnop'],
      ['APP_BASE_URL', 'Нет', 'Базовый URL для ссылок в письмах', 'https://yourdomain.com'],
      ['ADMIN_EMAIL', 'Да', 'Email первого администратора', 'admin@yourdomain.com'],
      ['ADMIN_PASSWORD', 'Да', 'Пароль первого администратора', 'AdminPass123!'],
    ],
    [2500, 1400, 3100, 3000]
  ),

  h1('Приложение Б — Порты и зависимости'),
  captionTbl('Таблица Б.1 — Порты сервисов'),
  tbl(
    ['Сервис', 'Порт', 'Доступность', 'Описание'],
    [
      ['Nginx (frontend)', '80', 'Публичный', 'Единственная точка входа снаружи'],
      ['Spring Boot (backend)', '8080', 'Только внутри Docker-сети', 'REST API'],
      ['PostgreSQL', '5432', 'Только внутри Docker-сети', 'База данных'],
      ['Gmail SMTP', '587', 'Исходящий от backend', 'Отправка писем'],
      ['Nominatim API', '443 HTTPS', 'Исходящий от backend', 'Геокодирование адресов'],
      ['Google APIs', '443 HTTPS', 'Исходящий от backend и браузера', 'OAuth верификация'],
    ],
    [2000, 1200, 2200, 4600]
  ),

  captionTbl('Таблица Б.2 — Зависимости между сервисами'),
  tbl(
    ['Сервис', 'Зависит от', 'Тип зависимости'],
    [
      ['backend', 'postgres', 'Жёсткая (healthcheck); не запустится без PostgreSQL'],
      ['frontend', 'backend', 'Мягкая (запустится, но API недоступен без backend)'],
      ['backend', 'Gmail SMTP', 'Опциональная (только для сброса пароля)'],
      ['backend', 'Google APIs', 'Опциональная (только для OAuth логина)'],
      ['backend', 'Nominatim', 'Опциональная (только для расчёта маршрутов)'],
    ],
    [1800, 2000, 6200]
  ),

  h1('Приложение В — Быстрый старт'),
  h2('Минимальный набор команд для запуска'),
  ...codeBlock([
    '# 1. Клонировать репозиторий',
    'git clone https://github.com/vovaaa312/BillsCalculatorFullstack.git',
    'cd BillsCalculatorFullstack',
    '',
    '# 2. Создать .env (заменить значения)',
    'cp .env.example .env  # или создать вручную',
    '',
    '# 3. Запустить',
    'docker compose up -d --build',
    '',
    '# 4. Проверить',
    'docker compose ps',
    'docker compose logs backend --tail=30',
    '',
    '# 5. Открыть в браузере',
    '# http://localhost',
    '# Логин: значения ADMIN_EMAIL и ADMIN_PASSWORD из .env',
    '',
    '# Остановить',
    'docker compose down',
    '',
    '# Остановить и удалить данные БД',
    'docker compose down -v',
  ]),

];

// ─── assemble document ───────────────────────────────────────────────────────

const doc = new Document({
  numbering: {
    config: [{
      reference: 'bullet-list',
      levels: [
        {
          level: 0,
          format: 'bullet',
          text: '•',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 720, hanging: 360 } } },
        },
        {
          level: 1,
          format: 'bullet',
          text: '◦',
          alignment: AlignmentType.LEFT,
          style: { paragraph: { indent: { left: 1080, hanging: 360 } } },
        },
      ],
    }],
  },
  styles: {
    default: {
      document: {
        run: { font: FONT, size: SIZE_BODY },
      },
    },
    paragraphStyles: [
      {
        id: 'Heading1',
        name: 'Heading 1',
        basedOn: 'Normal',
        next: 'Normal',
        run: { font: FONT, size: SIZE_H1, bold: true, color: ACCENT },
        paragraph: { spacing: { before: 240, after: 120 } },
      },
      {
        id: 'Heading2',
        name: 'Heading 2',
        basedOn: 'Normal',
        next: 'Normal',
        run: { font: FONT, size: SIZE_H2, bold: true, color: ACCENT },
        paragraph: { spacing: { before: 200, after: 80 } },
      },
      {
        id: 'Heading3',
        name: 'Heading 3',
        basedOn: 'Normal',
        next: 'Normal',
        run: { font: FONT, size: SIZE_H3, bold: true },
        paragraph: { spacing: { before: 160, after: 60 } },
      },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1.18),
            bottom: convertInchesToTwip(0.98),
            left: convertInchesToTwip(1.18),
            right: convertInchesToTwip(0.79),
          },
        },
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ text: 'BillsCalculator — Техническая документация v1.0', font: FONT, size: 18, color: '888888' })],
          })],
        }),
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: 'BillsCalculator — Техническая документация v1.0', font: FONT, size: 18, color: '888888' }),
            ],
          })],
        }),
      },
      children: [
        ...titlePage(),
        ...sections,
      ],
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('BillsCalculator_Technical_Documentation_v1.0.docx', buffer);
console.log('Done: BillsCalculator_Technical_Documentation_v1.0.docx');
