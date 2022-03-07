if (process.env.NODE_ENV != "production")
    require('dotenv').config()
const Router = require("express-promise-router");
const router = new Router()
const db = require("../config/db")
const octokit = require("@octokit/rest")
const fetch = require('node-fetch');
const { discordClient } = require('../config/discord');
const Octokit = new octokit.Octokit({
    auth: process.env.GITHUB_PAT
});


router.get('/', async (req, res) => {
    const { rows } = await db.query('SELECT * FROM users')
    res.send(rows)
})

router.post('/', async (req, res) => {
    try {
        const { body } = req

        const trello_fetch = await fetch(`https://api.trello.com/1/members/${body.trello}?key=${process.env.APP_KEY}&token=${process.env.USER_TOKEN}`)

        //if statement goes to catch it means the provided username is invalid
        //else it is valid, so we can keep body.trello
        const trello_data = await trello_fetch.json()
        // Fetching github user
        const { data } = await Octokit.users.getByUsername({ username: body.github })
        const github = data

        const discord_data = await discordClient.users.fetch(body.discord)

        const query = 'INSERT INTO users (trello,discord_id,discord_username,github_id,github_username) VALUES ($1,$2,$3,$4,$5) RETURNING *'

        const { rows } = await db.query(query, [body.trello, discord_data.id, discord_data.username, github.id, github.login])

        res.send(rows[0])

    } catch (e) {
        if (e.hasOwnProperty('code') && e.code == 23505)
            res.send({ error: "mapping already exists" })
        else
            res.send(e)
    }

})

router.get('/', async (req, res) => {
    try {
        const { rows } = await db.query("SELECT * FROM users")
        res.send(rows)
    } catch (e) {
        res.send(e)
    }
})

router.get('/:id', async (req, res) => {
    try {
        const { rows } = await db.query("SELECT * FROM users WHERE id = $1", [req.params.id])
        if (rows.length == 0)
            res.status(404).send({ "error": "user not found" })
        else
            res.send(rows[0])
    } catch (e) {
        res.send(e)
    }
})

router.delete('/:id', async (req, res) => {
    try {
        const { rows } = await db.query("DELETE FROM users WHERE id = $1", [req.params.id])
        if (rows.length == 0)
            res.status(404).send({ "error": "user not found" })
        else
            res.send({ "message": "deletion OK" })
    } catch (e) {
        res.send(e)
    }
})

module.exports = router;

