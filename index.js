const http = require('http')
const eventHandlerTrelloDiscord = require("./api/eventHandlerTrelloDiscord")
const eventHandlerTrelloGitHub = require("./api/eventHandlerTrelloGitHub")
const validAddresses = [
    '107.23.104.115',
    '107.23.149.70',
    '54.152.166.250',
    '54.209.149.230',
    '18.234.32.2',
    '192.168.0.254' //local
];

const server = http.createServer((req, res) => {
    if (req.method === 'POST') {
        switch(req.url){
            case "/api/eventHandlerTrelloDiscord.js":
                eventHandlerTrelloDiscord(req, res)
                break
            case "/api/eventHandlerTrelloGitHub.js":
                eventHandlerTrelloGitHub(req,res)
        }
    } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write('<p>Handler for Trello webhook. Events will only be fired from Trello.</p>')
        res.end()
    }

})

server.on('connection', (socket) => {
    const isValid = validAddresses.some((address) => socket.remoteAddress.includes(address))
    if (!isValid)
        socket.destroy()
})

server.listen(3000);