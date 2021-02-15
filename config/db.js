require("dotenv").config()
const connectionString = process.env.DATABASE_URL
const { Pool } = require('pg')
const pool = process.env.NODE_ENV != "development" ? new Pool({ connectionString, ssl: true }) : new Pool({ connectionString })
module.exports = {
  query: (text, params) => pool.query(text, params)
}