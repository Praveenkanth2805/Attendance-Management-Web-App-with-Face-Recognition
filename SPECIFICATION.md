# 📐 SPECIFICATION.md

> Complete technical and system specification for the Attendance Management Web App.

---

## 1. Overview

A small, self-hosted attendance management system that uses **real-time face recognition**
to mark student attendance automatically. Designed as a **portfolio project** to
demonstrate end-to-end full-stack + computer-vision development.

**Two distinct user surfaces:**

| Surface | Access | Purpose |
| --- | --- | --- |
| **Public** — `/attendance` | No authentication | Students/operators mark attendance via webcam |
| **Admin** — `/admin/*` | Cookie-based login | Manage students, classes, years; view dashboard |

---

## 2. Tech Stack

| Layer | Technology | Version |
| --- | --- | --- |
| **Frontend framework** | Next.js (App Router) | 14.2.15 |
| **Language** | TypeScript | 5.6+ |
| **Styling** | Tailwind CSS | 3.4+ |
| **ORM** | Prisma | 5.20+ |
| **Database** | SQLite | 3 |
| **Runtime (Node)** | Node.js | 18+ |
| **Face service framework** | FastAPI | 0.115.0 |
| **Face service server** | Uvicorn (standard) | 0.31.1 |
| **Face detection** | dlib | 19.24.6 |
| **Face recognition** | face_recognition | 1.3.0 |
| **Pre-trained models** | face_recognition_models | 0.3.0 |
| **Image processing** | OpenCV (`opencv-python`) | 4.10.0.84 |
| **Numerical** | NumPy | 1.26.4 |
| **Python runtime** | Python | **3.11.x** (required) |

### Why Python 3.11 specifically?

`face_recognition` and `dlib` are last actively maintained around 2020–2021.
Python 3.12+ introduced breaking changes (e.g., `pkg_resources` removal in
`setuptools 81+`) that break these libraries. **Python 3.11 is the newest
version where the full stack is stable.**

---

