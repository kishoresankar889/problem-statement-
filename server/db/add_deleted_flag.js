const mysql = require('mysql2');

const db = mysql.createConnection({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'kishore',
  database: process.env.DB_NAME || 'jagan'
});

db.connect(err => {
  if (err) {
    console.error('DB connect error', err);
    process.exit(1);
  }

  const sql = 'ALTER TABLE orders ADD COLUMN deleted TINYINT(1) NOT NULL DEFAULT 0';
  db.query(sql, (err) => {
    if (err) {
      // ignore duplicate column error
      if (err && (err.code === 'ER_DUP_FIELDNAME' || err.errno === 1060)) {
        console.log('`deleted` column already exists on `orders`');
        db.end();
        process.exit(0);
      }
      console.error('Failed to add deleted column:', err);
      db.end();
      process.exit(1);
    }
    console.log('Added `deleted` column to `orders`');
    db.end();
    process.exit(0);
  });
});
