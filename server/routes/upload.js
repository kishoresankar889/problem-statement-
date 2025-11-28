const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '..', 'public', 'uploads'));
  },
  filename: function (req, file, cb) {
    const safe = Date.now() + '-' + file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, safe);
  }
});

const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB limit

// helper to verify admin via header `x-admin-email` or body `adminEmail`
function checkAdminEmail(req, callback){
  const admin = req.headers['x-admin-email'] || (req.body && req.body.adminEmail);
  if(!admin) return callback(new Error('Admin credentials required'));
  const checkSql = 'SELECT is_admin FROM users WHERE email = ? LIMIT 1';
  const db = require('../db/db');
  db.query(checkSql, [admin], (err, rows)=>{
    if(err) return callback(err)
    if(!rows || rows.length === 0) return callback(new Error('Admin not found'))
    if(!rows[0].is_admin) return callback(new Error('Not authorized'))
    return callback(null)
  })
}

// single file upload field: `image` (admin only)
router.post('/add', (req, res) => {
  checkAdminEmail(req, (err) => {
    if(err) return res.status(403).json({ error: err.message || 'forbidden' })
    const handler = upload.single('image')
    handler(req, res, function(upErr){
      if(upErr) return res.status(400).json({ error: upErr.message || String(upErr) })
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
      const urlPath = `/uploads/${req.file.filename}`;
      return res.json({ url: urlPath });
    })
  })
});

const fs = require('fs');

// Delete an uploaded file (admin only) - body: { file: '/uploads/name' }
router.delete('/', express.json(), (req, res) => {
  checkAdminEmail(req, (err) => {
    if(err) return res.status(403).json({ error: err.message || 'forbidden' })
    const file = req.body && req.body.file
    if(!file) return res.status(400).json({ error: 'file required' })
    // only allow deleting files under /uploads
    if(!file.startsWith('/uploads/')) return res.status(400).json({ error: 'Invalid file path' })
    const full = path.join(__dirname, '..', 'public', file.replace(/^\//,''))
    fs.unlink(full, (uerr)=>{
      if(uerr) return res.status(500).json({ error: uerr.message })
      return res.json({ ok:true })
    })
  })
})

module.exports = router;
