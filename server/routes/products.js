const express = require('express');
const router = express.Router();
const db = require('../db/db');
const fs = require('fs');
const path = require('path');

// Get all products
router.get('/', (req, res) => {
  const sql = 'SELECT id, title, price, img, created_at FROM products ORDER BY created_at DESC';
  db.query(sql, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// Add a new product (admin)
router.post('/add', (req, res) => {
  const { title, price, img, adminEmail } = req.body || {};
  // allow admin email via header as well
  const headerAdmin = req.headers['x-admin-email'];
  const admin = headerAdmin || adminEmail;

  if (!admin) return res.status(403).json({ error: 'Admin credentials required' });
  if (!title || typeof price === 'undefined') return res.status(400).json({ error: 'title and price are required' });

  // verify admin flag in users table
  const checkSql = 'SELECT is_admin FROM users WHERE email = ? LIMIT 1';
  db.query(checkSql, [admin], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows || rows.length === 0) return res.status(403).json({ error: 'Admin not found' });
    const u = rows[0];
    if (!u.is_admin) return res.status(403).json({ error: 'Not authorized' });

    const sql = 'INSERT INTO products (title, price, img) VALUES (?, ?, ?)';
    db.query(sql, [title, price, img|| null], (err2, result) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.status(201).json({ id: result.insertId, title, price, img });
    });
  });
});

// Delete product (admin only) - path param id
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const headerAdmin = req.headers['x-admin-email'];
  const admin = headerAdmin || (req.body && req.body.adminEmail);
  if(!admin) return res.status(403).json({ error: 'Admin credentials required' });

  const checkSql = 'SELECT is_admin FROM users WHERE email = ? LIMIT 1';
  db.query(checkSql, [admin], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!rows || rows.length === 0) return res.status(403).json({ error: 'Admin not found' });
    const u = rows[0];
    if (!u.is_admin) return res.status(403).json({ error: 'Not authorized' });

    // find product to get img path
    db.query('SELECT img FROM products WHERE id = ? LIMIT 1', [id], (e1, r1) => {
      if(e1) return res.status(500).json({ error: e1.message });
      if(!r1 || r1.length === 0) return res.status(404).json({ error: 'Product not found' });
      const img = r1[0].img;

      db.query('DELETE FROM products WHERE id = ?',[id], (e2) => {
        if(e2) return res.status(500).json({ error: e2.message });
        // if img is an uploads path, remove file
        if(img && (img.startsWith('/uploads/') || img.includes('/uploads/'))){
          // extract filename
          const parts = img.split('/uploads/');
          const filename = parts[parts.length-1];
          const full = path.join(__dirname, '..', 'public', 'uploads', filename);
          fs.unlink(full, (uerr)=>{
            // ignore unlink errors but log
            if(uerr) console.error('Failed to unlink product image', uerr.message || uerr);
            return res.json({ ok:true });
          })
        } else {
          return res.json({ ok:true });
        }
      })
    })
  });
})

module.exports = router;
