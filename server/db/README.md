Database SQL files

Location: `server/db/sql/`

Files included:
- `create_tables.sql` - creates database `jagan` and the tables `users`, `products`, `orders`.
- `seed_products.sql` - inserts sample product rows into `products`.
- `migrate.sql` - helper instructions for running the above files.

How to run (MySQL must be installed and running):

1) Run the create / seed files via the mysql CLI (PowerShell example):

```powershell
cd C:\Users\USER\Desktop\ps
mysql -u root -p < server/db/sql/create_tables.sql
mysql -u root -p < server/db/sql/seed_products.sql
```

2) Or from inside the mysql client:

```sql
SOURCE C:/Users/USER/Desktop/ps/server/db/sql/create_tables.sql;
SOURCE C:/Users/USER/Desktop/ps/server/db/sql/seed_products.sql;
```

Notes:
- The app's `server/db/db.js` already creates the same tables at runtime if they are missing and seeds products when empty. These SQL files are provided so you can inspect and manage schema manually from VS Code.
- If your MySQL credentials differ from `root`/password, adjust the commands accordingly.
