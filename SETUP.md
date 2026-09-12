# 🛠️ SETUP.md

> **One-time setup guide.** Run this once after cloning the repo.
> For daily usage, see **[STARTUP.md](./STARTUP.md)**.

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Clone the Repository](#2-clone-the-repository)
3. [Install Node Dependencies](#3-install-node-dependencies)
4. [Configure Environment Variables](#4-configure-environment-variables)
5. [Initialize the Database](#5-initialize-the-database)
6. [Set Up the Python Face Service](#6-set-up-the-python-face-service)
7. [Verify the Installation](#7-verify-the-installation)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Prerequisites

| Tool | Version | Why |
| --- | --- | --- |
| **Node.js** | 18+ | Next.js app |
| **npm** | 9+ | Package manager |
| **Python** | **3.11.x exactly** | `face_recognition` / `dlib` break on 3.12+ |
| **pip** | latest | Python packages |
| **Git** | any | Version control |
| **CMake** | 3.15+ | dlib build |
| **Build tools** | gcc, g++, make | dlib C++ compile |

> ⚠️ **Python 3.11 is mandatory.** Version 3.12 and later removed
> `pkg_resources` from `setuptools`, which `face_recognition_models` depends on.
> **Do not use your system Python** — use pyenv (see Step 6).

### Install build tools

**macOS**
```bash
brew install cmake
xcode-select --install   # if not already installed
```

**Ubuntu / Debian / Parrot OS**
```bash
sudo apt update
sudo apt install -y cmake build-essential libopenblas-dev liblapack-dev \
                    curl git make
```

**Windows**
- Install CMake from https://cmake.org/download/
- Install Visual Studio Build Tools (C++ workload)
- Then in an activated venv: `pip install cmake`

---

## 2. Clone the Repository

```bash
git clone https://github.com/<your-username>/attendance-app.git
cd attendance-app
```

---

## 3. Install Node Dependencies

```bash
npm install
```

---

## 4. Configure Environment Variables

Create a `.env` file in the **project root**:

```env
# --- Database ---
DATABASE_URL="file:./dev.db"

# --- Python face service ---
FACE_SERVICE_URL="http://127.0.0.1:8000"

# --- Admin credentials ---
ADMIN_USERNAME="admin"
ADMIN_PASSWORD="admin123"

# --- Session signing secret (MUST be ≥16 chars) ---
SESSION_SECRET="replace-with-a-long-random-string"

# --- Shown in admin nav bar ---
NEXT_PUBLIC_SCHOOL_NAME="Your College Name"
```

**Generate a strong session secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

> 🔐 Never commit `.env`. A `.env.example` file is committed as a template.

---

## 5. Initialize the Database

```bash
npm run db:push
npm run db:generate
npm run db:seed
```

Expected output:
```
🌱 Seeding database...
   ✓ Classes: CSE-A, CSE-B, IT-A, ECE-A
   ✓ Years: 1st Year, 2nd Year, 3rd Year, 4th Year
   ✓ Students: 14
✅ Seed complete.
```

> If you're re-running after a schema change:
> ```bash
> npm run db:push -- --accept-data-loss
> npm run db:seed
> ```

---

## 6. Set Up the Python Face Service

### 6.1 Install Python 3.11 via pyenv

**Why pyenv?** Your system Python (3.13 on most current distros) will break
`dlib` and `face_recognition`. pyenv installs a **separate, isolated Python**
for your user without touching the system one.

```bash
# 1) Install pyenv dependencies
#    (Ubuntu / Debian / Parrot OS)
sudo apt update
sudo apt install -y make build-essential libssl-dev zlib1g-dev \
  libbz2-dev libreadline-dev libsqlite3-dev wget curl llvm \
  libncursesw5-dev xz-utils tk-dev libxml2-dev libxmlsec1-dev \
  libffi-dev liblzma-dev git

#    macOS
brew install openssl readline sqlite3 xz zlib tcl-tk

# 2) Install pyenv
curl https://pyenv.run | bash

# 3) Add pyenv to your shell
echo 'export PYENV_ROOT="$HOME/.pyenv"' >> ~/.bashrc
echo 'command -v pyenv >/dev/null || export PATH="$PYENV_ROOT/bin:$PATH"' >> ~/.bashrc
echo 'eval "$(pyenv init -)"' >> ~/.bashrc

# 4) Reload shell
exec "$SHELL"

# 5) Verify
pyenv --version
# → pyenv 2.x.x

# 6) Install Python 3.11.10
pyenv install 3.11.10
# ⏳ Takes 3–8 minutes (compiles from source)
```

> 💡 We do **not** run `pyenv global 3.11.10` — that would change your system
> Python. Instead, we use the full path when creating the venv below.

### 6.2 Create the virtual environment

```bash
cd python-service

# Use the specific 3.11 Python directly
~/.pyenv/versions/3.11.10/bin/python -m venv venv

# Activate
source venv/bin/activate          # macOS / Linux
# .venv\Scripts\activate           # Windows PowerShell

# Verify
python --version
# MUST show: Python 3.11.10
```

### 6.3 Install Python dependencies

```bash
pip install --upgrade pip wheel
pip install -r requirements.txt
```

`requirements.txt` installs:

| Package | Purpose |
| --- | --- |
| `setuptools<81` | Provides `pkg_resources` for face_recognition_models |
| `dlib==19.24.6` | Face detection engine (compiles from source, 5–15 min) |
| `face_recognition_models==0.3.0` | Pre-trained model weights (~100 MB) |
| `face_recognition==1.3.0` | High-level face API |
| `opencv-python==4.10.0.84` | Image decoding |
| `numpy==1.26.4` | Numerical ops |
| `fastapi==0.115.0` | Web framework |
| `uvicorn[standard]==0.31.1` | ASGI server |
| `python-multipart==0.0.12` | File upload support |

> ⏳ **Total install time: 8–20 minutes** (dlib is the slow one).

---

## 7. Verify the Installation

### 7.1 Python side

```bash
python -c "import dlib; print('✓ dlib', dlib.__version__)"
python -c "import face_recognition_models; print('✓ models')"
python -c "import face_recognition; print('✓ face_recognition')"
python -c "import cv2; print('✓ OpenCV', cv2.__version__)"
python -c "import fastapi; print('✓ fastapi', fastapi.__version__)"
```

All 5 must print `✓`.

### 7.2 Start the service

```bash
uvicorn main:app --port 8000
```

Expected:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### 7.3 Health-check from another terminal

```bash
curl http://127.0.0.1:8000/health
# → {"ok":true}
```

### 7.4 Start the Next.js app

```bash
npm run dev
# → http://localhost:3000
```

Open the dashboard. If it loads with stats → **setup complete**. ✅

**Setup done → proceed to [STARTUP.md](./STARTUP.md)**

---

## 8. Troubleshooting

### ❌ `Error: Unable to locate package python3.11`

Your distro (e.g., Parrot OS) doesn't ship Python 3.11 in its default repos.
Use **pyenv** (Step 6.1). Do **not** add random PPAs to a security-focused
distro like Parrot.

### ❌ `Please install face_recognition_models with this command before using face_recognition`

You're using Python 3.12+ or `setuptools 81+`. Both cause this error.

**Fix:**
```bash
pip install "setuptools<81"
python -c "import pkg_resources; print('OK')"
```

If it still fails → your Python is 3.12+. Rebuild venv with Python 3.11
(Step 6.2).

### ❌ `CMake is not installed on your system!`

```bash
sudo apt install -y cmake build-essential libopenblas-dev liblapack-dev
```

### ❌ `Failed building wheel for dlib`

**macOS:** `brew install cmake && xcode-select --install`

**Linux:** install CMake + build tools (see above), then retry.

**Last resort:** `pip install dlib-bin` (pre-built wheel — fast, community-maintained).

### ❌ `error: externally-managed-environment`

You're **not in the venv**. Run `source venv/bin/activate` first.

### ❌ `ModuleNotFoundError: No module named 'fastapi'`

Same reason — activate the venv.

### ❌ `Address already in use :8000`

```bash
lsof -i :8000        # find the PID
kill <PID>
```

Or run on a different port and update `.env`:
```bash
uvicorn main:app --port 8001
# and set FACE_SERVICE_URL="http://127.0.0.1:8001"
```

### ❌ `Unable to access camera`

- Browsers require **HTTPS or localhost** for `getUserMedia`
- `http://localhost:3000` works
- `http://192.168.x.x` does **not** (unless you enable insecure origin in `chrome://flags`)

### ❌ `PrismaClientInitializationError`

```bash
npm run db:push
npm run db:generate
```

### ❌ Login fails with correct credentials

- Restart `npm run dev` after editing `.env`
- Check for trailing spaces in `.env` values
- Confirm `SESSION_SECRET` is ≥16 chars

---

## ✅ Setup Checklist

- [ ] Node 18+ installed
- [ ] Build tools (cmake, gcc, make) installed
- [ ] Repo cloned
- [ ] `npm install` succeeded
- [ ] `.env` created with all 6 keys
- [ ] `npm run db:push && npm run db:generate && npm run db:seed` succeeded
- [ ] pyenv installed and Python 3.11.10 available (`pyenv versions`)
- [ ] venv created with the **3.11** Python explicitly
- [ ] `pip install -r requirements.txt` succeeded
- [ ] All 5 Python verify commands print `✓`
- [ ] `uvicorn main:app --port 8000` starts without errors
- [ ] `curl http://127.0.0.1:8000/health` → `{"ok":true}`
- [ ] `npm run dev` loads the dashboard

**Setup done → proceed to [STARTUP.md](./STARTUP.md)**