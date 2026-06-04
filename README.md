# AcademiQ — Academic Success Platform

A full-stack academic management platform that helps college students organize courses, track exams, generate AI-powered study plans, set goals, and receive smart reminders across email, SMS, push, and in-app notifications.

## Features

### 📚 Course Management
- Browse and enroll in courses
- Upload syllabus PDFs for **AI-powered parsing** (extracts exam dates, topics, weightage automatically)
- Auto-generate study plans from parsed syllabus data

### 📝 Exam Schedule Manager
- **List View** — Exams grouped by Today → Tomorrow → This Week → Later, color-coded by urgency
- **Calendar View** — Month calendar with colored dots per exam type; click any date to see details
- **Batch Import** — Paste your full exam timetable at once (auto-parses course code, date, time, room)
- Structured fields: **Building**, **Room Number**, **Seat Number**, **Instructions**
- Set reminders (email + push) for each exam
- One-click **Study Plan generation** per exam

### 🧠 AI Study Plans
- Distributes topics across available days before an exam
- Daily schedules with time slots, priority levels, and progress tracking
- Mark tasks as complete and track overall percentage

### 🎯 Goal Setting
- Create academic goals with milestones
- Track progress toward target GPA
- Overdue goal detection

### 🔔 Multi-Channel Notifications
- **Email** (SMTP / SendGrid)
- **SMS** (Twilio)
- **Push** (Firebase / VAPID)
- **In-App** (WebSocket real-time)
- Configurable per-user preferences

### 📊 Dashboard
- At-a-glance stats: enrolled courses, upcoming exams, active plans, goals
- Today's study tasks widget
- Upcoming exams and quizzes widgets
- Recent activity view

### 🔐 Security & Authentication
- **Email OTP verification** — 6-digit code sent on registration
- **Password strength validation** (uppercase, lowercase, digit required)
- JWT-based authentication with token refresh
- Change password flow

### 🌙 Dark Mode
- Toggle between light and dark themes
- Preference persisted in localStorage
- Full support across all pages

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python Django 4, Django REST Framework |
| **Frontend** | React 18 + Vite, Tailwind CSS, react-calendar |
| **Mobile** | React Native (cross-platform) |
| **Database** | SQLite (dev) / PostgreSQL (production) |
| **Cache/Queue** | Redis + Celery (scheduled reminders) |
| **AI/NLP** | spaCy (optional), regex-based fallback |
| **SMS** | Twilio Verify API |
| **Email** | SMTP (Gmail / SendGrid) |
| **Push** | Firebase Cloud Messaging / VAPID |
| **Auth** | SimpleJWT (access + refresh tokens) |
| **Realtime** | Django Channels / WebSockets |

## Project Structure

```
academic-success-platform/
├── backend/
│   ├── config/            # Django settings, URLs, WSGI
│   ├── apps/
│   │   ├── accounts/      # User model, auth, OTP verification, profiles
│   │   ├── courses/       # Courses, enrollment, syllabus upload/parsing
│   │   ├── exams/         # Exams, quizzes, reminders, batch import
│   │   ├── study_plans/   # AI study plan generation, tasks, progress
│   │   ├── goals/         # Goal setting with milestones
│   │   ├── notifications/ # Multi-channel notification engine
│   │   └── dashboard/     # Student & faculty dashboard endpoints
│   ├── ai/                # Syllabus parser, study plan algorithm
│   └── templates/
├── frontend/
│   ├── src/
│   │   ├── pages/         # Dashboard, Courses, Exams, StudyPlans, Goals, Profile, etc.
│   │   ├── components/    # Navbar, ThemeToggle
│   │   ├── context/       # AuthContext, ThemeContext
│   │   └── services/      # API client (axios)
│   └── ...
├── mobile/                # React Native app (iOS + Android)
└── docker-compose.yml
```

## Quick Start

### Backend
```bash
cd backend
python -m venv venv && source venv/bin/activate  # or .\venv\Scripts\activate on Windows
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver 0.0.0.0:8080
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## Environment Variables

Create `backend/.env`:

| Variable | Purpose |
|----------|---------|
| `EMAIL_HOST_USER` | Gmail SMTP username |
| `EMAIL_HOST_PASSWORD` | Gmail app password |
| `TWILIO_ACCOUNT_SID` | Twilio Account SID |
| `TWILIO_AUTH_TOKEN` | Twilio Auth Token |
| `TWILIO_PHONE_NUMBER` | Twilio SMS-capable number |
| `DJANGO_SECRET_KEY` | Django secret key |
| `DJANGO_DEBUG` | Set to `False` in production |
