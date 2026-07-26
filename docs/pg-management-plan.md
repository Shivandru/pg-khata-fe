# PG Management System — Product & Learning Plan

## 1. Real Goal (don't lose sight of this)

Two goals running in parallel:
1. **Owner's actual problem**: tracking room/bed occupancy and rent payment status is manual and messy.
2. **Your goal**: use this real project to make OOP + SOLID *muscle memory*, not textbook knowledge — before moving to design patterns.

The POC scope is deliberately narrow: **one PG, one admin (owner), core occupancy + payment tracking.** Marketplace, guest logins, ads, app version — all phase 2+. We design the data model so phase 2 is an *extension*, not a rewrite.

---

## 2. Phase Roadmap

| Phase | Scope | Users |
|---|---|---|
| **Phase 1 (POC — 10 days)** | Single PG. Owner manages rooms, beds, guests, payment status manually. | Owner (Admin) only |
| **Phase 2** | Guest-facing PWA: guests view their own payment history, pay online (Rails service goes live). | Owner + Guest |
| **Phase 3** | Multi-PG marketplace: Hosts list PGs, Guests search/discover. Ad support. | Host + Guest |
| **Phase 4** | Mobile app (same backend), scale hosting on GCP properly (Cloud Run/GKE, CDN, etc.) | Host + Guest |

Key discipline: **Phase 1's schema must already be multi-tenant-shaped** (everything scoped by `propertyId`), even though only one property exists. This is the single most important architectural decision — retrofitting multi-tenancy later is painful; designing for it now costs almost nothing.

---

## 3. Domain Model (Phase 1 core entities)

```
Property (PG)
  └── Room
        └── Bed
              └── Tenancy (Guest ↔ Bed, with time range)
                    └── PaymentRecord (per month)

Guest (standalone entity, referenced by Tenancy)
Owner/Admin (auth user, owns Property)
```

### Entity responsibilities (this is your SRP/OOP practice ground)

- **Property** — represents the PG itself. Name, address, owner reference. Everything else scopes under this via `propertyId`.
- **Room** — floor, room number, belongs to a Property.
- **Bed** — belongs to a Room. Has `rentAmount` and an identifier (e.g., "Bed A"). Do **not** subclass by sharing type (SingleBed/DoubleBed) — sharing type is a derived property (count of beds in a room), not a different kind of object. This avoids unnecessary inheritance and keeps things open for extension (OCP) — adding a new sharing type later is just data, not new classes.
- **Guest** — person's profile info. Knows nothing about beds or rooms directly.
- **Tenancy** — the relationship entity: `guestId`, `bedId`, `startDate`, `endDate` (null if active), `agreedRent`. This decouples "who exists" (Guest) from "who's occupying what, when" (Tenancy). Without this, vacating/reassigning guests destroys history.
- **PaymentRecord** — `tenancyId`, `month`, `amountDue`, `amountPaid`, `status` (Paid/Pending/Partial), `paidOn`. This is *your* system's responsibility. The actual money movement is NOT — that's the Rails service's job.

### The DIP seam (important — this is where your teammate's Rails service plugs in)

Design a thin abstraction in your backend, e.g. a `PaymentGatewayClient` interface with methods like `initiatePayment()` / `getPaymentStatus()`. For the POC:
- **Implementation = manual entry** (owner marks Paid/Pending directly).
- **Later** = swap the implementation to actually call the Rails payment service via REST/webhook.

Nothing else in your app should need to change when that swap happens — that's Dependency Inversion actually mattering, not just a definition you memorized.

### SOLID checkpoints to consciously notice while building

- **SRP** — Room management, Tenancy management, Payment tracking should be separate services/classes, not one giant `PGService` god class.
- **OCP** — Adding a new sharing type or a new payment status shouldn't require editing five files.
- **LSP** — If you're tempted to subclass anything (Guest types, Bed types), ask: can every subclass be used wherever the base is expected, with zero surprises? If not, don't subclass — use composition/data instead.
- **ISP** — Keep interfaces small. Don't force a `PaymentGatewayClient` interface to also handle notifications or receipts if those aren't universally needed.
- **DIP** — High-level modules (occupancy logic) should not depend on low-level details (which payment gateway, which DB driver) — depend on abstractions.

---

## 4. What the Tool Looks Like (Owner's view, Phase 1)

1. **Login** — single owner account for now.
2. **Dashboard** — occupancy % , this month's collection %, count of pending payments.
3. **Rooms & Beds view** — grid/list of rooms, expandable to beds, occupied/vacant status per bed.
4. **Add Room / Add Bed** — simple forms.
5. **Guest list** — all guests, current bed assignment, quick status.
6. **Assign Guest to Bed** — creates a Tenancy record.
7. **Guest Profile** — details + full payment history (all months).
8. **Payment Tracker** — matrix view: rows = guests, columns = months, cell = status (tap to mark Paid/Pending/Partial). This is the screen that directly solves the owner's stated pain point — prioritize it.
9. **Vacate Guest** — ends the Tenancy (sets `endDate`), frees the bed.

