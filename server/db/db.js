const mysql = require("mysql2");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "kishore",
  database: "jagan"
});

db.connect(err => {
  if (err) {
    console.log("MySQL Error:", err);
    return;
  }
  console.log("Connected to MySQL!");
  // Ensure users table exists
  const createTableSql = `
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  db.query(createTableSql, (err) => {
    if (err) {
      console.error('Failed to ensure users table exists:', err);
    } else {
      console.log('Ensured `users` table exists');
    }
  });
  // Ensure is_admin column exists (MySQL 8+ supports IF NOT EXISTS)
  const ensureAdminCol = `ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin TINYINT(1) NOT NULL DEFAULT 0;`;
  db.query(ensureAdminCol, (err) => {
    if (err) {
      // Some older MySQL versions don't support IF NOT EXISTS for ADD COLUMN
      // Try a safe ALTER without IF NOT EXISTS and ignore column exists errors
      const alt = `ALTER TABLE users ADD COLUMN is_admin TINYINT(1) NOT NULL DEFAULT 0;`;
      db.query(alt, (err2) => {
        if (err2) {
          if (err2.code === 'ER_DUP_FIELDNAME' || err2.errno === 1060) {
            // column already exists, ignore
          } else {
            console.error('Failed to ensure is_admin column on users table:', err2);
          }
        } else {
          console.log('Added is_admin column to users table');
        }
      });
    } else {
      console.log('Ensured is_admin column exists on users table');
    }
  });
  // Ensure products table exists
  const createProductsSql = `
    CREATE TABLE IF NOT EXISTS products (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(255) NOT NULL,
      price DECIMAL(10,2) NOT NULL DEFAULT 0,
      img VARCHAR(1024),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  db.query(createProductsSql, (err) => {
    if (err) {
      console.error('Failed to ensure products table exists:', err);
    } else {
      console.log('Ensured `products` table exists');
      // Seed some sample products if table is empty
      db.query('SELECT COUNT(*) AS cnt FROM products', (err2, rows) => {
        if (err2) {
          console.error('Failed to check products count:', err2);
          return;
        }
        const count = (rows && rows[0] && rows[0].cnt) ? Number(rows[0].cnt) : 0;
        if (count === 0) {
          const sample = [
            ['Modern Oak Coffee Table', 129.00, 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcSkfabTcWoeFIlI_LkjE5R6LgI94VxeyEwGkB67CbNsKMRuVIpeHhKUFqUy2Kr7S9FhsUwOVMu1v7CQsrt7jfRLxPf3TlgnRwPV6FoFrqA'],
            ['Scandi Lounge Chair', 249.00, 'https://encrypted-tbn1.gstatic.com/shopping?q=tbn:ANd9GcSRIyPvM6uAyT9SUyDfIlscloXihXuGKGivd7loDZJsRVATfFfadiLb9Ni9XW2chBspMM7Uxbe8U_LAVErGI7TLqQV84ztxg21JjbqrGjw'],
            ['Minimalist TV Unit', 399.00, 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQZsuP3chb-HFtq6I5CNtADVcESSMPedCBkOhWsBVHNQhTKo12VtqEOIdpcfquEIBXwnqcfgHzl8qAHKJV4d0YAecPts90JRpV8Ou-7sFM'],
            ['Cozy 3-Seater Sofa', 799.00, 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcQKmDW4XCY1fEV_kxHwHDN4W9zqsEhZZvQmvPugFIco4g_U5Lo27cObgvbWF7iNDq7VJ8I5FnUxDD7WP5qMnMR-vbr7EQVtLKGy96FR5bI_F5YR2PSPXNck'],
            ['Oak Dining Set (4 pcs)', 599.00, 'https://m.media-amazon.com/images/I/71GbsURF7QL.jpg'],
            ['Platform Bed Frame', 499.00, 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcS_erlymUxC2yyhPEubIXITdVygfghzBGmL__0daCzmM0H48cbcCiQeoYGfHQY9A79dIckx4k3kZM0qxtESW00LwpX2Epe-gEEfNY7d1XXb'],
            ['Tall Bookshelf', 199.00, 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcTWL3_AHXmaLo_InyRdyahwp5sHA3Qb1vVw04kUAztx32V0ccFI26OoguSlPY8Uhaxpps733kUyRo6oY5utH6IMuu5S395R6gXaViXifSJCnh0FthpJZBAERg'],
            ['Small Office Desk', 149.00, 'https://encrypted-tbn2.gstatic.com/shopping?q=tbn:ANd9GcRn1ImGNJAyDYM2wAreR7JrMin4ZP0FlUqwLw6J2T5eHnYrycerpmeJ2Cbi5knzAbztvIBcBG2xVXrn-9fCx9Yzt_R8oIZcVbf7QHi3At3T'],
            ['Nightstand (Set of 2)', 89.00, 'https://via.placeholder.com/640x420?text=Nightstand'],
            ['Woven Area Rug', 129.00, 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==']
          ];
          const insertSql = 'INSERT INTO products (title, price, img) VALUES ?';
          db.query(insertSql, [sample], (err3, result) => {
            if (err3) {
              console.error('Failed to seed products:', err3);
            } else {
              console.log('Inserted sample products, count:', sample.length);
            }
          });
        }
      });
    }
  });
});

  // Ensure orders table exists (stores orders placed by customers)
  const createOrdersSql = `
    CREATE TABLE IF NOT EXISTS orders (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_email VARCHAR(255),
      items JSON,
      total DECIMAL(10,2) DEFAULT 0,
      notified TINYINT(1) NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;

  db.query(createOrdersSql, (err) => {
    if (err) {
      console.error('Failed to ensure orders table exists:', err);
    } else {
      console.log('Ensured `orders` table exists');
    }
  });

module.exports = db;
