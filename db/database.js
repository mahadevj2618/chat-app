const mysql = require('mysql2');
require('dotenv').config();


// Use environment variables provided in Render dashboard
const connection = mysql.createConnection({
  host: process.env.DB_HOST,        // e.g. your-db.onrender.com
  user: process.env.DB_USER,        // e.g. render_user
  password: process.env.DB_PASSWORD,// the password from Render
  database: process.env.DB_NAME,    // mchat
  port: process.env.DB_PORT || 3306
});

module.exports = connection.promise();
