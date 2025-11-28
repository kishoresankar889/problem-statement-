Server database setup

- The app expects a MySQL database named `jagan` by default.
- Connection parameters can be configured via environment variables: `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`.

Quick setup (recommended):
1. Start MySQL server and ensure you can connect as your DB user.
2. From the `server/db` folder run the SQL script `init.sql` in your MySQL client, or let the app create the `users` table automatically when it starts.

Manual SQL (run in MySQL client):

```sql
-- from server/db/init.sql
CREATE DATABASE IF NOT EXISTS jagan CHARACTER SET = 'utf8mb4' COLLATE = 'utf8mb4_unicode_ci';
USE jagan;
CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

Password hashing

- It's strongly recommended to store a password hash instead of plaintext.
- Install `bcryptjs` (or `bcrypt`) and hash passwords before calling `addUser(email, passwordHash)`.

Install example:

```powershell
cd server
npm install bcryptjs
```

Usage example (in your route/controller):

```javascript
const { addUser, getUserByEmail } = require('./db/db');
const bcrypt = require('bcryptjs');

// to register
const passwordHash = await bcrypt.hash(plainPassword, 10);
await addUser(email, passwordHash);

// to login
const user = await getUserByEmail(email);
if (user && await bcrypt.compare(plainPassword, user.password)) {
  // authenticated
}
```
