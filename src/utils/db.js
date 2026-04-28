const mysql = require('mysql2/promise');

// MySQL connection pool configuration
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false },
  waitForConnections: true,           
  connectionLimit: 10,                
  queueLimit: 0,                       
  timezone: '+05:30',
  dateStrings: true, 
});

module.exports = pool;
