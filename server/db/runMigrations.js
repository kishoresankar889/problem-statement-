const fs = require('fs');
const path = require('path');
const mysql = require('mysql2');

// Read DB config from env with sensible defaults matching server/db/db.js
const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_USER = process.env.DB_USER || 'root';
const DB_PASS = process.env.DB_PASS || 'kishore';
const DB_NAME = process.env.DB_NAME || 'jagan';
const SQL_DIR = path.join(__dirname, 'sql');

function readSqlFile(filename){
  const p = path.join(SQL_DIR, filename);
  if(!fs.existsSync(p)) throw new Error('SQL file not found: ' + p);
  return fs.readFileSync(p, 'utf8');
}

async function run(){
  try{
    const createSql = readSqlFile('create_tables.sql');
    const seedSql = fs.existsSync(path.join(SQL_DIR, 'seed_products.sql')) ? readSqlFile('seed_products.sql') : '';

    const connection = mysql.createConnection({
      host: DB_HOST,
      user: DB_USER,
      password: DB_PASS,
      multipleStatements: true
    });

    // Run create DB / tables first
    console.log('Running create_tables.sql...');
    connection.query(createSql, (err, results) => {
      if(err){
        console.error('Error running create_tables.sql:', err);
        connection.end();
        process.exit(1);
      }
      console.log('create_tables.sql executed successfully');

      // Now run seed if present
      if(seedSql && seedSql.trim()){
        console.log('Running seed_products.sql...');
        // ensure we use the target database
        connection.changeUser({database: DB_NAME}, (err2)=>{
          if(err2){ console.error('Failed to switch to database', DB_NAME, err2); connection.end(); process.exit(1) }
          connection.query(seedSql, (err3, res3) => {
            if(err3){
              console.error('Error running seed_products.sql:', err3);
              connection.end();
              process.exit(1);
            }
            console.log('seed_products.sql executed successfully');
            connection.end();
            process.exit(0);
          })
        })
      } else {
        connection.end();
        process.exit(0);
      }
    })
  }catch(err){
    console.error('Migration error:', err);
    process.exit(1);
  }
}

run();
