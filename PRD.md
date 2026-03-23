# Project Requirements Document (PRD): High-Volume Order Manager

> **Note:** While this system was built for a specific high-volume food service event, the architecture is intentionally domain-agnostic. The menu, station profiles, order states, and display configuration are all runtime data — no domain knowledge is hardcoded. This system is suitable for any high-throughput food service operation with similar operational constraints.

## 1. Executive Summary & Motivations
This project is a custom Point of Sale (POS) and order management system built for high-volume, event-driven food service. The primary event driving the architecture is a single-day peak service window that demands an unyielding 10-hour period of continuous transactional load.

**Motivations:**
* **Zero Downtime:** The system must survive continuous operation under heavy load without locking, crashing, or losing orders.
* **Non-Technical Usability:** Staff are not tech-savvy. The application must be accessible via a standard web URL with no manual network configuration required.
* **Zero-Maintenance Handoff:** The system must run autonomously on managed cloud infrastructure without requiring a dedicated sysadmin to patch servers or restart crashed instances.
* **Granular Analytics:** End-of-day reporting must break down composite menu items into their constituent parts for accurate inventory metrics.

---

## 2. Technical Stack
The infrastructure relies entirely on Platform-as-a-Service (PaaS) to eliminate server maintenance. 

| Component | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | Vite (React/Vue) | Delivers a fast, lightweight Single Page Application (SPA). |
| **Offline Mode** | Progressive Web App (PWA) | Uses Service Workers and IndexedDB to cache the app and queue orders during an internet outage. |
| **Backend** | Java (Spring Boot) | Handles high-concurrency business logic, state machine enforcement, and WebSocket routing. |
| **Database** | PostgreSQL | Ensures transactional integrity and relational data modeling for analytics. |
| **Deployment** | Vercel/Netlify (FE), Render/Heroku (BE) | Fully managed cloud hosting with automated builds and zero OS maintenance. |

---

## 3. System Architecture & Data Flow
The system operates across 5 dedicated laptops using a Publisher/Subscriber model via WebSockets (STOMP). 

**Station Profiles & Permissions:**
* **Front Window:** Generates walk-up orders. Subscribes only to its own orders. Can apply `Pending` and `Completed` tags.
* **Phone:** Generates call-in orders. Subscribes only to its own orders. Can apply the `Pending` tag.
* **App:** Generates digital/online orders. Subscribes only to its own orders. Can apply the `Pending` tag.
* **Kitchen:** The central routing hub. Subscribes to all active orders. Can apply the `In Progress` and `Completed` tags.
* **Handout:** Manages order distribution. Subscribes exclusively to the Phone station's order stream.

**Data Modeling (PostgreSQL):**
* **Orders Table:** Stores metadata, including a generated UUID (Primary Key), the sequential display ticket number, the originating station, and the timestamp.
* **Order_Items Table:** Stores the individual, broken-down components of an order linked via Foreign Key to the parent order for seamless end-of-day SQL querying.

---

## 4. Offline Mitigation & Resiliency
The restaurant's ISP is the single point of failure. The application must handle sudden internet drops invisibly.

* **PWA Caching:** The Vite frontend must install a Service Worker to cache the application shell. If the internet drops, the UI must remain fully operational and not display a browser error page.
* **IndexedDB Queuing:** During an outage, new orders are intercepted and stored in the browser's local database. 
* **Background Sync:** Upon detecting an restored internet connection, the frontend automatically flushes the IndexedDB queue, sending payloads to the Spring Boot backend sequentially.
* **Mobile Hotspot Fallback:** If the outage is permanent, staff can connect the laptops to a mobile phone hotspot to instantly restore cloud connectivity without altering any internal router settings.

---

## 5. Security & Access Control
Data integrity and privacy are maintained through Role-Based Access Control (RBAC) using JSON Web Tokens (JWT).

* **Staff Role:** Used for the 5 POS terminals. The JWT must be configured with a 14 to 16-hour expiration to guarantee staff are not forcibly logged out during the 10-hour shift.
* **Admin Role:** Used strictly for the analytics dashboard and user management. This role restricts access to end-of-day business data so it is not visible to the general floor staff.

---

## 6. The "Musts" and "Must Nots"

**Musts:**
* **Must** generate a UUID on the frontend for every new order payload to act as the primary key and prevent collisions during offline queue synchronization.
* **Must** assign the human-readable, sequential Ticket Number (1, 2, 3) strictly on the backend database at the exact moment of insertion to prevent race conditions.
* **Must** fetch the authoritative state of all active orders via a standard HTTP GET request whenever a WebSocket connection drops and reconnects, to catch any missed messages.
* **Must** explicitly clean up and tear down all WebSocket listeners and intervals in the frontend components when unmounting to prevent memory leaks and browser crashes during the 10-hour run.
* **Must** use optimized custom database queries (like `JOIN FETCH` in JPQL) to retrieve orders and their items together, avoiding the "N+1" query performance bottleneck under heavy load.

