# Гайд: Фреймворк для кастомных воркспейсов

> Документ описывает архитектуру и пошаговую реализацию платформы, позволяющей пользователям создавать собственные рабочие пространства с произвольными типами данных, гибкой системой прав и совместным доступом — без написания нового full-stack проекта.

Дата: 2026-06-21  
Автор: Makarenko Volodymyr

---

## 1. Концепция и терминология

Платформа состоит из четырёх ключевых понятий:

| Понятие | Описание | Пример |
|---|---|---|
| **Workspace** | Изолированное пространство одного пользователя или команды | «Команда продаж», «Личные финансы», «Склад» |
| **ObjectType** | Схема пользовательского типа данных — набор полей и их типов | «Счёт», «Задача», «Клиент», «Инвентарь» |
| **Object** | Конкретная запись одного ObjectType | Счёт №2024-001 от клиента ABC на 15 000 CZK |
| **FieldDefinition** | Описание одного поля внутри ObjectType: имя, тип, обязательность | «Сумма» (NUMBER), «Клиент» (TEXT), «Статус» (SELECT: Новый/Оплачен/Отменён) |

Один пользователь может создать несколько воркспейсов. В каждый воркспейс можно пригласить других пользователей с разными правами.

---

## 2. Система ролей

### 2.1 Глобальные роли (уровень системы)

| Роль | Описание |
|---|---|
| `SUPER_ADMIN` | Разработчик / владелец платформы. Полный доступ ко всем данным, пользователям, бэкапам. Назначается только через БД или DataInitializer. |
| `USER` | Зарегистрированный пользователь. Видит только свои воркспейсы и воркспейсы, в которые приглашён. |

### 2.2 Роли внутри воркспейса (уровень workspace)

| Роль | Описание |
|---|---|
| `WORKSPACE_OWNER` | Создатель воркспейса. Может всё: управлять типами объектов, приглашать/удалять участников, удалить воркспейс. |
| `WORKSPACE_ADMIN` | Приглашённый администратор. Может управлять типами объектов и записями. Не может удалить воркспейс или снять OWNER. |
| `WORKSPACE_MEMBER` | Обычный участник. Только чтение: просматривает объекты и их записи. Ничего не создаёт и не меняет. |

### 2.3 Матрица прав

| Действие | SUPER_ADMIN | OWNER | ADMIN | MEMBER |
|---|---|---|---|---|
| Создать ObjectType | ✅ | ✅ | ✅ | ❌ |
| Редактировать схему ObjectType | ✅ | ✅ | ✅ | ❌ |
| Удалить ObjectType | ✅ | ✅ | ❌ | ❌ |
| Создать/редактировать Object | ✅ | ✅ | ✅ | ❌ |
| Удалить Object | ✅ | ✅ | ✅ | ❌ |
| Просмотр всех данных | ✅ | ✅ (свой WS) | ✅ (свой WS) | ✅ (свой WS) |
| Пригласить участника | ✅ | ✅ | ❌ | ❌ |
| Изменить роль участника | ✅ | ✅ | ❌ | ❌ |
| Удалить воркспейс | ✅ | ✅ | ❌ | ❌ |
| Бэкап / восстановление системы | ✅ | ❌ | ❌ | ❌ |

---

## 3. Модель данных

### 3.1 Выбор стратегии хранения

Для хранения записей с произвольными полями рекомендуется **JSONB в PostgreSQL**.

**Почему JSONB, а не EAV или dynamic DDL:**
- JSONB индексируется, поддерживает операторы `@>`, `->>`
- Нет риска SQL-инъекций через динамический DDL
- Схема не ломается при добавлении нового поля в ObjectType
- PostgreSQL 16 умеет частичные индексы по JSONB-полям

### 3.2 ER-схема

```
users
  id, email, password_hash, global_role, enabled, created_at

workspaces
  id, name, description, owner_id (FK→users), created_at

workspace_members
  id, workspace_id (FK→workspaces), user_id (FK→users),
  role (OWNER/ADMIN/MEMBER), invited_at

object_types
  id, workspace_id (FK→workspaces), name, icon, color,
  description, created_by (FK→users), created_at

field_definitions
  id, object_type_id (FK→object_types), name, label,
  field_type (TEXT/NUMBER/DATE/BOOLEAN/SELECT/RELATION),
  required, position, options (JSONB — для SELECT)

objects
  id, object_type_id (FK→object_types), workspace_id (FK→workspaces),
  created_by (FK→users), created_at, updated_at,
  data (JSONB)   ← все кастомные поля хранятся здесь
```

### 3.3 Описание таблиц

