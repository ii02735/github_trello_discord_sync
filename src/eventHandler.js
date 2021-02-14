require("dotenv").config()
const url = require('url')
const mergedColumn = require('./mergedColumn')
const discordActions = require('./discord')
const githubPRActions = require('./pullRequest')


module.exports = (req, res, DiscordInstance, discordClient) => {
    let body = ''
    req.on('data', (data) => body += data)
    req.on('end', () => {
        const post = JSON.parse(body)
        const queryStringEventName = url.parse(req.url, true).query.name
        switch (queryStringEventName) {
            case 'mergedColumn':
                if (post.action && checkIfListHasChanged(post.action))
                    mergedColumn(post, res)
                break;
            case 'discord':
                discordActions(res, post.action, DiscordInstance, discordClient)
                break;

            case 'pullRequest':
                githubPRActions(res, post, DiscordInstance, discordClient)
        }

        //If none of these actions is detected, we must put an end to the current request
        res.end()

    })
}

function checkIfListHasChanged(actionFromTrello) {
    return actionFromTrello && (actionFromTrello.data.hasOwnProperty('listBefore')
        && actionFromTrello.data.hasOwnProperty('listAfter')) ?
        (actionFromTrello.data.listBefore.name === process.env.TRELLO_COLUMN)
        || (actionFromTrello.data.listAfter.name === process.env.TRELLO_COLUMN) : false
}