**Must Nots:**
* **Must Not** rely on the frontend client to dictate the sequential ticket number.
* **Must Not** allow station profiles to bypass the enforced state machine (e.g., Front Window cannot tag an order `Completed` if it has not been marked `In Progress` by the Kitchen).
* **Must Not** issue short-lived authentication tokens (e.g., 1 hour) to the standard POS terminal roles.
* **Must Not** store composite menu items as a single string or flat entry in the database; they must be expanded into their constituent parts upon submission.

---

## 7. Resilience & Error Handling (Non-Negotiable)

**The application cannot go down under any circumstances during the service window.** Every layer of the stack must be written with this as the primary constraint. The following rules apply to all current and future development:

### 7.1 Frontend — React

* **Root Error Boundary:** The entire React tree must be wrapped in a root-level `ErrorBoundary` that catches any uncaught render error and shows a styled recovery panel instead of a blank screen. It must offer a one-click reload.
* **Route-Level Error Boundaries:** Every page/route must be individually wrapped in its own `RouteErrorBoundary`. A crash in one page (e.g., Analytics) must never take down the Order Board or POS.
* **Card-Level Error Boundaries:** Every `OrderCard` rendered in a list must be wrapped in a `CardErrorBoundary`. A single malformed order payload must not cause the entire order board to go blank.
* **No Uncaught Promise Rejections:** All `async/await` blocks must have `try/catch`. All `useQuery`/`useMutation` calls must handle error states with `throwOnError: false` at the `QueryClient` level. All pages must render graceful empty states on query failure, not crash.
* **Global Error Listeners:** `window.addEventListener('error', ...)` and `window.addEventListener('unhandledrejection', ...)` must be present but must only log to `console.error` — they must **never** overwrite the DOM, which would destroy the React app already mounted.

### 7.2 Frontend — WebSocket

* **Never Propagate Exceptions Outward:** All `onmessage`, `onConnect`, and `onStompError` callbacks must be wrapped in `try/catch`. A single bad message (malformed JSON, unexpected shape) must not crash the hook or cause a React re-render error.
* **Reconnect Indefinitely:** The STOMP client must always attempt to reconnect with a short delay (3 s). On reconnect, it must always re-fetch authoritative state via HTTP GET before re-subscribing.
* **User-Visible Reconnect Notice:** When a reconnection succeeds after a prior disconnect, a toast notification must inform the user.

### 7.3 Frontend — Offline Queue

* **Never Block on a Single Failure:** The offline flush loop must not `break` on the first failed order. It must attempt all queued orders before giving up.
* **Permanent Failure Handling:** If the server returns a 4xx response (client/validation error), the order must be removed from the queue immediately — it will never succeed. If a server/network error repeats ≥ 3 times for the same order, it must also be dropped and the user notified via toast.
* **Graceful `enqueue` Failure:** If writing to IndexedDB fails (storage quota), the failure must be caught and a toast shown — it must not throw an unhandled exception.

### 7.4 Backend — Spring Boot

* **Global Exception Handler:** A `@RestControllerAdvice` must catch all unhandled exceptions at the controller layer and return structured JSON error responses (never a 500 HTML page or empty body). At minimum: `AppException`, `AccessDeniedException`, Bean Validation errors, and a catch-all `Exception` handler.
* **Transactional Isolation:** Analytics queries must run in their own read-only transactions so a slow report cannot hold a lock that blocks operational writes.
* **State Machine Enforcement:** All order status transitions must be validated server-side regardless of what the client sends. The server is the authority; invalid transitions return 400.
* **Idempotent Order Submission:** The server must check for duplicate UUIDs before inserting. An order re-submitted from the offline queue must return 200 (idempotent), not 500.

### 7.5 Toast Notification System

* A non-blocking, auto-dismissing toast system must be present at the global level (outside the route tree) to surface non-fatal errors, warnings, and success confirmations to staff without interrupting order flow.
* Toast types: `error` (red), `warning` (amber), `success` (green), `info` (slate).
* Toasts must auto-dismiss after 5 seconds (errors) or 3 seconds (success/info). Staff can dismiss early.
* Toasts must **never** be the sole indicator of a fatal state — fatal errors must still render a visible recovery UI via error boundaries.

---

## 8. Data & Schema Policy

**This system is in production. There is no backwards compatibility requirement.**

* Schema migrations are destructive by default. Old data is not preserved or migrated unless explicitly required for a specific operational reason.
* New columns are added as `NOT NULL` with no defaults where the domain demands it. Nullable columns are not used as a backwards-compatibility shim.
* Frontend code must never guard against missing or null fields that are defined as required in the current schema. Null checks for required fields indicate stale data and must be treated as a hard error, not silently swallowed.
* When a feature changes the shape of an entity (e.g., adding `pickupTime` to orders), the database is wiped or migrated forward — existing rows are not patched to satisfy the new constraint.
* All development decisions assume a clean slate. Do not write migration paths, dual-code paths, or fallback logic for pre-feature data.