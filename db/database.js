const mysql = require('mysql2')

// Create the connection to database
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'mchat',
});

module.exports = connection.promise()