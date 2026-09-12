# ▶️ STARTUP.md

> **Daily run guide.** Assumes **[SETUP.md](./SETUP.md)** is complete.

---

## 🚀 TL;DR — Two Terminals

You need **two long-running processes** at the same time.

| Terminal | Process | Port |
| --- | --- | --- |
| **A** | Python face service | 8000 |
| **B** | Next.js web app | 3000 |

If either is stopped, face recognition won't work — but the rest of the app
still runs (with graceful error messages).

---

## 🅰️ Terminal A — Python Face Service

```bash
cd ~/github/Attendance-Management-Web-App-with-Face-Recognition/attendance-app/python-service
source venv/bin/activate
uvicorn main:app --port 8000 --reload
```

**Expected output**

```
INFO:     Uvicorn running on http://127.0.0.1:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using WatchFiles
INFO:     Application startup complete.
```

Leave this running. `--reload` auto-restarts on `main.py` edits.

> 💡 **Tip:** add a shell alias to save typing:
> ```bash
> echo "alias att='cd ~/github/Attendance-Management-Web-App-with-Face-Recognition/attendance-app/python-service && source venv/bin/activate && uvicorn main:app --port 8000 --reload'" >> ~/.bashrc
> source ~/.bashrc
> ```
> Then just type `att` in any terminal.

---

## 🅱️ Terminal B — Next.js Web App

Open a **new terminal** (don't close Terminal A):

```bash
cd ~/github/Attendance-Management-Web-App-with-Face-Recognition/attendance-app
npm run dev
```

**Expected output**

```
▲ Next.js 14.2.15
- Local:        http://localhost:3000
- Environments: .env

✓ Ready in 1.8s
```

Open **http://localhost:3000** — it redirects to `/attendance`.

---

## 🌐 URLs

| URL | Who | What |
| --- | --- | --- |
| `/` | Anyone | Redirects → `/attendance` |
| `/attendance` | **Public** | Camera + auto attendance marking |
| `/login` | Anyone | Admin sign-in form |
| `/admin` | Admin only | Dashboard (stats + today's list) |
| `/admin/students` | Admin only | CRUD students + face registration |
| `/admin/classes` | Admin only | Manage classes |
| `/admin/years` | Admin only | Manage years |

**Default admin credentials** (from `.env`):
- Username: `admin`
- Password: `admin123`

> Navigate to `/login` directly — there is **no visible link** on the public page.

---

## 🧭 First-Time Flow

1. Open **http://localhost:3000/attendance** — public page
2. Go to **http://localhost:3000/login**
3. Sign in with `admin` / `admin123`
4. You land on **/admin** (dashboard)
5. Go to **Students** → click **Register face** on a student
6. Click **Start Camera** → allow permission → **Capture & Register**
   - Green toast: *"Face registered successfully."*
   - Badge flips from *Not registered* → *Registered*
7. Sign out (top-right) → back to `/attendance`
8. Click **Start Camera** → stand in front of it
9. Within ~2.5 s: *"Attendance marked for \<name\>."*
10. Dashboard now shows **Present Today: 1**

---

## 🔁 Daily Workflow Cheat Sheet

```bash
# Terminal A — face service
cd ~/github/Attendance-Management-Web-App-with-Face-Recognition/attendance-app/python-service
source venv/bin/activate
uvicorn main:app --port 8000 --reload

# Terminal B — web app
cd ~/github/Attendance-Management-Web-App-with-Face-Recognition/attendance-app
npm run dev
```

Stop either with `CTRL + C`.

---

## 🧪 Quick Verification

```bash
# Face service alive?
curl http://127.0.0.1:8000/health
# → {"ok":true}

# Web app alive?
curl -I http://localhost:3000
# → HTTP/1.1 200 OK (or 307 redirect to /attendance)
```

---

## 🛑 Common Startup Problems

| Symptom | Fix |
| --- | --- |
| `Please install face_recognition_models...` | Your venv Python is not 3.11, or `setuptools` is ≥ 81. Rebuild venv with `~/.pyenv/versions/3.11.10/bin/python -m venv venv` and run `pip install "setuptools<81"`. |
| `ModuleNotFoundError: fastapi` | venv not activated. Run `source venv/bin/activate`. |
| `Address already in use :8000` | `lsof -i :8000` then `kill <PID>`. Or run `uvicorn main:app --port 8001` and update `.env`. |
| `Address already in use :3000` | Another Next.js is running. `npm run dev -- -p 3001`. |
| Camera button does nothing | Browser requires `localhost` or HTTPS. Check camera permissions. |
| "Face service is unreachable" | Terminal A is not running, or `.env` has wrong `FACE_SERVICE_URL`. |
| Recognition always says "Face not recognized" | Student's face isn't registered. Register it first in `/admin/students`. |
| Recognition says "No face detected" | Improve lighting, face the camera directly, move closer. |
| Login redirects back to `/login` | Cookies are blocked, or `SESSION_SECRET` changed. Restart `npm run dev`. |
| Admin pages show stale data | Click **Refresh** in the page, or hard-reload the browser (Ctrl+Shift+R). |

---

## 📦 Production Build (Optional)

For a production-style run without hot reload:

```bash
# Web app
npm run build
npm start                    # serves on http://localhost:3000

# Face service
cd python-service
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000 --workers 2
```

> ⚠️ For real production, put the Python service behind a reverse proxy
> (nginx / Caddy), serve Next.js on a proper host, use HTTPS, and
> **change the default admin password**.

---

## 🧹 Reset Everything (Dev Only)

```bash
# Wipe database and reseed
rm prisma/dev.db
npm run db:push
npm run db:seed
```

```bash
# Rebuild Python venv from scratch
cd python-service
deactivate 2>/dev/null
rm -rf venv
~/.pyenv/versions/3.11.10/bin/python -m venv venv
source venv/bin/activate
pip install --upgrade pip wheel
pip install -r requirements.txt
```

---

## ✅ Startup Checklist

- [ ] Terminal A: uvicorn running on `:8000`
- [ ] `curl http://127.0.0.1:8000/health` → `{"ok":true}`
- [ ] Terminal B: `npm run dev` running on `:3000`
- [ ] Browser: http://localhost:3000 loads `/attendance`
- [ ] Camera permission granted on both `/attendance` and `/admin/students`

**Happy coding! 🚀**