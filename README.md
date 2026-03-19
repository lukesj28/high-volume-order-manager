# Fish & Chips POS — Good Friday High-Volume Order Manager

## Dev Quick Start

### 1. Start PostgreSQL
```bash
docker compose up -d
```
> Uses port **5433** (avoids conflicts with any local Postgres on 5432).

### 2. Start Backend
```bash
cd backend
JAVA_HOME=$(/usr/libexec/java_home -v 17) mvn spring-boot:run
```
> Requires **Java 17** (Lombok is incompatible with Java 24+).
> Flyway runs migrations automatically on first start.

### 3. Start Frontend
```bash
cd frontend
npm install   # first time only
npm run dev
```
> App available at http://localhost:5173

---

## Default Credentials (DEV ONLY — change before go-live)

| Account | Username | Password |
|---------|----------|----------|
| Admin   | `admin`  | `admin123` |
| Staff (all terminals) | `staff` | `staff123` |

Change staff password: Admin dashboard → Users tab.

---

## Login Flow
1. Visit http://localhost:5173
2. Log in with staff or admin credentials
3. Select a **station profile** (Front Window, Phone, App, Kitchen, Backdoor)
4. Token scoped to that station for 15 hours (staff) / 8 hours (admin)

---

## Station Profiles

All configured in the database — edit via Admin → Station Profiles:

| Station | Can Submit | In Progress | Complete | Skip | Sees |
|---------|-----------|-------------|----------|------|------|
| Front Window | ✓ | — | ✓ | ✓ | Own + App orders |
| Phone | ✓ | — | — | — | Own orders |
| App | ✓ | — | — | — | Own orders |
| Kitchen | — | ✓ | — | — | All orders |
| Backdoor | — | — | ✓ | ✓ | Phone orders |

**"Skip"** = Pending → Completed directly (requires confirmation dialog).

---

## State Machine
```
PENDING ─── Kitchen ──► IN_PROGRESS ─── Front Window/Backdoor ──► COMPLETED
    │                                                                   ▲
    └─── Front Window/Backdoor (with confirmation) ─────────────────────┘
```

---

## Architecture

| Layer | Technology | Port |
|-------|-----------|------|
| Frontend | React 18 + Vite 5 + PWA | 5173 |
| Backend | Spring Boot 3.3 / Java 17 | 8080 |
| Database | PostgreSQL 16 | 5433 |
| WebSocket | STOMP over SockJS | /ws |
| Auth | JWT (15hr staff / 8hr admin) | — |

---

## Day Lifecycle
- Any authenticated user can open/close a day via the header
- Ticket numbers reset to 1 on each new day
- All data retained indefinitely (small footprint)

## Offline Mode
Orders queue in IndexedDB when offline. Sync is automatic on reconnect. Header shows offline badge with queue count.

## Adding Menu Items
Admin → Menu → Add Item. Define components (e.g., "Halibut and Chips" → Halibut ×1, Chips ×1) for analytics breakdown.
