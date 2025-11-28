const express = require('express');
const router = express.Router();
const db = require('../db/db');
const bcrypt = require('bcryptjs');

// Register a new user
router.post('/register', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const passwordHash = bcrypt.hashSync(password, 10);
    // If registering the special admin email, set is_admin = 1
    const isAdmin = (String(email).toLowerCase() === 'kishore@gmail.com') ? 1 : 0;
    const sql = 'INSERT INTO users (email, password, is_admin) VALUES (?, ?, ?)';
    db.query(sql, [email, passwordHash, isAdmin], (err, result) => {
      if (err) {
        // Duplicate entry
        if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Email already registered' });
        return res.status(500).json({ error: err });
      }
      return res.status(201).json({ message: 'User registered', userId: result.insertId });
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || err });
  }
});

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const sql = 'SELECT * FROM users WHERE email = ? LIMIT 1';
  db.query(sql, [email], (err, rows) => {
    if (err) return res.status(500).json({ error: err });
    if (!rows || rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = rows[0];
    const passwordMatches = bcrypt.compareSync(password, user.password);
    if (!passwordMatches) return res.status(401).json({ error: 'Invalid credentials' });

    // Do not send password hash back
    delete user.password;
    return res.json({ message: 'Authenticated', user });
  });
});

module.exports = router;
