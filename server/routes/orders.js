const express = require('express');
const db = require('../db/db');
const router = express.Router();
// router will use express.json() applied in server.js

// Helper: check admin by email header
function checkAdmin(req, callback) {
  const adminEmail = req.headers['x-admin-email'] || req.body && req.body.adminEmail;
  if (!adminEmail) return callback(null, false);
  db.query('SELECT is_admin FROM users WHERE email = ?', [adminEmail], (err, rows) => {
    if (err) return callback(err);
    const isAdmin = rows && rows[0] && rows[0].is_admin == 1;
    callback(null, !!isAdmin);
  });
}

// POST /orders - create a new order
router.post('/', (req, res) => {
  const { userEmail, items, total } = req.body || {};
  // accept items as array or JSON string
  let parsedItems = []
  try {
    if (!items) parsedItems = []
    else if (typeof items === 'string') parsedItems = JSON.parse(items)
    else parsedItems = items
  } catch (e) { return res.status(400).json({ error: 'Invalid items JSON' }) }
  if (!Array.isArray(parsedItems)) return res.status(400).json({ error: 'Invalid items' })

  const itemsJson = JSON.stringify(parsedItems)
  // Use CAST(? AS JSON) to ensure MySQL stores the value as JSON
  const sql = 'INSERT INTO orders (user_email, items, total) VALUES (?, CAST(? AS JSON), ?)';
  db.query(sql, [userEmail || null, itemsJson, total || 0], (err, result) => {
    if (err) return res.status(500).json({ error: 'Failed to create order' });
    res.json({ id: result.insertId });
  });
});

// GET /orders - admin only - list orders (descending)
router.get('/', (req, res) => {
  checkAdmin(req, (err, isAdmin) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!isAdmin) return res.status(403).json({ error: 'Admin required' });
    // cast items to CHAR so we reliably receive a JSON string we can parse
    // optionally include deleted orders via query param `includeDeleted=true`
    const includeDeleted = String(req.query.includeDeleted || '').toLowerCase() === 'true' || String(req.query.includeDeleted || '') === '1'
    const baseSql = "SELECT id, user_email, CAST(items AS CHAR) AS items, total, notified, created_at, IFNULL(deleted,0) AS deleted FROM orders"
    const sql = includeDeleted ? baseSql + " ORDER BY created_at DESC" : baseSql + " WHERE IFNULL(deleted,0)=0 ORDER BY created_at DESC"
    db.query(sql, (err, rows) => {
      if (err) return res.status(500).json({ error: 'Failed to load orders' });
      // rows returned; items will be normalized below
      // parse items JSON safely (mysql driver may already return a JS object)
      const out = (rows || []).map(r => {
        let itemsParsed = []
        try{
          if (typeof r.items === 'string') {
            itemsParsed = JSON.parse(r.items)
          } else if (r.items == null) {
            itemsParsed = []
          } else {
            // some mysql drivers return RowDataPacket objects — normalize by stringify+parse
            itemsParsed = JSON.parse(JSON.stringify(r.items))
          }
        }catch(e){ itemsParsed = [] }
        return { ...r, items: itemsParsed }
      })
      res.json(out);
    });
  });
});

// PATCH /orders/:id/notify - mark order as notified/read (admin only)
router.patch('/:id/notify', (req, res) => {
  checkAdmin(req, (err, isAdmin) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!isAdmin) return res.status(403).json({ error: 'Admin required' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    db.query('UPDATE orders SET notified = 1 WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: 'Failed to update order' });
      res.json({ ok: true });
    });
  });
});

// DELETE /orders/:id - admin only - remove an order
router.delete('/:id', (req, res) => {
  checkAdmin(req, (err, isAdmin) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!isAdmin) return res.status(403).json({ error: 'Admin required' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    // soft-delete: mark deleted = 1
    db.query('UPDATE orders SET deleted = 1 WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to delete order' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
      res.json({ ok: true });
    })
  })
})

// PATCH /orders/:id/restore - admin only - undo soft-delete
router.patch('/:id/restore', (req, res) => {
  checkAdmin(req, (err, isAdmin) => {
    if (err) return res.status(500).json({ error: 'DB error' });
    if (!isAdmin) return res.status(403).json({ error: 'Admin required' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'Invalid id' });
    db.query('UPDATE orders SET deleted = 0 WHERE id = ?', [id], (err, result) => {
      if (err) return res.status(500).json({ error: 'Failed to restore order' });
      if (result.affectedRows === 0) return res.status(404).json({ error: 'Order not found' });
      res.json({ ok: true });
    })
  })
})

module.exports = router;