#### `objects.data` (JSONB)
Пример для объекта типа «Счёт» (с полями amount, client, date, paid):
```json
{
  "amount": 15000.00,
  "client": "ABC s.r.o.",
  "date": "2026-06-15",
  "paid": true
}
```
Ключи в `data` соответствуют `field_definitions.name` для данного `object_type_id`.

#### `field_definitions.options` (JSONB)
Для поля типа SELECT хранит список допустимых значений:
```json
{ "values": ["Pending", "Paid", "Cancelled"] }
```

#### `workspace_members`
Уникальный constraint: `(workspace_id, user_id)` — один пользователь может быть в воркспейсе только один раз.

---

## 4. Backend (Spring Boot)

### 4.1 Структура пакетов

```
com.example.platform/
├── config/
│   ├── SecurityConfig.java
│   ├── JwtFilter.java
│   └── JwtService.java
├── model/
│   ├── User.java
│   ├── Workspace.java
│   ├── WorkspaceMember.java
│   ├── ObjectType.java
│   ├── FieldDefinition.java
│   └── WorkspaceObject.java       ← избегаем конфликта с java.lang.Object
├── repository/
│   ├── WorkspaceRepository.java
│   ├── WorkspaceMemberRepository.java
│   ├── ObjectTypeRepository.java
│   ├── FieldDefinitionRepository.java
│   └── WorkspaceObjectRepository.java
├── service/
│   ├── WorkspaceService.java
│   ├── ObjectTypeService.java
│   ├── ObjectService.java
│   └── PermissionService.java     ← централизованная проверка прав
├── controller/
│   ├── AuthController.java
│   ├── WorkspaceController.java
│   ├── ObjectTypeController.java
│   ├── ObjectController.java
│   └── AdminController.java
└── dto/
    ├── CreateWorkspaceDto.java
    ├── CreateObjectTypeDto.java
    ├── FieldDefinitionDto.java
    └── CreateObjectDto.java
```

### 4.2 JPA-сущности (ключевые)

#### WorkspaceObject.java
```java
@Entity
@Table(name = "objects")
public class WorkspaceObject {
    @Id @GeneratedValue
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "object_type_id")
    private ObjectType objectType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "workspace_id")
    private Workspace workspace;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)    // Hibernate 6 + jackson
    private Map<String, Object> data;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
```

#### FieldDefinition.java
```java
@Entity
@Table(name = "field_definitions")
public class FieldDefinition {
    @Id @GeneratedValue
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "object_type_id")
    private ObjectType objectType;

    private String name;        // ключ в objects.data
    private String label;       // отображаемое имя
    
    @Enumerated(EnumType.STRING)
    private FieldType fieldType; // TEXT, NUMBER, DATE, BOOLEAN, SELECT, RELATION
    
    private boolean required;
    private int position;

    @Column(columnDefinition = "jsonb")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> options; // для SELECT: {"values": [...]}
}
```

### 4.3 PermissionService — централизованная проверка прав

Все контроллеры делегируют проверку прав в один сервис:

```java
@Service
public class PermissionService {

    // Получить роль пользователя в воркспейсе (null = не участник)
    public WorkspaceRole getRole(User user, Long workspaceId) {
        if (user.getGlobalRole() == GlobalRole.SUPER_ADMIN)
            return WorkspaceRole.OWNER;
        return memberRepo.findByWorkspaceIdAndUserId(workspaceId, user.getId())
            .map(WorkspaceMember::getRole)
            .orElse(null);
    }

    public void requireAtLeast(User user, Long workspaceId, WorkspaceRole minimum) {
        WorkspaceRole role = getRole(user, workspaceId);
        if (role == null || role.ordinal() < minimum.ordinal())
            throw new AccessDeniedException("Insufficient workspace role");
    }

    public void requireOwner(User user, Long workspaceId) {
        requireAtLeast(user, workspaceId, WorkspaceRole.OWNER);
    }
}
```

Enum упорядочен от меньшего к большему: `MEMBER(0) < ADMIN(1) < OWNER(2)`.

### 4.4 Валидация объекта против схемы

Перед сохранением ObjectService валидирует `data` против `field_definitions`:

