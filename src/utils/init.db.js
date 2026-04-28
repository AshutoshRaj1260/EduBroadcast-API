const mysql = require("mysql2/promise");

async function init() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: false },
  });

  console.log("Connected to TiDB!");

  // Users Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS Users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('principal', 'teacher') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Content Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS Content (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        subject VARCHAR(100) NOT NULL,
        file_path VARCHAR(255) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        file_size INT NOT NULL,
        uploaded_by INT,
        status ENUM('uploaded', 'pending', 'approved', 'rejected') DEFAULT 'uploaded',
        rejection_reason TEXT,
        approved_by INT,
        approved_at TIMESTAMP NULL,
        start_time DATETIME,
        end_time DATETIME,
        created_at TIMESTAMP,
        FOREIGN KEY (uploaded_by) REFERENCES Users(id),
        FOREIGN KEY (approved_by) REFERENCES Users(id)
    )
  `);

  // ContentSlots Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ContentSlots (
        id INT AUTO_INCREMENT PRIMARY KEY,
        subject VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // ContentSchedule Table
  await connection.query(`
    CREATE TABLE IF NOT EXISTS ContentSchedule (
        id INT AUTO_INCREMENT PRIMARY KEY,
        content_id INT,
        slot_id INT,
        rotation_order INT,
        duration INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (content_id) REFERENCES Content(id),
        FOREIGN KEY (slot_id) REFERENCES ContentSlots(id)
    )
  `);

  console.log("Tables initialized successfully!");
  await connection.end();
}

module.exports = init;
