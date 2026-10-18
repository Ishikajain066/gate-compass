# GATE COMPASS — CS + DA Preparation Tracker

> **Dual-Track Preparation Engine for GATE 2027 (Computer Science & Information Technology + Data Science & Artificial Intelligence)**  
> Built for a 90-Day, 3-Hour daily focused study sprint with zero duplicate effort and strictly isolated placement tracking.

---

## 🎯 Architecture & Guiding Principles

1. **Official IIT Madras Syllabus as Ground Truth**:
   - **CS (10 Sections)**: Engineering Mathematics, Digital Logic, COA, Programming and Data Structures, Algorithms, Theory of Computation, Compiler Design, Operating Systems, Databases, Computer Networks.
   - **DA (7 Sections)**: Probability and Statistics, Linear Algebra, Calculus and Optimization, Programming, Data Structures and Algorithms, Database Management and Warehousing, Machine Learning, Artificial Intelligence.
2. **Anti-Double-Counting Rule**:
   - Shared topics (such as Linear Algebra Core, Single-Variable Calculus, Probability Foundations, Basic Data Structures & Algorithms, Relational DBs, Propositional Logic) advance both CS and DA dashboards simultaneously when completed.
   - However, study time (actual minutes) is stored against a single canonical topic ID. A 60-minute study session on Linear Algebra counts as **60 minutes** toward your daily 180-minute GATE target — never 120 minutes.
3. **Strict Placement Isolation**:
   - Campus placement prep (DSA, Aptitude, Core CS, System Design, Projects, Resume) is kept strictly isolated. Activity here never alters GATE statistics, streaks, or daily study target hours.
4. **No Fabricated Data**:
   - New users start at 0% progress and 0 minutes. All figures are computed in real time from persistent database records.

---

## 🛠 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: JavaScript (ESM) / React 18
- **Styling**: Tailwind CSS (Warm off-white theme, clean typography, soft lavender/indigo highlights)
- **Icons**: Lucide React
- **Charts**: Recharts (Responsive bar charts, status breakdown pies)
- **Database**: SQLite-compatible persistent database via **Turso** (`@libsql/client`) and **Drizzle ORM**
  - *Local Development*: Persistent local file (`file:gate_compass.db`)
  - *Production / Vercel*: Turso cloud database (`libsql://...`)
- **Micro-Animations**: Canvas Confetti for daily target achievements

---

## 📁 Project Structure

```
gate-compass/
├── src/
│   ├── app/
│   │   ├── page.jsx                # Overview Dashboard (Hero, Countdown, 4 Cards, Today's Plan, Charts)
│   │   ├── syllabus/page.jsx       # Syllabus Tracker (Atomic topics, 4 checkboxes: T/P/PYQ/R)
│   │   ├── common-topics/page.jsx  # Common Topics (Side-by-side comparison of shared vs extensions)
│   │   ├── gate-cs/page.jsx        # GATE CS 10 Sections View
│   │   ├── gate-da/page.jsx        # GATE DA 7 Sections View
│   │   ├── daily-plan/page.jsx     # Daily Study Plan (3 configurable 60m blocks, timer sync)
│   │   ├── revision/page.jsx       # Revision Center (Overdue, Upcoming, Completed, Spaced Repetition)
│   │   ├── calendar/page.jsx       # Study Calendar & 90-Day Roadmap (Phase 1, 2, 3)
│   │   ├── analytics/page.jsx      # Analytics (Verified hours, trends, weak topics)
│   │   ├── placement/page.jsx      # Placement Preparation (Independent from GATE)
│   │   ├── settings/page.jsx       # Target daily minutes, start date, DB management
│   │   └── api/                    # Serverless API routes (stats, syllabus, progress, daily-plan, etc.)
│   ├── components/
│   │   ├── Sidebar.jsx             # Collapsible sidebar + mobile drawer
│   │   ├── Header.jsx              # Day countdown pill, today study time gauge, quick timer
│   │   ├── StudyTimerModal.jsx     # Live stopwatch/timer modal with session logging
│   │   └── TopicDetailModal.jsx    # Topic modal for notes, mistakes, confidence, revision date
│   └── lib/
│       ├── db/
│       │   ├── index.js            # Turso / LibSQL client factory
│       │   ├── schema.js           # Drizzle ORM SQLite schema definitions
│       │   ├── seed-data.js        # Exact syllabus items from official CS & DA PDFs
│       │   └── init.js             # DDL and idempotent seeder
│       └── utils.js                # Date, minute formatters, and day calculations
├── scripts/
│   └── seed.mjs                    # Standalone CLI seeding script
├── .env.example                    # Environment variable template
├── drizzle.config.mjs              # Drizzle ORM configuration
└── package.json
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js 18+ (tested on Node v22.17.1)
- npm or pnpm

### 2. Installation
```bash
# Clone or navigate to the directory
cd gate-compass

