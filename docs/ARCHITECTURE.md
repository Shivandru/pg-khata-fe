# PG Management System — Backend Architecture

This document defines the backend architecture, coding conventions, logging strategy, error handling, and folder responsibilities for the project.

Every new module (Property, Room, Bed, Guest, Tenancy, PaymentRecord, User, etc.) must follow this document.

---

## 1. Architecture

The backend follows a layered architecture:

```
Request
  ↓
Middleware
  ↓
Validator (Zod)
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
MongoDB
```

Each layer has exactly one responsibility. Business logic must never leak into controllers or repositories.

---

## 2. Folder Responsibilities

### `config/`

Application configuration.

**Examples**
- Mongo connection
- Environment validation

Must never contain business logic.

---

### `controllers/`

Controllers are thin.

**Responsibilities**
- Read validated request
- Call service
- Return HTTP response

**Controllers MUST NOT**
- Talk to Mongo
- Contain business rules
- Perform validation
- Contain calculations

**Good**
```js
import { propertyService } from '../services/property.service.js';

const property = await propertyService.create(req.body);
return res.status(201).json(property);
```

**Bad**
```js
import { collection } from '../db.js';

const exists = await collection.findOne(...);
if (...) { ... }
await collection.insertOne(...);
```

---

### `services/`

Services contain all business logic.

**Examples**
- Can a bed be assigned?
- Does room already exist?
- Can a property be deleted?
- Is guest already occupying another bed?

**Services**
- Call repositories
- Throw domain exceptions
- Log important business events

Services NEVER return HTTP responses.

---

### `repositories/`

Repositories only communicate with MongoDB.

**Repositories**
- Execute queries
- Map database objects
- Never know about Express
- Never know about HTTP
- Never perform validation

**Repositories NEVER**
- Throw HTTP errors
- Call `res.json()`
- Perform business rules

---

### `models/`

Mongo models. Persistence only.

---

### `schemas/`

Zod validation schemas.

Every entity has:
```
create.schema.js
update.schema.js
response.schema.js
```

`response.schema.js` validates/shapes what the API sends back — it strips fields a client should never see (e.g. `passwordHash` on `User`) and is the contract the frontend can rely on staying stable even if the DB document has extra internal fields.

Validation is completely separated from persistence.

> Note: our current `pgkhata-schemas/` only has `create` and `update` schemas per entity. `response` schemas still need to be added for each entity to match this document — see the Property module kickoff.

---

### `middleware/`

Contains:
- Logger
- Validator
- CORS
- Error handler

Middleware should never contain business logic.

---

### `utils/`

Shared utilities.

**Examples**
- Logger
- Exceptions
- Enums

---

## 3. Request Lifecycle

Every request follows this flow:

```
Incoming Request
  ↓
Logger Middleware
  ↓
CORS
  ↓
Validator
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
MongoDB
  ↓
Controller
  ↓
Response Validator
  ↓
Response Logger
  ↓
Client
```

---

## 4. Logging Strategy

The project uses three logging modes:

```js
// LogMode: one of "server" | "user" | "api"
```

Each mode has a different purpose.

### Server Logger

**Purpose:** Infrastructure logs.

**Examples**
- Server started
- Mongo connected
- Environment loaded
- Redis connected
- Cron started

```js
serverLogger.info("MongoDB connected");
```

Never log user actions here.

### User Logger

**Purpose:** Business events related to one authenticated user.

**Examples**
- Property created
- Guest assigned
- Payment updated
- Tenancy vacated

```js
RequestLogger.info("Guest assigned to Bed A");
```

When available, the logger automatically includes `username`.

Future improvements may include `userId`, `propertyId`, `requestId` — without changing service code.

### API Logger

**Purpose:** Log every HTTP request and response.

**Automatically logs**
- HTTP Method
- URL
- Status Code
- Latency
- Request Body
- Response Body

```
POST /properties
201
245ms
```

API logging is automatic. Services and controllers must never manually log requests.

---

## 5. Development vs Production Logging

**Development**
- ANSI colored logs
- Human readable
- Easy debugging

**Production (Cloud Run)**
- Structured JSON

Cloud Logging automatically indexes `severity`, `timestamp`, `httpRequest`. This allows filtering directly inside Google Cloud Logging.

```json
{
  "severity": "INFO",
  "timestamp": "...",
  "httpRequest": { "..." : "..." },
  "labels": { "..." : "..." }
}
```

Never use `console.log` directly. Always use `Logger`.

---

## 6. What Should Be Logged

**Log**
- ✅ Server startup
- ✅ Database connection
- ✅ Important business events
- ✅ Validation failures
- ✅ Unexpected exceptions
- ✅ API requests

**Do NOT log**
- ❌ Passwords
- ❌ Tokens
- ❌ Authorization headers
- ❌ Secrets

---

## 7. Error Handling

All business errors inherit from `HttpException`.

**Hierarchy**
```
HttpException
├── BadRequestException
├── UnauthorizedException
├── ForbiddenException
├── NotFoundException
├── ConflictException
└── InternalServerErrorException
```

Services throw exceptions. Controllers never create HTTP responses for failures.

```js
throw new NotFoundException("Guest not found");
```

The Error Middleware converts exceptions into HTTP responses.

---

## 8. Validation

Validation is performed using Zod.