```java
public void validateData(Map<String, Object> data, List<FieldDefinition> fields) {
    for (FieldDefinition field : fields) {
        Object value = data.get(field.getName());
        
        if (field.isRequired() && (value == null || value.toString().isBlank()))
            throw new ValidationException("Field '" + field.getLabel() + "' is required");
        
        if (value == null) continue;
        
        switch (field.getFieldType()) {
            case NUMBER -> {
                if (!(value instanceof Number))
                    throw new ValidationException("Field '" + field.getLabel() + "' must be a number");
            }
            case DATE -> {
                try { LocalDate.parse(value.toString()); }
                catch (Exception e) { throw new ValidationException("Invalid date format"); }
            }
            case SELECT -> {
                List<String> allowed = (List<String>) field.getOptions().get("values");
                if (!allowed.contains(value.toString()))
                    throw new ValidationException("Invalid value for field '" + field.getLabel() + "'");
            }
        }
    }
}
```

### 4.5 REST API (основные эндпоинты)

```
# Воркспейсы
GET    /api/workspaces                        — мои воркспейсы + приглашённые
POST   /api/workspaces                        — создать воркспейс
PUT    /api/workspaces/{id}                   — переименовать
DELETE /api/workspaces/{id}                   — удалить (только OWNER)

# Участники
GET    /api/workspaces/{id}/members           — список участников
POST   /api/workspaces/{id}/members           — пригласить пользователя {email, role}
PUT    /api/workspaces/{id}/members/{userId}  — изменить роль
DELETE /api/workspaces/{id}/members/{userId}  — удалить участника

# Типы объектов
GET    /api/workspaces/{wsId}/types           — список типов
POST   /api/workspaces/{wsId}/types           — создать тип {name, icon, fields:[...]}
PUT    /api/workspaces/{wsId}/types/{typeId}  — изменить схему
DELETE /api/workspaces/{wsId}/types/{typeId}  — удалить тип (и все его объекты)

# Объекты
GET    /api/workspaces/{wsId}/types/{typeId}/objects         — список записей (с фильтрами)
POST   /api/workspaces/{wsId}/types/{typeId}/objects         — создать запись {data: {...}}
PUT    /api/workspaces/{wsId}/types/{typeId}/objects/{objId} — обновить запись
DELETE /api/workspaces/{wsId}/types/{typeId}/objects/{objId} — удалить запись

# Суперадмин
GET    /api/admin/users
GET    /api/admin/workspaces
GET    /api/admin/backup
POST   /api/admin/restore
```

---

## 5. Frontend (React + TypeScript)

### 5.1 Структура страниц

```
/login                          — вход
/register                       — регистрация
/:lang/workspaces               — список воркспейсов
/:lang/workspaces/new           — создать воркспейс
/:lang/workspaces/:wsId         — главная воркспейса (список типов)
/:lang/workspaces/:wsId/settings — настройки: участники, переименование
/:lang/workspaces/:wsId/types/new                    — создать тип объектов
/:lang/workspaces/:wsId/types/:typeId                — список записей
/:lang/workspaces/:wsId/types/:typeId/settings       — редактировать схему
/:lang/workspaces/:wsId/types/:typeId/new            — новая запись
/:lang/workspaces/:wsId/types/:typeId/:objId         — просмотр/редактирование записи
/:lang/profile                  — профиль пользователя
/:lang/admin                    — суперадмин панель
```

### 5.2 Динамический рендер формы

Ключевой компонент — форма, которая рендерится из массива `FieldDefinition[]`:

```tsx
// components/DynamicForm.tsx
interface Props {
  fields: FieldDefinition[];
  value: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
  readOnly?: boolean;
}

export function DynamicForm({ fields, value, onChange, readOnly }: Props) {
  const sorted = [...fields].sort((a, b) => a.position - b.position);

  return (
    <div className="space-y-4">
      {sorted.map(field => (
        <DynamicField
          key={field.name}
          field={field}
          value={value[field.name]}
          onChange={v => onChange({ ...value, [field.name]: v })}
          readOnly={readOnly}
        />
      ))}
    </div>
  );
}

function DynamicField({ field, value, onChange, readOnly }) {
  switch (field.fieldType) {
    case 'TEXT':
      return <input type="text" value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={readOnly} />;
    case 'NUMBER':
      return <input type="number" value={value ?? ''} onChange={e => onChange(Number(e.target.value))} disabled={readOnly} />;
    case 'DATE':
      return <input type="date" value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={readOnly} />;
    case 'BOOLEAN':
      return <input type="checkbox" checked={!!value} onChange={e => onChange(e.target.checked)} disabled={readOnly} />;
    case 'SELECT':
      return (
        <select value={value ?? ''} onChange={e => onChange(e.target.value)} disabled={readOnly}>
          <option value="">—</option>
          {field.options.values.map(v => <option key={v} value={v}>{v}</option>)}
        </select>
      );
    default:
      return null;
  }
}
```

### 5.3 Динамическая таблица записей