No guest-facing UI in Phase 1. No payment gateway integration in Phase 1 (manual status only, with the DIP seam left ready).

---

## 5. Tech Architecture

- **Frontend**: NextJs typescript (PWA-ready from day 1 — use npx create next app@latest but it includes all the pwa setup + a manifest + service worker later, but don't let PWA setup eat POC time now).
- **Backend**: Node.js + Express, MongoDB (Mongoose). REST API.
- **Payment service**: Ruby on Rails, owned by teammate, separate service. Communicates via REST API (later, webhooks for payment status updates).
- **Hosting**: Google Cloud — for POC, keep it simple (e.g., a single Compute Engine VM or Cloud Run for the Node app + MongoDB Atlas free tier). Don't over-engineer GKE/microservice infra yet — that's a Phase 3/4 concern.
- **Auth**: Simple JWT-based auth for the single owner account. Design the User model with a `role` field (`owner`/`guest`/`host`) from day 1 so Phase 2/3 roles slot in without a schema rewrite.

### Suggested folder structure (backend)

```
/models        → Property, Room, Bed, Guest, Tenancy, PaymentRecord, User
/services      → PropertyService, RoomService, TenancyService, PaymentService
/controllers   → route handlers, thin — delegate to services
/routes
/config
```

Keep controllers thin. Business logic (e.g., "can this bed be assigned?", "is this guest already active elsewhere?") belongs in services, not controllers — another natural SRP boundary.

---

## 6. Rough DB Schema Sketch

```
Property { _id, name, address, ownerId }

Room { _id, propertyId, roomNumber, floor }

Bed { _id, roomId, label, rentAmount }

Guest { _id, name, phone, email, kycInfo }

Tenancy { _id, guestId, bedId, startDate, endDate, agreedRent, isActive }

PaymentRecord { _id, tenancyId, month, amountDue, amountPaid, status, paidOn }

User (auth) { _id, name, email, passwordHash, role, propertyId }
```

---

## 7. 10-Day Build Plan

| Day | Focus |
|---|---|
| 1 | Finalize requirements with owner (confirm the payment-tracking screen is priority #1), rough wireframes, finalize schema |
| 2 | Backend project setup, DB models (Property, Room, Bed, Guest, Tenancy, PaymentRecord), auth scaffolding |
| 3 | Room & Bed CRUD APIs + service layer |
| 4 | Guest CRUD + Tenancy (assign/vacate) APIs |
| 5 | PaymentRecord APIs (manual entry), seed sample data for 200 guests scale-test |
| 6 | Frontend setup (React), auth/login, dashboard skeleton |
| 7 | Rooms & Beds view, Add Room/Bed forms |
| 8 | Guest list, Guest profile, Assign/Vacate flow |
| 9 | Payment Tracker matrix view (the star screen) — build and polish |
| 10 | Integration testing with real-ish data, deploy POC to GCP, demo to owner |

---

## 8. Decision Log

- **Payment integration**: Deferred. Phase 1 ships with manual payment status entry (Owner marks Paid/Pending/Partial). The Rails service plugs in later behind the same `PaymentRecord` update endpoint — no contract change needed when it's ready.
- **Floor**: Not a separate entity. It's a field on `Room` (`floor: Number`). Promote to its own entity only if floors need their own behavior later (floor supervisor, floor-level maintenance, etc.) — no reason to model it as a first-class thing today.
- **Guest login**: Not built in Phase 1. `Guest` is a plain data record maintained by the Owner (name, phone, KYC) — no password, no self-service. "Who paid for which bed" is answered entirely by `Tenancy` (guest↔bed link) + `PaymentRecord` (payment status against that tenancy), not by the guest authenticating. To keep Phase 2 (guest self-service) painless, `Guest` carries a `userId` field (null for now) and the `User` auth model carries a `guestId` field (null for now, only Owners exist as Users today). When guest login is needed later, we create a `User` with `role: guest` and link the two — `Tenancy`/`PaymentRecord` never need to change since they already reference `guestId` directly.
- **Guest vs User kept as separate schemas/collections**: `Guest` answers "who occupies a bed, what do we know about them" (name, phone, KYC). `User` answers "who can authenticate into the system" (email, passwordHash, role). In Phase 1 only Owners are Users; no Guest is. Merging them into one model would force every Guest record to carry unused auth fields, and every Owner record to carry unused tenant fields — one model doing two unrelated jobs. Splitting them is SRP applied to data: a change in KYC rules and a change in login/auth mechanics are different reasons to change, so they live in different models. The `userId` / `guestId` nullable links keep them connectable without coupling `Tenancy`/`PaymentRecord` to authentication at all.
- **Validation library**: Zod, not Mongoose schemas — validation is kept as a separate concern from persistence, so the app isn't locked into a specific ODM/driver. Each entity has a full schema (DB read shape), a create schema (POST body — omits server-set fields like `_id`, `ownerId`, `propertyId`, `isActive`), and an update schema (only editable fields, all optional). Schemas live one-per-entity under `/schemas` for the same SRP reason as above.

---

## 9. API Endpoint Contract (Phase 1, no Rails dependency)

Base URL: `/api`. All routes except `/auth/login` require `Authorization: Bearer <token>`.

### Auth

**POST `/auth/login`**
```json
Request:  { "email": "owner@pg.com", "password": "secret" }
Response: { "token": "jwt...", "user": { "id", "name", "role": "owner", "propertyId" } }
```

### Property

**GET `/properties/:id`**
```json
Response: { "id", "name", "address", "ownerId" }
```

**PUT `/properties/:id`** — update name/address.

### Rooms

**GET `/properties/:propertyId/rooms`**
```json
Response: [ { "id", "roomNumber", "floor", "bedCount", "occupiedCount" } ]
```

**POST `/properties/:propertyId/rooms`**
```json
Request:  { "roomNumber": "204", "floor": 2 }
Response: { "id", "propertyId", "roomNumber", "floor" }
```

**PUT `/rooms/:id`** — update roomNumber/floor.
**DELETE `/rooms/:id`** — only if it has zero beds.

### Beds

**GET `/rooms/:roomId/beds`**
```json
Response: [ { "id", "label": "A", "rentAmount": 6000, "isOccupied": true } ]
```

**POST `/rooms/:roomId/beds`**
```json
Request:  { "label": "A", "rentAmount": 6000 }
Response: { "id", "roomId", "label", "rentAmount" }
```

**PUT `/beds/:id`** — update label/rentAmount.
**DELETE `/beds/:id`** — only if no active tenancy.

### Guests

**GET `/properties/:propertyId/guests`**
```json
Response: [ { "id", "name", "phone", "currentBed": { "roomNumber", "label" } | null } ]
```

**POST `/guests`**
```json
Request:  { "name": "Rahul Sharma", "phone": "9876543210", "email": "", "kycInfo": {} }
Response: { "id", "name", "phone", "email" }
```

**GET `/guests/:id`** — full profile.
**PUT `/guests/:id`** — update profile.

### Tenancies (assign / vacate)

**POST `/tenancies`** — assign a guest to a bed.
```json
Request:  { "guestId": "...", "bedId": "...", "startDate": "2026-07-20", "agreedRent": 6000 }
Response: { "id", "guestId", "bedId", "startDate", "endDate": null, "agreedRent", "isActive": true }
```
> Server-side rule: reject if the bed already has an active tenancy, or if the guest already has an active tenancy elsewhere. This validation belongs in `TenancyService`, not the controller.

**PUT `/tenancies/:id/vacate`**
```json
Request:  { "endDate": "2026-08-15" }
Response: { "id", "isActive": false, "endDate" }
```

**GET `/beds/:bedId/tenancy/active`** — current occupant of a bed, if any.

**GET `/guests/:guestId/tenancies`** — full occupancy history for a guest.

### Payment Records

**POST `/properties/:propertyId/payments/generate`** — bulk-generate this month's due records for all active tenancies (run manually or via a monthly cron later).
```json
Request:  { "month": "2026-08" }
Response: { "created": 42 }
```

**GET `/properties/:propertyId/payments?month=2026-08`** — the matrix data (guest × status for that month).
```json
Response: [ { "id", "tenancyId", "guestName", "roomNumber", "bedLabel", "amountDue", "amountPaid", "status", "paidOn" } ]
```

**PUT `/payments/:id`** — mark paid/partial/pending (this is the manual-entry endpoint today; later, the Rails service's webhook can call this same shape).
```json
Request:  { "amountPaid": 6000, "status": "paid", "paidOn": "2026-08-05" }
Response: { "id", "status", "amountPaid", "paidOn" }
```

**GET `/guests/:guestId/payments`** — full payment history for one guest.

### Dashboard

**GET `/properties/:propertyId/dashboard?month=2026-08`**
```json
Response: {
  "totalRooms", "totalBeds", "occupiedBeds", "occupancyPercent",
  "totalDue", "totalCollected", "collectionPercent", "pendingCount"
}
```

---

## 9. Explicitly Deferred (do not build in Phase 1)

- Guest login / guest-facing search
- Multi-PG / Host onboarding
- Ads
- Mobile app
- Actual payment gateway integration
- Design patterns (Factory, Strategy, etc.) — revisit once this POC ships and you've felt where the pain points naturally are (e.g., you'll likely *feel* the need for Strategy when pricing rules get more complex, or Factory when Tenancy creation logic grows conditions)
