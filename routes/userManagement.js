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

    // switch (req.method) {
    //     case 'GET':
    //         listUsers(req, res)
    //         break;

    //     case 'POST':
    //         postUser(req, res, client)
    //         break;

    //     case 'DELETE':
    //         deleteUser(req, res)
    //         break;
    // }

// const deleteUser = (req, res) => {
//     let body = ''
//     req.on('data', (data) => body += data)
//     req.on('end', () => {
//         const userToDeleteId = parseInt(url.parse(req.url, true).pathname.split('/').reverse()[0])
//         console.log(userToDeleteId)
//         fs.readFile(path_to_mapping, (err, data) => {
//             const users = JSON.parse(data)
//             const result = users.find((user) => user.id === userToDeleteId)
//             if (!result) {
//                 res.writeHead(404, { 'Content-Type': 'application/json' })
//                 res.write(JSON.stringify({ 'error': 'There is no such mapping' }))
//                 res.end()
//             } else {
//                 fs.writeFile(path_to_mapping, JSON.stringify(users.filter((user) => user.id !== userToDeleteId)), (err) => {
//                     if (!err) {
//                         res.writeHead(200, { 'Content-Type': 'application/json' })
//                         res.write(JSON.stringify({ "message": "mapping deleted" }))
//                         res.end()
//                     } else {
//                         res.writeHead(500, { 'Content-Type': 'application/json' })
//                         res.write(JSON.stringify(err))
//                         res.end()
//                     }
//                 })
//             }
//         })
//     })
// }

// const listUsers = (req, res) => {
//     fs.readFile(path_to_mapping, (err, data) => {
//         res.write(JSON.stringify(JSON.parse(data)))
//         res.end()
//     })
// }

// const postUser = (req, res, client) => {
//     let body = ''
//     req.on('data', (data) => body += data)
//     req.on('end', () => {
//         const post = JSON.parse(body)
//         let errors = {}
//         if (!post.hasOwnProperty('trello'))
//             errors['trello'] = "missing key"
//         if (!post.hasOwnProperty('discord'))
//             errors['discord'] = "missing key"
//         if (!post.hasOwnProperty('github'))
//             errors['github'] = 'missing key'

//         if (post.hasOwnProperty('trello') && post.hasOwnProperty('discord') && post.hasOwnProperty('github')) {
//             fetch(`https://api.trello.com/1/members/${post.trello}?key=${process.env.APP_KEY}&token=${process.env.USER_TOKEN}`).then((data) => {
//                 if (data.status === 404)
//                     notFound(req, res, data.status, 'trello')
//                 else if (data.status != 200)
//                     otherError(req, res, data.status, data)
//                 else {
//                     client.users.fetch(post.discord).then((discord) => {
//                         Octokit.users.getByUsername({
//                             username: post.github
//                         }).then((github) => {
//                             writeMapping(res, post, discord, github.data)
//                         }).catch((error) => {
//                             if (error.status === 404)
//                                 notFound(req, res, error.status, 'github')
//                             else
//                                 otherError(req, res, error.status, error)
//                         })
//                     }).catch((error) => {
//                         if (error.httpStatus === 404)
//                             notFound(req, res, error.httpStatus, 'discord')
//                         else
//                             otherError(req, res, error.httpStatus, error)
//                     })
//                 }
//             })
//         } else {
//             res.writeHead(400, { 'Content-Type': 'application/json' })
//             res.write(JSON.stringify(errors))
//             res.end()
//         }
//     })
// }

// const notFound = (req, res, errorCode, keyname) => {
//     res.writeHead(errorCode, { 'Content-Type': 'application/json' })
//     res.write(JSON.stringify({ [keyname + '_error']: 'Unknown user' }))
//     res.end()
// }

// const otherError = (req, res, errorCode, error) => {
//     res.writeHead(errorCode, { 'Content-Type': 'application/json' })
//     res.write(JSON.stringify(error))
//     res.end()
// }

// const writeMapping = (res, post, discord, github) => {
//     fs.stat(path_to_mapping, (err, stat) => {
//         fs.readFile(path_to_mapping, (err, file_data) => {
//             if (!err) {
//                 const users = JSON.parse(file_data)
//                 try {
//                     users.forEach((user) => assert.notDeepStrictEqual({ "trello": user.trello, "discord": user.discord.id, "github": user.github.username }, { "trello": post.trello, "discord": post.discord, "github": post.github }))
//                     users.push({ "id": users.length + 1, "trello": post.trello, "discord": { "id": discord.id, "username": discord.username }, "github": { id: github.id, username: github.login } })
//                     fs.writeFile(path_to_mapping, JSON.stringify(users), (err) => {
//                         if (!err) {
//                             res.writeHead(201, { 'Content-Type': 'application/json' })
//                             res.write(JSON.stringify({ "id": users.length, "trello": post.trello, "discord": { "id": discord.id, "username": discord.username }, "github": { id: github.id, username: github.login } }))
//                             res.end()
//                         } else {
//                             res.writeHead(500, { 'Content-Type': 'application/json' })
//                             res.write(JSON.stringify(err))
//                             res.end()
//                         }
//                     })
//                 } catch (assertionException) {
//                     res.writeHead(400, { 'Content-Type': 'application/json' })
//                     res.write(JSON.stringify({ 'error': 'Mapping already exists' }))
//                     res.end()
//                 }
//             }
//         })

//     })
// }
