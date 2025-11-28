const mysql = require('mysql2');
const bcrypt = require('bcryptjs');

const db = mysql.createConnection({ host: process.env.DB_HOST || 'localhost', user: process.env.DB_USER || 'root', password: process.env.DB_PASS || 'kishore', database: process.env.DB_NAME || 'jagan' });

db.connect(err=>{
  if(err){ console.error('DB connect error', err); process.exit(1) }
  const email = 'kishore@gmail.com'
  const plain = 'kishore'
  const salt = bcrypt.genSaltSync(10)
  const hash = bcrypt.hashSync(plain, salt)
  const sql = `INSERT INTO users (email, password, is_admin) VALUES (?, ?, 1) ON DUPLICATE KEY UPDATE is_admin=1, password=VALUES(password)`
  db.query(sql, [email, hash], (err, res)=>{
    if(err){ console.error('Insert admin failed', err); process.exit(1) }
    console.log('Admin user ensured with email:', email)
    db.end();
    process.exit(0)
  })
})