**Flow**
```
Request
  ↓
Zod Schema
  ↓
Validated Data
  ↓
Controller
```

Controllers can safely assume `req.body`, `req.query`, `req.params` are already validated.

---

## 9. Controllers

Controllers should remain extremely small.

**Responsibilities**
- Receive request
- Call service
- Return response

**Target size:** 10–30 lines.

---

## 10. Services

Services contain business rules.

**Responsibilities**
- Validate business constraints
- Call repositories
- Log important actions
- Throw exceptions

Services never return an Express `Response`.

---

## 11. Repositories

**Repositories**
- Perform CRUD
- Build Mongo queries

**Repositories never know about**
- Express
- JWT
- HTTP
- Validation

---

## 12. Route Wrapper

All routes use `AppRouter`. Never use Express `Router` directly.

**Reason:** every handler is automatically wrapped:
```js
Promise.resolve(handler(...)).catch(next)
```

**Benefits**
- No try/catch in controllers
- Async errors always reach Error Middleware
- Consistent error handling

**Correct**
```js
router.post("/", controller.create);
```

**Incorrect**
```js
try {
  // ...
} catch (err) {
  // ...
}
```
— inside controllers.

---

## 13. Exception Flow

```
Repository
  ↓
Service
  ↓
throw HttpException
  ↓
Route Wrapper
  ↓
Error Middleware
  ↓
HTTP Response
```

Controllers should never catch business exceptions.

---

## 14. Coding Rules

**Controllers**
- Thin
- No business logic
- No Mongo queries

**Services**
- Business logic only

**Repositories**
- Database only

**Validation**
- Zod only

**Errors**
- `HttpException` only

**Logging**
- `Logger` only

**Routes**
- `AppRouter` only

---

## 15. ID Strategy

Entities do **not** use MongoDB's default `_id` (ObjectId). Every entity has its own human-readable, prefixed ID field instead:

| Entity | ID field | Prefix | Example |
|---|---|---|---|
| Property | `propertyId` | `p` | `p-3f2504e0` |
| Room | `roomId` | `r` | `r-8a1e42fd` |
| Bed | `bedId` | `b` | `b-1c9d7e33` |
| Guest | `guestId` | `g` | `g-6b2f9a10` |
| Tenancy | `tenancyId` | `t` | `t-44de8b02` |
| PaymentRecord | `paymentId` | `pm` | `pm-9f0c1a55` |
| User | `userId` | `u` | `u-2e7f6c88` |

**Format:** `<prefix>-<first 8 hex chars of a v4 UUID>`, e.g. `` `${prefix}-${uuid.split('-')[0]}` ``.

IDs are generated in the **repository layer**, right before insert — never accepted from the client, and never left to MongoDB to assign. This keeps IDs short, still effectively unique, and self-describing in logs, URLs, and support conversations — "bed `b-8a1e42fd` is empty" reads a lot better than a raw ObjectId with no context.

`schemas/common.js` centralizes this:
- `ID_PREFIXES` — the single source of truth mapping entity → prefix. A prefix is never hardcoded as a magic string anywhere else.
- `id(prefix)` — Zod validator for a prefixed ID string.
- `generateId(prefix)` — generates a new prefixed ID at insert time.

Mongo's own `_id` may still exist on the underlying document (some drivers require it), but it is never used as a foreign key or exposed in the API — the prefixed ID is the only ID the rest of the system knows about.

---

## 15a. Module System

The project uses **ES Modules** (`import` / `export`), not CommonJS (`require` / `module.exports`).

- `package.json` must have `"type": "module"`.
- Relative imports require the explicit file extension: `import { id } from './common.js'`, not `'./common'`.
- Barrel files (`schemas/index.js`, etc.) use `export * from './x.js'`.
- Never mix `import` with `module.exports`, or `require` with `export` — pick one system per file, and per project it's ESM everywhere.

---

## 16. Future Improvements

These are intentionally postponed:

- Request IDs
- Correlation IDs
- Property labels in logs
- User IDs in logs
- Log sanitization
- Distributed tracing
- OpenTelemetry
- Metrics
- Audit logging

These additions should not require changes to controllers or services, because the architecture already separates concerns correctly.

---

## 17. Code Generation Rules (for AI)

These rules apply whenever a module is generated with the help of an AI assistant (Claude, Codex, GPT, etc.). Every generated file must follow them without needing to be re-prompted each time.

- Never use `console.log`; use `RequestLogger` or `Logger`.
- Use ES Modules (`import`/`export`) only — never `require`/`module.exports`. Relative imports must include the `.js` extension.
- Never access Mongo from controllers.
- Always throw `HttpException` subclasses for business/domain errors.
- Always use `AppRouter`, never `express.Router` directly.
- Validate with Zod before the controller runs — controllers assume `req.body`/`req.query`/`req.params` are already clean.
- Keep controllers under ~30 lines.
- Keep repositories database-only — no HTTP, no Express, no business rules.
- Use `async`/`await` only — no raw `.then()` chains.
- Use early returns over nested conditionals.
- Never swallow exceptions — no empty `catch` blocks.
- Never return `null` for a missing resource; throw `NotFoundException` instead.
- Use one export style consistently across the codebase (pick named or default exports, don't mix).
- Follow the project's folder structure exactly — don't invent new top-level folders without updating this document first.