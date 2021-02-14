const ADD_LABEL_TO_CARD = "addLabelToCard"
const COMMENT_CARD = "commentCard"
const UPDATE_COMMENT = "updateComment"
const DELETE_COMMENT = "deleteComment"
const { ServerResponse } = require('http')
const { Collection, Client, Channel } = require('discord.js')
const { embedMessageFactory, findDiscordMessageByTrelloCommentId } = require('./util')

/**
 * 
 * @param {ServerResponse} res 
 * @param {*} actionFromTrello
 * @param {typeof import("discord.js")} DiscordInstance 
 * @param {Client} discordClient 
 */
module.exports = (res, actionFromTrello, DiscordInstance, discordClient) => {

    const messageFactoryInstance = embedMessageFactory(DiscordInstance)
    
    switch (actionFromTrello.type) {

        case ADD_LABEL_TO_CARD:

            if (actionFromTrello.data.text === "Bug") //if label name is equal to Bug -> dispatch to Discord
            {
                
                const embed = messageFactoryInstance.trelloBug(actionFromTrello)
                discordClient.channels.cache.get(process.env.DISCORD_BUG_CHANNEL).send(embed)
                res.writeHead(200);
                res.end()

            }

            break;

        case COMMENT_CARD:

            const embed = messageFactoryInstance.trelloComment(actionFromTrello)
            discordClient.channels.cache.get(process.env.DISCORD_CARD_COMMENT_CHANNEL).send(embed)
            res.writeHead(200);
            res.end()

            break;

        case DELETE_COMMENT:
        case UPDATE_COMMENT:

            const discordChannel = discordClient.channels.cache.get(process.env.DISCORD_CARD_COMMENT_CHANNEL)

            /**
             * The fetch method will retrieve by default (if no paramter is set) the last 50 messages
             */
            discordChannel.messages.fetch().then(/**@param {Collection} messages**/(messages) => {
                const messagesArray = Array.from(messages.values())
                const messageToBeDeleted = findDiscordMessageByTrelloCommentId(messagesArray, actionFromTrello.data.action.id)
                if (messageToBeDeleted) // if the message has been retrieved we delete it
                    messageToBeDeleted.delete()
                if(actionFromTrello.type === UPDATE_COMMENT){ // if an update has been asked, we send a new comment
                    const embed = messageFactoryInstance.trelloComment(actionFromTrello, true)
                    discordChannel.send(embed)
                }
                res.writeHead(200);
                res.end()
            })
    }
}