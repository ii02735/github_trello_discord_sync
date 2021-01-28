const express = require("express")
const app = express()

app.get('/api/hello', (req, res) => res.json({ "message": "hello world !" }))

module.exports = app