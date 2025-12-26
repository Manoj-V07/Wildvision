/**
 * SERVER ENTRY POINT
 * 
 * Initializes database connection and starts Express server
 */

require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

// Connect to database
connectDB()
  .then(() => {
    // Start server after successful DB connection
    app.listen(PORT, () => {
      console.log(`✓ Server running on port ${PORT}`);
      console.log(`✓ MongoDB Connected`);
      console.log(`✓ API endpoint: http://localhost:${PORT}/api/incidents`);
    });
  })
  .catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  });