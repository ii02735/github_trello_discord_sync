require('dotenv').config()

const Discord = require('discord.js')
const fs = require('fs')
const client = new Discord.Client()
const url = require('url')
const assert = require('assert').strict
const fetch = require('node-fetch')
const { createServer } = require('http')
const octokit = require('@octokit/rest')
const Octokit = new octokit.Octokit({
    auth: process.env.GITHUB_PAT
});
const path_to_mapping = '../user-mapping.json'


client.once('ready', () => console.log('ready'))

module.exports = (req, res) => {
    switch (req.method) {
        case 'GET':
            listUsers(req, res)
            break;

        case 'POST':
            postUser(req, res)
            break;

        case 'DELETE':
            deleteUser(req, res)
            break;
    }
}

const deleteUser = (req, res) => {
    let body = ''
    req.on('data', (data) => body += data)
    req.on('end', () => {
        const userToDeleteId = parseInt(url.parse(req.url, true).pathname.split('/').reverse()[0])
        console.log(userToDeleteId)
        fs.readFile(path_to_mapping, (err, data) => {
            if (err && err.code === 'ENOENT') {
                res.writeHead(404, { 'Content-Type': 'application/json' })
                res.write(JSON.stringify({ 'error': 'There is no such mapping' }))
            } else {
                const users = JSON.parse(data)
                const result = users.find((user) => user.id === userToDeleteId)
                if (!result) {
                    res.writeHead(404, { 'Content-Type': 'application/json' })
                    res.write(JSON.stringify({ 'error': 'There is no such mapping' }))
                    res.end()
                } else {
                    fs.writeFile(path_to_mapping, JSON.stringify(users.filter((user) => user.id !== userToDeleteId)), (err) => {
                        if (!err) {
                            res.writeHead(200, { 'Content-Type': 'application/json' })
                            res.write(JSON.stringify({ "message": "mapping deleted" }))
                            res.end()
                        } else {
                            res.writeHead(500, { 'Content-Type': 'application/json' })
                            res.write(JSON.stringify(err))
                            res.end()
                        }
                    })
                }
            }
        })
    })
}

const listUsers = (req, res) => {
    fs.readFile(path_to_mapping, (err, data) => {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        if (err && err.code === 'ENOENT')
            res.write(JSON.stringify([]))
        else
            res.write(JSON.stringify(JSON.parse(data)))
        res.end()
    })
}

const postUser = (req, res) => {
    let body = ''
    req.on('data', (data) => body += data)
    req.on('end', () => {
        const post = JSON.parse(body)
        let errors = {}
        if (!post.hasOwnProperty('trello'))
            errors['trello'] = "missing key"
        if (!post.hasOwnProperty('discord'))
            errors['discord'] = "missing key"
        if (!post.hasOwnProperty('github'))
            errors['github'] = 'missing key'

        if (post.hasOwnProperty('trello') && post.hasOwnProperty('discord') && post.hasOwnProperty('github')) {
            fetch(`https://api.trello.com/1/members/${post.trello}?key=${process.env.APP_KEY}&token=${process.env.USER_TOKEN}`).then((data) => {
                if (data.status === 404)
                    notFound(req, res, data.status, 'trello')
                else if (data.status != 200)
                    otherError(req, res, data.status, data)
                else {
                    client.users.fetch(post.discord).then((discord) => {
                        Octokit.users.getByUsername({
                            username: post.github
                        }).then((github) => {
                            writeMapping(res, post, discord, github.data)
                        }).catch((error) => {
                            if (error.status === 404)
                                notFound(req, res, error.status, 'github')
                            else
                                otherError(req, res, error.status, error)
                        })
                    }).catch((error) => {
                        if (error.httpStatus === 404)
                            notFound(req, res, error.httpStatus, 'discord')
                        else
                            otherError(req, res, error.httpStatus, error)
                    })
                }
            })
        } else {
            res.writeHead(400, { 'Content-Type': 'application/json' })
            res.write(JSON.stringify(errors))
            res.end()
        }
    })
}

const notFound = (req, res, errorCode, keyname) => {
    res.writeHead(errorCode, { 'Content-Type': 'application/json' })
    res.write(JSON.stringify({ [keyname + '_error']: 'Unknown user' }))
    res.end()
}

const otherError = (req, res, errorCode, error) => {
    res.writeHead(errorCode, { 'Content-Type': 'application/json' })
    res.write(JSON.stringify(error))
    res.end()
}

const writeMapping = (res, post, discord, github) => {
    fs.stat(path_to_mapping, (err, stat) => {
        if (err && err.code === 'ENOENT') {
            fs.writeFile(path_to_mapping, JSON.stringify([{ "id": 1, "trello": post.trello, "discord": { "id": discord.id, "username": discord.username }, "github": { id: github.id, username: github.login } }]), (err) => {
                if (!err) {
                    res.writeHead(201, { 'Content-Type': 'application/json' })
                    res.write(JSON.stringify({ "id": 1, "trello": post.trello, "discord": { "id": discord.id, "username": discord.username, "github": { id: github.id, username: github.login } } }))
                    res.end()
                }
            })
        } else {
            fs.readFile(path_to_mapping, (err, file_data) => {
                if (!err) {
                    const users = JSON.parse(file_data)
                    try {
                        users.forEach((user) => assert.notDeepStrictEqual({ "trello": user.trello, "discord": user.discord.id, "github": user.github.username }, { "trello": post.trello, "discord": post.discord, "github": post.github }))
                        users.push({ "id": users.length + 1, "trello": post.trello, "discord": { "id": discord.id, "username": discord.username }, "github": { id: github.id, username: github.login } })
                        fs.writeFile(path_to_mapping, JSON.stringify(users), (err) => {
                            if (!err) {
                                res.writeHead(201, { 'Content-Type': 'application/json' })
                                res.write(JSON.stringify({ "id": users.length, "trello": post.trello, "discord": { "id": discord.id, "username": discord.username }, "github": { id: github.id, username: github.login } }))
                                res.end()
                            } else {
                                res.writeHead(500, { 'Content-Type': 'application/json' })
                                res.write(JSON.stringify(err))
                                res.end()
                            }
                        })
                    } catch (assertionException) {
                        res.writeHead(400, { 'Content-Type': 'application/json' })
                        res.write(JSON.stringify({ 'error': 'Mapping already exists' }))
                        res.end()
                    }
                }
            })
        }
    })
}

client.login(process.env.DISCORD_BOT_TOKEN)