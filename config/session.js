const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('./database');
require('dotenv').config();

// Create session store
const sessionStore = new SequelizeStore({
  db: sequelize,
  checkExpirationInterval: 15 * 60 * 1000, // Clean up expired sessions every 15 minutes
  expiration: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000 // 24 hours
});

// Session configuration
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production', // Only use secure cookies in production
    httpOnly: true, // Prevent XSS attacks
    maxAge: parseInt(process.env.SESSION_MAX_AGE) || 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'lax' // CSRF protection
  }
};

module.exports = { sessionStore, sessionConfig };

