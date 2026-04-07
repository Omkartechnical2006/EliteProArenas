# Elite Pro Arenas 🏆

A **full-stack college fest web application** with a rigged spin-the-wheel game, dynamic feedback system, and an Admin Panel.

## Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: MongoDB (Mongoose)
- **Views**: EJS + Tailwind CSS (CDN)
- **Architecture**: MVC (models / views / controllers / routes / public)

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Set Up MongoDB
Make sure MongoDB is running locally. The default URI is:
```
mongodb://localhost:27017/eliteproarenas
```
Edit `.env` to change the URI if needed.

### 3. Run the App
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

App runs at **http://localhost:3000**

---

## Features

### 🎰 Spin the Wheel (Rigged)
- User enters a 4-digit code at the landing page
- Wheel spins with tick sound and realistic animation
- Wheel **always lands on the admin-assigned prize**
- Confetti + victory sound on win
- `hasSpun` flag prevents re-use of code

### 🛠️ Admin Panel (`/admin`)
- **Code Generator**: Create 4-digit codes with pre-assigned prizes
- **Faculty Autocomplete**: Live search from Faculty DB when selecting Faculty type
- **Game Management**: Add/Remove/Toggle offline games
- **Faculty Directory**: Add/Remove faculty members
- **Players Table**: View recent players and their spin status

### 📝 Feedback System
- Star ratings (1–5) for the overall stall
- Individual ratings for each active offline game
- Comments text area
- Success modal with confetti on submit

---

## Folder Structure
```
elite-pro-arenas/
├── app.js
├── .env
├── package.json
├── models/
│   ├── Player.js
│   ├── OfflineGame.js
│   ├── Faculty.js
│   └── Feedback.js
├── controllers/
│   ├── indexController.js
│   ├── adminController.js
│   ├── gameController.js
│   └── feedbackController.js
├── routes/
│   ├── index.js
│   ├── admin.js
│   ├── game.js
│   ├── feedback.js
│   └── api.js
├── views/
│   ├── index.ejs
│   ├── wheel.ejs
│   ├── feedback.ejs
│   ├── admin.ejs
│   └── 404.ejs
└── public/
    └── css/
        └── style.css
```

## URL Map
| Route | Description |
|-------|-------------|
| `GET /` | Landing page (code entry) |
| `POST /` | Submit code → redirect to wheel |
| `GET /game/wheel/:code` | Spin the wheel |
| `POST /game/mark-spun` | AJAX: mark player as spun |
| `GET /feedback/:code` | Feedback form |
| `POST /feedback/:code` | Submit feedback |
| `GET /admin` | Admin dashboard |
| `POST /admin/generate-code` | Generate player code |
| `POST /admin/games/add` | Add offline game |
| `DELETE /admin/games/:id` | Delete game |
| `PATCH /admin/games/:id/toggle` | Toggle game active |
| `POST /admin/faculty/add` | Add faculty |
| `DELETE /admin/faculty/:id` | Delete faculty |
| `DELETE /admin/players/:id` | Delete player |
| `GET /api/faculty/search?q=` | Autocomplete faculty |
