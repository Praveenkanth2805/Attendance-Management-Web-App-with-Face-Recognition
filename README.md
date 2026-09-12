<div align="center">

# 🎓 Attendance Management System

### Face-Recognition Powered · Real-Time · Full-Stack

A clean, modern attendance management app that uses **real-time face recognition**
to mark student attendance automatically. Built with **Next.js, TypeScript, Prisma,
SQLite, and a Python OpenCV microservice**.

![Next.js](https://img.shields.io/badge/Next.js-14-000?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38BDF8?logo=tailwindcss&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-5-2D3748?logo=prisma)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi&logoColor=white)

</div>

---

## 📖 Overview

This project was built as a **portfolio project** to demonstrate end-to-end
development of a small but production-quality full-stack system — from
**database schema design** and **backend validation** to **real-time computer
vision** and **polished UI/UX state handling**.

Instead of saving face **images**, the system stores a **128-dimensional face
encoding** (a mathematical signature of a face). Images are processed in memory
and discarded immediately — the only thing persisted is the encoding. This keeps
the database small, fast, and privacy-safe.

> **TL;DR** — Webcam → face encoding → compare with stored encodings → mark
> attendance. No photos stored. Ever.

---

## 🏛️ Architecture at a glance

```
Browser (Next.js)  ──►  Next.js API Routes  ──►  SQLite
                                │
                                ▼
                       Python Face Service
                       (FastAPI + OpenCV + dlib)
```

Two user surfaces:

| Surface | Access | Purpose |
| --- | --- | --- |
| `/attendance` | Public | Webcam → mark attendance |
| `/admin/*` | Login required | Manage students, classes, years |

---

## ✨ Features

### 🖥️ Admin Dashboard (`/admin`)
- Live stats: **Total Students · Present Today · Absent Today · Attendance %**
- Today's attendance table with **Register No., Name, Class, Year, Status, Check-in Time**
- Skeleton loaders · empty states · error states

### 👥 Student Management (`/admin/students`)
- Full CRUD — add / edit / delete students
- **Register Number as Primary Key** (unique, validated on both sides)
- **Gender** field (Male / Female / Other) with colored badges
- **Inline class & year creation** via `+` button (auto-selects after creation)
- **Face registration** per student via webcam
- Searchable list (name, register no., class, year)
- Confirmation dialog before deletion

### 📚 Class & Year Management (`/admin/classes`, `/admin/years`)
- Card-grid view with student counts
- **Add, rename, or delete** — including seeded data
- Duplicate prevention (UI + DB `UNIQUE` constraint)
- Cannot delete a class/year that has students assigned

### 🎥 Attendance Page (`/attendance`)
- **Public, no login required**
- Live webcam with auto-recognition every **2.5 seconds**
- Automatic attendance marking on face match
- **Duplicate prevention** — same student cannot be marked twice per day
  (DB-enforced `UNIQUE(register_number, date)`)
- Clear status states: *Idle · Processing · Face Not Recognized · Match Found ·
  Already Marked · Error*
- Today's attendance list refreshes automatically

### 🛡️ Validation & Error Handling
- **Both frontend and backend** validation
- Field-level error messages next to inputs
- Graceful degradation when the Python service is offline
- Duplicate-request prevention (buttons disable; recognition loop uses `inFlightRef`)

### 🎨 UI/UX
- **Green brand theme** on a white background (education-appropriate)
- Responsive design (mobile drawer + desktop sidebar)
- Toast notifications, spinners, skeleton loaders
- Modal-based workflows, no page reloads

---

## 🚀 Quick Start

### Setup (one-time)

See **[SETUP.md](./SETUP.md)** for full instructions.

TL;DR:

```bash
# 1) Node deps
npm install

# 2) DB
npm run db:push && npm run db:generate && npm run db:seed

# 3) Python 3.11 venv
cd python-service
curl https://pyenv.run | bash    # if you don't have Python 3.11
exec "$SHELL"
pyenv install 3.11.10
~/.pyenv/versions/3.11.10/bin/python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

> 🪟 **Windows users:** just double-click `setup.bat` and `start.bat`.

### Run (every day)

See **[STARTUP.md](./STARTUP.md)**.

```bash
# Terminal A — face service
cd python-service && source venv/bin/activate
uvicorn main:app --port 8000 --reload

# Terminal B — web app
npm run dev
```

- Public: **http://localhost:3000/attendance**
- Admin login: **http://localhost:3000/login** (`admin` / `admin123` by default)

---

## 📚 Documentation

| Doc | Purpose |
| --- | --- |
| **[SETUP.md](./SETUP.md)** | One-time install & configuration |
| **[STARTUP.md](./STARTUP.md)** | Daily run, verification, troubleshooting |
| **[SPECIFICATION.md](./SPECIFICATION.md)** | Full tech spec, schema, architecture, security model |

---

## 🧱 Tech Stack

| Layer | Tech |
| --- | --- |
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Styling | Tailwind CSS 3 |
| ORM | Prisma 5 |
| Database | SQLite |
| Auth | HMAC-signed cookie, edge middleware |
| Face service | Python **3.11**, FastAPI, Uvicorn |
| Vision | dlib 19.24.6, face_recognition 1.3.0, OpenCV 4.10 |

> ⚠️ **Python 3.11 is required.** `face_recognition` breaks on 3.12+.

---

## 🔐 Privacy

- **No photos are stored.** Only a 128-float encoding per student.
- Attendance is append-only, protected by `UNIQUE(register_number, date)`.
- Register Number is the primary key of `Student`.
- Class and Year names are `UNIQUE` at the DB level.

---

## 🗺️ Roadmap

- [ ] Attendance history page + date filters
- [ ] CSV / Excel export
- [ ] Multi-face detection in a single frame
- [ ] Docker Compose for one-command startup
- [ ] Postgres migration path

---

## 👨‍💻 Author

<div align="center">

### **Praveenkanth G**

**Software Developer · Agentic Engineer · AI-Assisted Developer**

📍 Villupuram, Tamil Nadu, India

[![GitHub](https://img.shields.io/badge/GitHub-Praveenkanth2805-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/Praveenkanth2805)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-praveenkanth2805-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://in.linkedin.com/in/praveenkanth2805)
[![Instagram](https://img.shields.io/badge/Instagram-@praveenkanth2805-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://www.instagram.com/praveenkanth2805/)

</div>

---

## 📄 License

Released under the **MIT License** — free to use, modify, and distribute.
See `LICENSE` for details.

---

<div align="center">

**⭐ If you found this project useful, consider giving it a star!**

</div>