## 3. System Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    BROWSER (Next.js)                          │
│                                                               │
│   /attendance  ──── public, camera only                       │
│   /login       ──── admin sign-in                             │
│   /admin/*     ──── protected (cookie session)                │
└────────────┬──────────────────────────────────────────────────┘
             │
             │ HTTPS / fetch (JSON, base64 JPEG frames)
             ▼
┌──────────────────────────────────────────────────────────────┐
│                NEXT.JS API ROUTES (Node runtime)              │
│                                                               │
│   /api/auth/*        session issue / revoke                   │
│   /api/dashboard     stats + today's list                     │
│   /api/classes       create / list                            │
│   /api/classes/[id]  delete                                   │
│   /api/years         create / list                            │
│   /api/years/[id]    delete                                   │
│   /api/students      create / list / search                   │
│   /api/students/[rn] update / delete / face register          │
│   /api/attendance    list for a date                          │
│   /api/recognize     face → student → mark attendance         │
└──────┬─────────────────────────────────────────┬──────────────┘
       │ Prisma Client                            │ HTTP (JSON)
       ▼                                          ▼
┌──────────────────────┐              ┌────────────────────────┐
│   SQLite (dev.db)    │              │  PYTHON FACE SERVICE   │
│                      │              │  FastAPI on :8000      │
│  classes             │              │                        │
│  years               │              │  POST /encode          │
│  students            │              │  POST /recognize       │
│  attendance          │              │  GET  /health          │
└──────────────────────┘              └────────────────────────┘
```

**Middleware** (`src/middleware.ts`) runs at the edge and gates `/admin/*` —
unauthenticated requests redirect to `/login?from=<original-path>`.

---

## 4. Database Schema

Four tables. Simple, normalized, all integrity enforced at the DB level.

### `Class`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `name` | TEXT | NOT NULL, **UNIQUE** |

### `Year`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `name` | TEXT | NOT NULL, **UNIQUE** |

### `Student`

| Column | Type | Constraints |
| --- | --- | --- |
| `register_number` | TEXT | **PRIMARY KEY** |
| `name` | TEXT | NOT NULL |
| `gender` | TEXT (enum) | `MALE` \| `FEMALE` \| `OTHER`, NOT NULL |
| `class_id` | INTEGER | FOREIGN KEY → `Class.id` |
| `year_id` | INTEGER | FOREIGN KEY → `Year.id` |
| `face_encoding` | TEXT (JSON) | Nullable — 128 floats as JSON array |

### `Attendance`

| Column | Type | Constraints |
| --- | --- | --- |
| `id` | INTEGER | PRIMARY KEY, AUTOINCREMENT |
| `register_number` | TEXT | FOREIGN KEY → `Student.register_number` (CASCADE) |
| `date` | TEXT (`YYYY-MM-DD`) | NOT NULL |
| `check_in_time` | TEXT (`HH:MM:SS`) | NOT NULL |
| — | — | **UNIQUE(`register_number`, `date`)** |

The `UNIQUE(register_number, date)` constraint is the **single source of truth**
for duplicate-attendance prevention. The API catches Prisma's `P2002` error
and returns a friendly message.

---

## 5. Face Recognition Pipeline

### 5.1 Registration (one-time per student)

```
Webcam
  ↓ (JPEG, base64)
POST /api/students/:regNo/face
  ↓
Python: POST /encode
  ↓
dlib HOG face detector → 1 face required
  ↓
face_recognition.face_encodings() → 128-dim vector
  ↓
Return encoding → store in students.face_encoding (JSON string)
  ↓
⚠️ Image discarded — never persisted
```

**Guards:**
- 0 faces → `422 "No face detected"`
- 2+ faces → `422 "Multiple faces detected"`
- No encoding extracted → `422 "Could not extract face features"`

### 5.2 Recognition (per webcam frame)

```
Browser every 2.5 s (or on-demand)
  ↓ (JPEG, base64)
POST /api/recognize
  ↓
Load all students with face_encoding
  ↓
Python: POST /recognize { image, known[] }
  ↓
Face detection → 1+ faces
  ↓
For each face → compare against all known encodings
  ↓
Match if Euclidean distance < 0.55  ← tuned threshold
  ↓
Return best match (register_number)
  ↓
Next.js checks attendance for today
  ↓
INSERT (register_number, date, time) — or return "already marked"
```

**Distance threshold:** `0.55` is the well-known dlib sweet spot — below it two
encodings are almost certainly the same person; above it they're different.
Tighten to `0.45` for higher security, loosen to `0.65` for higher recall.

---

## 6. Data Flow — Typical Day

```
09:00  Student walks up to webcam at /attendance
09:01  Camera captures frame → /api/recognize
09:01  Python matches face → returns CS2021001
09:01  /api/recognize inserts Attendance(CS2021001, 2026-09-12, 09:01:32)
09:01  UI shows green "Present" card + toast
09:02  Admin opens /admin → Dashboard shows "Present Today: 1"
```

---

## 7. Security Model

| Concern | Implementation |
| --- | --- |
| **Admin authentication** | HMAC-SHA256 signed cookie (`admin_session`) |
| **Session lifetime** | 8 hours (`SESSION_MAX_AGE`) |
| **Session secret** | `SESSION_SECRET` env var (≥16 chars required) |
| **Cookie flags** | `httpOnly`, `sameSite=lax`, `secure` in prod |
| **Middleware** | Edge runtime, verifies signature on every `/admin/*` hit |
| **Face data** | Only encodings stored — **images never persisted** |
| **Credentials** | Single admin user via `ADMIN_USERNAME` / `ADMIN_PASSWORD` |
| **No PII leak** | Attendance API returns only what the UI needs |

### What this system is *not*

- Not multi-tenant
- Not role-based (single admin)
- Not intended for internet-facing deployment without additional hardening
  (rate limiting, HTTPS termination, CSRF tokens, password hashing)

For a portfolio project, that's an acceptable trade-off — but **do not put
this on the public internet as-is**.

---

## 8. Validation Strategy

Validation runs on **both frontend and backend**, with the DB as final guard.

| Field | Client | Server | DB |
| --- | --- | --- | --- |
| Register number format | ✅ | ✅ | — |
| Register number uniqueness | (on submit) | ✅ | ✅ PRIMARY KEY |
| Name length / whitespace | ✅ | ✅ | NOT NULL |
| Gender enum | ✅ | ✅ | NOT NULL |
| Class/Year existence | (on select) | ✅ | FOREIGN KEY |
| Class/Year uniqueness | (on submit) | ✅ | ✅ UNIQUE |
| Attendance duplicate | (UI check) | ✅ | ✅ UNIQUE |
| Face encoding presence | — | ✅ | — |

Shared validation logic lives in `src/lib/validation.ts` — imported by both
client components and API routes.

---

## 9. UI State Model

Every async operation follows the same pattern:

| State | UI |
| --- | --- |
| **Idle** | Default view |
| **Loading (initial)** | Skeleton blocks |
| **Loading (action)** | Button spinner + disabled |
| **Empty** | Centered message with CTA |
| **Success** | Toast + list/table refresh |
| **Validation error** | Inline message near field |
| **Server error** | Toast + retry link |
| **Network error** | Toast + retry link |

**Duplicate submission prevention:**
- Every `Button` accepts a `loading` prop that disables it
- Recognition loop uses `inFlightRef` to skip frames while a request is active
- Buttons like "Add Class" set `adding = true` before `fetch` and only reset in `finally`

---

## 10. Non-Functional Requirements

| Category | Target |
| --- | --- |
| **First contentful paint** | < 1.5 s on localhost |
| **Recognition latency** | < 500 ms per frame (single face) |
| **Recognition frequency** | Every 2.5 s while camera is on |
| **Concurrent admin sessions** | 1 (single-user assumption) |
| **Database size (500 students)** | < 5 MB |
| **Memory footprint (Python service)** | ~250 MB (dlib models loaded) |
| **Browser support** | Chrome / Edge / Firefox / Safari (latest) |
| **Mobile support** | Responsive down to 375 px width |

---

## 11. Project Structure

```
attendance-app/
├── prisma/
│   ├── schema.prisma              # DB schema + enums
│   ├── seed.ts                    # sample data seeder
│   └── dev.db                     # SQLite file (gitignored)
├── python-service/
│   ├── main.py                    # FastAPI /encode & /recognize
│   ├── requirements.txt           # pinned Python deps
│   └── venv/                      # local venv (gitignored)
├── src/
│   ├── app/
│   │   ├── layout.tsx             # root + ToastProvider
│   │   ├── page.tsx               # redirect → /attendance
│   │   ├── globals.css
│   │   ├── login/page.tsx         # admin sign-in
│   │   ├── attendance/
│   │   │   ├── layout.tsx         # public header
│   │   │   └── page.tsx           # camera + recognition
│   │   ├── admin/
│   │   │   ├── layout.tsx         # topbar + sidebar
│   │   │   ├── page.tsx           # dashboard
│   │   │   ├── students/page.tsx
│   │   │   ├── classes/page.tsx
│   │   │   └── years/page.tsx
│   │   └── api/
│   │       ├── auth/{login,logout}/route.ts
│   │       ├── dashboard/route.ts
│   │       ├── classes/route.ts + [id]/route.ts
│   │       ├── years/route.ts + [id]/route.ts
│   │       ├── students/route.ts + [registerNumber]/route.ts
│   │       │                     + [registerNumber]/face/route.ts
│   │       ├── attendance/route.ts
│   │       └── recognize/route.ts
│   ├── components/
│   │   ├── AdminSidebar.tsx       # green sidebar, SVG icons
│   │   ├── AdminTopBar.tsx        # school name + signout
│   │   ├── PublicHeader.tsx
│   │   ├── SignOutButton.tsx      # confirm dialog
│   │   ├── ClassSelect.tsx        # inline + modal
│   │   ├── YearSelect.tsx
│   │   ├── StudentFormModal.tsx
│   │   ├── FaceRegisterModal.tsx
│   │   ├── ConfirmDialog.tsx
│   │   ├── Modal.tsx
│   │   ├── Button.tsx
│   │   ├── Spinner.tsx
│   │   ├── StatCard.tsx
│   │   ├── Toast.tsx
│   │   ├── Nav.tsx (deprecated)
│   │   └── icons.tsx              # SVG icon set
│   ├── lib/
│   │   ├── prisma.ts              # singleton client
│   │   ├── auth.ts                # HMAC session helpers
│   │   ├── validation.ts          # shared validators
│   │   ├── date.ts                # YYYY-MM-DD + HH:MM:SS
│   │   └── faceService.ts         # Python HTTP client
│   └── middleware.ts              # /admin/* gate
├── .env                           # secrets (gitignored)
├── .env.example                   # template (committed)
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── postcss.config.js
├── next.config.js
├── README.md
├── SETUP.md                       # one-time install
├── STARTUP.md                     # daily run
└── SPECIFICATION.md               # this file
```

---

## 12. Environment Variables

| Variable | Required | Purpose | Example |
| --- | --- | --- | --- |
| `DATABASE_URL` | ✅ | SQLite connection string | `file:./dev.db` |
| `FACE_SERVICE_URL` | ✅ | Python service base URL | `http://127.0.0.1:8000` |
| `ADMIN_USERNAME` | ✅ | Admin login username | `admin` |
| `ADMIN_PASSWORD` | ✅ | Admin login password | `admin123` |
| `SESSION_SECRET` | ✅ | HMAC signing key (≥16 chars) | `openssl rand -hex 32` |
| `NEXT_PUBLIC_SCHOOL_NAME` | ⚠️ recommended | Shown in admin nav bar | `Your College Name` |

---

## 13. Out of Scope

The following are **intentionally not included** to keep the project small
and readable:

- ❌ Multi-user authentication / registration
- ❌ Roles and permissions (RBAC)
- ❌ Password hashing (single admin, plaintext compare)
- ❌ Rate limiting
- ❌ CSRF tokens
- ❌ Email / SMS notifications
- ❌ Attendance reports / CSV export
- ❌ Multiple faces per student
- ❌ Liveness detection (photo-of-photo attacks possible)
- ❌ HTTPS termination
- ❌ Containerization
- ❌ CI/CD pipelines
- ❌ Unit / integration tests

Any of these can be added later without changing the existing architecture.

---

## 14. Versioning

Current: **v0.1.0** — portfolio-ready MVP.

Suggested roadmap:

| Version | Focus |
| --- | --- |
| v0.1.x | Bug fixes, docs polish |
| v0.2.x | Attendance history page + CSV export |
| v0.3.x | Multi-face detection per frame |
| v0.4.x | Docker Compose |
| v1.0.x | Postgres migration, HTTPS, deploy scripts |

---

<div align="center">

**Attendance Management Web App** · SPECIFICATION.md · v0.1.0

</div>