const db = require('./db/db');

db.query('SELECT id, user_email, items, JSON_TYPE(items) AS items_type, JSON_LENGTH(items) AS items_length FROM orders ORDER BY id DESC LIMIT 10', (err, rows)=>{
  if(err) { console.error('Query failed', err); process.exit(1) }
  console.log('Rows:')
  rows.forEach(r => {
    console.log(r.id, 'items_type=', r.items_type, 'items_length=', r.items_length, 'items_raw=', r.items)
  })
  process.exit(0)
})
