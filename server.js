require('dotenv').config();
const app = require('./src/app')
const initDB = require('./src/utils/init.db');

const PORT = process.env.PORT || 3000;

// Initialize the database tables before starting the server
initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log("Server running on port " + PORT);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err);
    process.exit(1);
  });