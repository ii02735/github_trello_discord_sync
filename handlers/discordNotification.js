require("dotenv").config()
const ADD_LABEL_TO_CARD = "addLabelToCard"
const COMMENT_CARD = "commentCard"
const UPDATE_COMMENT = "updateComment"
const DELETE_COMMENT = "deleteComment"
const { Collection, Client } = require('discord.js')
const { embedMessageFactory, findDiscordMessageByTrelloCommentId } = require("./util")

/**
 * 
 * @param {import("express").Response} res 
 * @param {*} actionFromTrello
 * @param {typeof import("discord.js")} DiscordInstance 
 * @param {Client} discordClient 
 */
module.exports = async (res, actionFromTrello, DiscordInstance, discordClient) => {

    const messageFactoryInstance = await embedMessageFactory(DiscordInstance)

    switch (actionFromTrello.type) {

        case ADD_LABEL_TO_CARD:

            if (actionFromTrello.data.text === "Bug") //if label name is equal to Bug -> dispatch to Discord
            {

                const embed = await messageFactoryInstance.trelloBug(actionFromTrello)
                discordClient.channels.cache.get(process.env.DISCORD_BUG_CHANNEL).send(embed)
                res.status(200).send({ "message": "ok" })
            }

            break;

        case COMMENT_CARD:

            const embed = await messageFactoryInstance.trelloComment(actionFromTrello)
            discordClient.channels.cache.get(process.env.DISCORD_CARD_COMMENT_CHANNEL).send(embed)
            res.status(200).send({ "message": "ok" })
            break;

        case DELETE_COMMENT:
        case UPDATE_COMMENT:

            const discordChannel = discordClient.channels.cache.get(process.env.DISCORD_CARD_COMMENT_CHANNEL)

            /**
             * The fetch method will retrieve by default (if no paramter is set) the last 50 messages
             */
            discordChannel.messages.fetch().then(/**@param {Collection} messages**/async (messages) => {
                const messagesArray = Array.from(messages.values())
                const messageToBeDeleted = findDiscordMessageByTrelloCommentId(messagesArray, actionFromTrello.data.action.id)
                if (messageToBeDeleted) // if the message has been retrieved we delete it
                    messageToBeDeleted.delete()
                if (actionFromTrello.type === UPDATE_COMMENT) { // if an update has been asked, we send a new comment
                    const embed = await messageFactoryInstance.trelloComment(actionFromTrello, true)
                    discordChannel.send(embed)
                }
                res.status(200).send({ "message": "ok" })
            })

        default:

            res.status(404).send({ "message": `${actionFromTrello.type} not handled` })
    }
}