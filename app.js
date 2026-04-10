require('dotenv').config();
const express    = require('express');
const mongoose   = require('mongoose');
const methodOverride = require('method-override');
const session    = require('express-session');
const path       = require('path');

const app = express();

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Error:', err));

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session — uses MongoDB store for persistence across restarts
async function setupSession() {
  const MongoStore = require('connect-mongo');
  app.use(session({
    secret: process.env.SESSION_SECRET || 'elite_secret',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      collectionName: 'sessions',
      ttl: 8 * 60 * 60
    }),
    cookie: { maxAge: 8 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' }
  }));
  startRoutes();
}

// Fallback to memory store if MongoStore fails
function setupMemorySession() {
  console.warn('⚠️  Using in-memory session store (sessions reset on restart)');
  app.use(session({
    secret: process.env.SESSION_SECRET || 'elite_secret',
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 8 * 60 * 60 * 1000, httpOnly: true, sameSite: 'lax' }
  }));
  startRoutes();
}

function startRoutes() {
  const indexRoutes    = require('./routes/index');
  const adminRoutes    = require('./routes/admin');
  const gameRoutes     = require('./routes/game');
  const feedbackRoutes = require('./routes/feedback');
  const apiRoutes      = require('./routes/api');

  app.use('/',         indexRoutes);
  app.use('/admin',    adminRoutes);
  app.use('/game',     gameRoutes);
  app.use('/feedback', feedbackRoutes);
  app.use('/api',      apiRoutes);

  app.use((req, res) => res.status(404).render('404'));
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Error: ' + err.message);
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`🚀 Elite Pro Arenas → http://localhost:${PORT}`));
}

// Try MongoDB sessions, fall back to memory
setupSession().catch(() => setupMemorySession());
