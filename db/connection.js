const mysql = require("mysql2");
const util = require("util");

const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "employee_db",
});

// Turning connection.query into a promise so I can use async/await
connection.query = util.promisify(connection.query)

module.exports = connection;