```tsx
// pages/ObjectListPage.tsx
export function ObjectListPage() {
  const { wsId, typeId } = useParams();
  const { data: objectType } = useQuery(['type', typeId], () => api.getObjectType(wsId, typeId));
  const { data: objects } = useQuery(['objects', typeId], () => api.getObjects(wsId, typeId));

  if (!objectType || !objects) return <Spinner />;

  return (
    <table>
      <thead>
        <tr>
          {objectType.fields.map(f => <th key={f.name}>{f.label}</th>)}
          <th>Действия</th>
        </tr>
      </thead>
      <tbody>
        {objects.map(obj => (
          <tr key={obj.id}>
            {objectType.fields.map(f => (
              <td key={f.name}>{renderCell(obj.data[f.name], f)}</td>
            ))}
            <td>
              <EditButton to={`/workspaces/${wsId}/types/${typeId}/${obj.id}`} />
              <DeleteButton onClick={() => deleteObject(obj.id)} />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

### 5.4 Редактор схемы (ObjectType)

Страница создания/редактирования типа объектов — drag-and-drop список полей:

```tsx
// pages/ObjectTypeSchemaPage.tsx
export function ObjectTypeSchemaPage() {
  const [fields, setFields] = useState<FieldDefinitionDraft[]>([]);

  const addField = () => setFields(prev => [...prev, {
    name: '',
    label: '',
    fieldType: 'TEXT',
    required: false,
    position: prev.length
  }]);

  return (
    <div>
      <h2>Поля</h2>
      {fields.map((f, i) => (
        <FieldEditor
          key={i}
          field={f}
          onChange={updated => setFields(prev => prev.map((x, j) => j === i ? updated : x))}
          onDelete={() => setFields(prev => prev.filter((_, j) => j !== i))}
        />
      ))}
      <button onClick={addField}>+ Добавить поле</button>
      <button onClick={save}>Сохранить</button>
    </div>
  );
}
```

---

## 6. Многоуровневая система прав — детали реализации

### 6.1 Проверка на уровне Spring Security

Вместо `@PreAuthorize` использовать явную проверку через PermissionService в каждом методе контроллера:

```java
@PostMapping("/{wsId}/types/{typeId}/objects")
public ResponseEntity<?> createObject(
    @PathVariable Long wsId,
    @PathVariable Long typeId,
    @RequestBody CreateObjectDto dto,
    @AuthenticationPrincipal UserDetails userDetails
) {
    User user = userService.findByEmail(userDetails.getUsername());
    permissionService.requireAtLeast(user, wsId, WorkspaceRole.ADMIN);
    // ...
}
```

### 6.2 Фильтрация данных на уровне запросов

Каждый запрос к объектам включает `workspace_id` в WHERE, что исключает доступ к чужим данным даже при ошибке в логике:

```java
// WorkspaceObjectRepository
List<WorkspaceObject> findByObjectTypeIdAndWorkspaceId(Long typeId, Long workspaceId);
```

### 6.3 Invitation flow

```
POST /api/workspaces/{wsId}/members
Body: { "email": "user@example.com", "role": "MEMBER" }

