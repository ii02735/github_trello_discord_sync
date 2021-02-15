require('dotenv').config()
const { Client, Channel, Collection } = require('discord.js');
const { embedMessageFactory, findDiscordMessageByGitHubPRCommentURL } = require("./util");

const ADDED_COMMENT = 'created'
const EDITED_COMMENT = 'edited'
const DELETED_COMMENT = 'deleted'

/**
 * 
 * @param {import("express").Response} res 
 * @param {*} data github data sent
 * @param {typeof import("discord.js")} DiscordInstance 
 * @param {Client} discordClient 
 */
module.exports = async (res, data, DiscordInstance, discordClient) => {

    /**
     * @type {Channel} discordChannel
     */
    const discordChannel = discordClient.channels.cache.get(process.env.DISCORD_PR_COMMENT_CHANNEL)
    const messageFactoryInstance = await embedMessageFactory(DiscordInstance)
    console.log(data.repository.name)
    switch (data.action) {
        case ADDED_COMMENT:
            const embed = await messageFactoryInstance.githubPRComment(data)
            discordChannel.send(embed)
            res.status(200).send({ "message": "ok" })
            break;

        case EDITED_COMMENT:
        case DELETED_COMMENT:
            if (data.hasOwnProperty("comment")) {
                console.log("comment property detected")
                /**
                 * if data doesn't have 'comment' property it means that the PR has updated by something else than a comment
                 * Such as edit the PR body which is considered as an 'edited' event like creating a comment / editing it
                 */
                discordChannel.messages.fetch().then(/**@param {Collection} messages**/async (messages) => {
                    const messagesArray = Array.from(messages.values())
                    const messageToBeDeleted = findDiscordMessageByGitHubPRCommentURL(messagesArray, data)
                    if (messageToBeDeleted) // if the message has been retrieved we delete it
                        messageToBeDeleted.delete()
                    if (data.action === EDITED_COMMENT) { // if an update has been asked, we send a new comment
                        const embed = await messageFactoryInstance.githubPRComment(data)
                        discordChannel.send(embed)
                    }
                    res.status(200).send({ "message": "ok" })
                })
            }
            break
        default:
            /**
             * For GitHub usage only
             * GitHub will ask a response when the webhook will be attached
             */
            res.status(200).send({ "message": "ping ok" })
    }

}