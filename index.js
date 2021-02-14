const http = require('http')
const eventHandler = require("./src/eventHandler")
const userManagement = require("./src/userManagement")
const Discord = require("discord.js")
const discordClient = new Discord.Client()

discordClient.once('ready', () => {
    console.log("client discord ready")
})

const server = http.createServer((req, res) => {
    if (req.method === 'POST' && req.url.includes("eventHandler"))
            eventHandler(req, res, Discord, discordClient)
    else if(req.url.includes("users"))
            userManagement(req,res,discordClient)
    else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<p>Handler for Trello webhook. Events will only be fired from Trello.</p>')
        res.end()
    }

})

server.listen(process.env.PORT || 3000);

discordClient.login(process.env.DISCORD_BOT_TOKEN)