# Install dependencies
npm install
```

### 3. Initialize & Seed Database
The application automatically creates tables and seeds the official GATE 2027 CS & DA syllabuses on first run. You can also seed manually anytime:
```bash
npm run db:seed
```
*This creates and populates `gate_compass.db` in the project root.*

### 4. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## ☁️ Persistent Production Database (Turso) Setup

> [!IMPORTANT]
> **Action Required from You**: For production on Vercel, a persistent database URL is required (since Vercel serverless functions have ephemeral file systems). Setting up Turso takes less than 2 minutes and is free.

### Step 1: Install Turso CLI or Sign Up Online
- Sign up at [https://turso.tech](https://turso.tech) or install via terminal:
  - macOS/Linux: `curl -sSfL https://get.tur.so/install.sh | bash`
  - Windows: `irm https://get.tur.so/install.ps1 | iex`

### Step 2: Create a Database
```bash
turso auth login
turso db create gate-compass
```

### Step 3: Get Database URL and Auth Token
```bash
# Get the Database URL (starts with libsql://)
turso db show gate-compass --url

# Generate a permanent JWT Auth Token
turso db tokens create gate-compass
```

### Step 4: Configure Local `.env.local` (Optional for local testing with remote Turso)
```env
TURSO_DATABASE_URL=libsql://gate-compass-your-username.turso.io
TURSO_AUTH_TOKEN=your_generated_turso_token
```
Run `npm run db:seed` to seed your remote Turso instance directly!

---

## ▲ Deploying to Vercel

### Step 1: Push Code to GitHub / GitLab
```bash
git init
git add .
git commit -m "Initial commit of GATE COMPASS"
git remote add origin <your-repo-url>
git push -u origin main
```

### Step 2: Import Project in Vercel
1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Select your repository.
3. Framework Preset: **Next.js**.

### Step 3: Add Environment Variables in Vercel
In the **Environment Variables** section of the Vercel project configuration, add:
- `TURSO_DATABASE_URL`: Your Turso connection URL (e.g. `libsql://gate-compass-your-username.turso.io`)
- `TURSO_AUTH_TOKEN`: Your Turso token

### Step 4: Deploy
Click **Deploy**. Once deployed:
- Visit your deployment URL (e.g. `https://gate-compass.vercel.app`).
- The application will automatically initialize the database schema and seed the official GATE 2027 CS & DA syllabuses upon first request!
- You can also navigate to **Settings** -> **Sync / Re-seed Syllabus Topics** at any time.

---

## 🧭 Database Schema Overview

| Table | Purpose |
|---|---|
| `subjects` | 17 subjects: 10 CS sections + 7 DA sections extracted directly from official IIT Madras PDFs |
| `topics` | 55 thematic topic groupings (`COMMON`, `CS_ONLY`, `DA_ONLY`) |
| `subtopics` | 255 atomic syllabus items (158 in CS, 97 in DA) with exact PDF fidelity |
| `subtopic_progress` | Atomic progress per subtopic (status, Theory, Practice, PYQs, Revision checkboxes, 1–5 confidence stars, notes, mistakes, next revision date) |
| `study_sessions` | Canonical single-log study records (anti-double-counting strictly enforced) |
| `daily_plans` | 3 daily 60-minute blocks (180m target), editable duration, activity & tracks |
| `revision_records` | Spaced repetition revisions (Overdue, Upcoming, Completed) |
| `placement_items` | Isolated campus placement tasks (DSA, Aptitude, Core CS, Projects, Resume) |
| `user_settings` | Daily target minutes (default 180), start date, total days |