1. Найти user по email
2. Проверить что он уже не в воркспейсе
3. Создать WorkspaceMember(workspaceId, userId, role)
4. (Опционально) отправить email-уведомление
```

---

## 7. Технологический стек

| Компонент | Технология | Примечание |
|---|---|---|
| Backend | Spring Boot 3 + Java 21 | REST API, Spring Security, JWT |
| ORM | Spring Data JPA + Hibernate 6 | JSONB через `@JdbcTypeCode(SqlTypes.JSON)` |
| БД | PostgreSQL 16 | JSONB с GIN-индексом на `objects.data` |
| Frontend | React + TypeScript + Vite | SPA с URL-based i18n и клиентской маршрутизацией |
| State | TanStack React Query | Кэш и синхронизация данных с API |
| Стили | Tailwind CSS | Утилитарная стилизация |
| i18n | react-i18next | Многоязычный интерфейс |
| Контейнеры | Docker Compose | Оркестрация: postgres + backend + frontend (nginx) |

---

## 8. База данных — SQL-схема (референс)

```sql
CREATE TABLE users (
    id         BIGSERIAL PRIMARY KEY,
    email      VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    global_role VARCHAR(20) NOT NULL DEFAULT 'USER',
    enabled    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE workspaces (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(255) NOT NULL,
    description TEXT,
    owner_id    BIGINT NOT NULL REFERENCES users(id),
    created_at  TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE workspace_members (
    id           BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id      BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role         VARCHAR(20) NOT NULL,
    invited_at   TIMESTAMP NOT NULL DEFAULT now(),
    UNIQUE (workspace_id, user_id)
);

CREATE TABLE object_types (
    id           BIGSERIAL PRIMARY KEY,
    workspace_id BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    name         VARCHAR(255) NOT NULL,
    icon         VARCHAR(50),
    created_by   BIGINT REFERENCES users(id),
    created_at   TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE field_definitions (
    id             BIGSERIAL PRIMARY KEY,
    object_type_id BIGINT NOT NULL REFERENCES object_types(id) ON DELETE CASCADE,
    name           VARCHAR(100) NOT NULL,   -- ключ в objects.data
    label          VARCHAR(255) NOT NULL,
    field_type     VARCHAR(20)  NOT NULL,
    required       BOOLEAN NOT NULL DEFAULT FALSE,
    position       INT NOT NULL DEFAULT 0,
    options        JSONB
);

CREATE TABLE objects (
    id             BIGSERIAL PRIMARY KEY,
    object_type_id BIGINT NOT NULL REFERENCES object_types(id) ON DELETE CASCADE,
    workspace_id   BIGINT NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    created_by     BIGINT REFERENCES users(id),
    created_at     TIMESTAMP NOT NULL DEFAULT now(),
    updated_at     TIMESTAMP NOT NULL DEFAULT now(),
    data           JSONB NOT NULL DEFAULT '{}'
);

-- GIN-индекс для быстрого поиска по JSONB-полям
CREATE INDEX idx_objects_data ON objects USING GIN (data);
CREATE INDEX idx_objects_type ON objects (object_type_id);
CREATE INDEX idx_objects_workspace ON objects (workspace_id);
```

---

## 9. Пошаговый план разработки (MVP)

### Этап 1 — Основа (2-3 недели)
- [ ] Создать новый Spring Boot проект (Spring Initializr: Web, Security, Data JPA, PostgreSQL Driver)
- [ ] Реализовать модели: User, Workspace, WorkspaceMember
- [ ] JWT-аутентификация: JwtService (генерация/валидация HS256) + JwtFilter (OncePerRequestFilter), добавить поле `global_role`
- [ ] CRUD воркспейсов + управление участниками
- [ ] PermissionService с матрицей прав
- [ ] React: страница списка воркспейсов, создание, настройки участников

### Этап 2 — Кастомные типы данных (2-3 недели)
- [ ] Модели ObjectType + FieldDefinition
- [ ] API создания/редактирования схемы типа
- [ ] React: редактор схемы (список полей с типами и настройками)
- [ ] CRUD объектов с JSONB `data`
- [ ] Валидация `data` против `field_definitions` на backend
- [ ] React: DynamicForm для создания/редактирования записи
- [ ] React: DynamicTable для отображения списка записей

### Этап 3 — UX и полировка (1-2 недели)
- [ ] Фильтрация и поиск по объектам (JSONB операторы)
- [ ] Сортировка по любому полю
- [ ] Профиль пользователя (смена пароля, email)
- [ ] Email-уведомления при приглашении в воркспейс
- [ ] Суперадмин панель (список пользователей, воркспейсов, бэкап)

### Этап 4 — Продвинутые возможности (по желанию)
- [ ] Тип поля `RELATION` — ссылка на запись другого ObjectType в том же воркспейсе
- [ ] Представления (Views): Kanban по SELECT-полю, Calendar по DATE-полю
- [ ] Экспорт данных ObjectType в CSV / JSON
- [ ] Webhook при создании/изменении объекта
- [ ] Аудит-лог изменений

---

## 10. Ключевые решения и компромиссы

### Хранение данных: JSONB vs раздельные таблицы
JSONB выбран намеренно — это позволяет добавлять поля в ObjectType без миграций БД. Компромисс: нет foreign key constraints между полями типа RELATION, проверки на уровне приложения.

### Валидация на backend обязательна
Frontend может пропустить валидацию (баг, старый кэш, прямой API вызов). Всегда валидировать `data` против `field_definitions` в ObjectService перед сохранением.

### Удаление ObjectType
При удалении типа удаляются все его объекты (ON DELETE CASCADE). Перед удалением — обязательный confirm dialog на frontend с указанием количества записей.

### Переименование поля (`name`)
Если пользователь переименовывает `name` поля (ключ в JSONB), старые данные в `objects.data` останутся со старым ключом. Варианты:
- Запретить переименование `name`, разрешать менять только `label`
- При переименовании запустить UPDATE всех объектов типа (осторожно на больших объёмах)

Рекомендация для MVP: разрешать менять только `label`, `name` неизменяем после создания.
