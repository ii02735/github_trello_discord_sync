require("dotenv").config()
const connectionString = process.env.DATABASE_URL    
const { Pool } = require('pg')
const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production'
})
module.exports = {
  query: (text, params) => pool.query(text, params)
}