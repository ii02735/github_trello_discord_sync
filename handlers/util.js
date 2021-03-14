const { MessageEmbed } = require('discord.js')
const db = require("../config/db")
const url = require('url')

/**
 * Translate Trello comments to valid Discord messages (with Trello username <-> Discord mapping)
 * @param {*} message Message / comment from Trello
 * @param {boolean} mention Precise if the trello username must be replaced by the user ID from Discord (for mention), else by the discord username
 */
const translateTrelloToMention = async (message, mention = true) => {

    const users = await db.query("SELECT * FROM users");
    return users.rows.reduce((str, current) => str.replace(`@${current.trello}`, mention ? `<@${current.discord_id}>` : current.discord_username), message)
}

/**
 * Translate Trello comments to valid Discord messages (with GitHub username <-> Discord mapping)
 * @param {*} message Message / comment from Trello
 * @param {boolean} mention Precise if the trello username must be replaced by the user ID from Discord, else by the discord username
 */
const translateGithubToMention = async (message, mention = true, section = null) => {

    if(message){
      const users = await db.query("SELECT * FROM users");
      return users.rows.reduce((str, current) => current.github_username ? str.replace(`@${current.github_username}`, mention ? `<@${current.discord_id}>` : current.discord_username) : str, message)
    }else
        return null;
}

/**
 * Factory to create embed messages (for bug report, trello card comment)
 * @param {typeof import("discord.js")} DiscordInstance 
 */
module.exports.embedMessageFactory = async (DiscordInstance) => ({

    trelloBug: async (actionFromTrello) => new DiscordInstance.MessageEmbed()
        .setColor('#EB5A46')
        .setTitle(actionFromTrello.data.card.name)
        .setURL(`https://trello.com/${actionFromTrello.data.card.shortLink}`)
        .setDescription(await translateTrelloToMention(actionFromTrello.data.text))
        .setAuthor(actionFromTrello.data.board.name, 'https://www.dropbox.com/s/4uedurjpi5igbos/Trello%20logo%20-%20Imgur.png?raw=1', 'https://discord.js.org')
        .setThumbnail('https://trello-backgrounds.s3.amazonaws.com/SharedBackground/140x93/c3b3405cfa3055a1f67d306d52eb5007/photo-1542779283-429940ce8336.jpg')
        .setFooter(await translateTrelloToMention(`Par @${actionFromTrello.memberCreator.username}`, false))
        .setTimestamp(),

    trelloComment: async (actionFromTrello, update = false) => new DiscordInstance.MessageEmbed()
        .setColor('#0079bf')
        .setTitle(actionFromTrello.data.card.name)     //the Trello Card comment ID is written into the URL in order to retrieve it later for updates / deletions purposes
        .setURL(`https://trello.com/c/${actionFromTrello.data.card.shortLink}?commentId=${update ? actionFromTrello.data.action.id : actionFromTrello.id}`)
        .setDescription(await translateTrelloToMention(update ? actionFromTrello.data.action.text : actionFromTrello.data.text))
        .setAuthor(actionFromTrello.data.board.name, 'https://www.dropbox.com/s/4uedurjpi5igbos/Trello%20logo%20-%20Imgur.png?raw=1', 'https://discord.js.org')
        .setThumbnail('https://trello-backgrounds.s3.amazonaws.com/SharedBackground/140x93/c3b3405cfa3055a1f67d306d52eb5007/photo-1542779283-429940ce8336.jpg')
        .setFooter(await translateTrelloToMention(`Commentaire de @${actionFromTrello.memberCreator.username}`, false))
        .setTimestamp(),

    createdGitHubPR: async (data) => new DiscordInstance.MessageEmbed()
        .setColor("#ffffff")
        .setTitle(data.pull_request.title)
        .setURL(data.pull_request.html_url)
        .setAuthor(`${data.repository.name} New Pull Request`, 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png')
        .setThumbnail('https://trello-backgrounds.s3.amazonaws.com/SharedBackground/140x93/c3b3405cfa3055a1f67d306d52eb5007/photo-1542779283-429940ce8336.jpg')
        .setFooter(await translateGithubToMention(`Pull Request créée par @${data.sender.login}`, false))
        .setTimestamp(),

    githubPRComment: async (data) => { 
        
        const embed = new DiscordInstance.MessageEmbed()
        .setColor("#ffffff")
        .setTitle(determineTitle(data))
        .setURL(determineURL(data))
        .setDescription(await translateGithubToMention(determineBody(data),true))
        .setAuthor(`${data.repository.name} Pull Request comment`, 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png')
        .setThumbnail('https://trello-backgrounds.s3.amazonaws.com/SharedBackground/140x93/c3b3405cfa3055a1f67d306d52eb5007/photo-1542779283-429940ce8336.jpg')
        .setFooter(await translateGithubToMention(`Commentaire de @${data.sender.login}`, false))
        .setTimestamp()
        
        if(data.comment.diff_hunk && data.comment.path)
        {
            const language = data.comment.path.split('.').reverse()[0];
            /**
             * @param {string[]} diff_hunk
             */
            let diff_hunk = data.comment.diff_hunk.split(/\r?\n/)
            diff_hunk.shift()
            let code_block = [];
            for(let i = 0; i <= data.comment.original_line - data.comment.original_start_line; i++)
                code_block.push(diff_hunk.pop())
            if(code_block.length <= 1024)
                embed.addField(data.comment.path,"```"+language+'\n'+code_block.reverse().join('\n')+"```")
            else
                embed.addField(data.comment.path,"")
        }
        return embed;
    }
})

const determineURL = (data) => {
    if(data.review)
        return data.review.html_url
    if(data.comment)
        return data.comment.html_url
}

const determineBody = (data) => {
    if(data.comment)
        return data.comment.body
    if(data.review)
        return data.review.body
    if(data.body)
        return data.body
    return null;
}

const determineTitle = (data) => {
    if(data.pull_request)
        return data.pull_request.title
    if(data.issue)
        return data.issue.title
    if(data.comment){
        return data.comment._links.pull_request.title
    }
    return null;
}

/**
 * Find a message on discord's channel by Trello comment ID
 * @param {Array} messages array of discord message objects
 * @param {string} trelloID The trello comment ID
 * @returns {MessageEmbed}
 */
module.exports.findDiscordMessageByTrelloCommentId = (messages, trelloID) => {
    let retrievedMessage = null;
    // In those 50 messages, only from the bot are concerned
    const botMessages = messages.filter((message) => message.author.username === process.env.DISCORD_BOT_USERNAME)
    // We must now retrieve the message with the correct comment ID from Trello
    if (botMessages.length > 0)
        retrievedMessage = botMessages.find((message) => {
            return (/**
             * Each message sent by discord is an embed one (picture + link)
             * When messages are retrieved from the API, each message has an "embeds" property
             * which is a collection that can contains multiple embed message objects
             */
                message.embeds.length > 0
                /*
                    * because the bot create a new embed message before sending it, all arrays will only have one element
                    * and the "url" must exist in order to retrieve the comment ID inside of it
                    */
                && message.embeds[0].url
                // the comment ID is into a queryString, we parse it from the url library
                && url.parse(message.embeds[0].url, true).query.commentId === trelloID)
        })

    return retrievedMessage

}

module.exports.findDiscordMessageByGitHubPRCommentURL = (messages, data) => {
    let retrievedMessage = null;
    // In those 50 messages, only from the bot are concerned
    const botMessages = messages.filter((message) => message.author.username === process.env.DISCORD_BOT_USERNAME)
    // We must now retrieve the discord message with the correct Trello comment ID
    if (botMessages.length > 0)
        retrievedMessage = botMessages.find((message) => {
            console.log(message.embeds.length > 0 ? message.embeds[0].url : null)
            return (/**
             * Each message sent by discord is an embed one (picture + link)
             * When messages are retrieved from the API, each message has an "embeds" property
             * which is a collection that can contains multiple embed message objects
             */
                message.embeds.length > 0
                /*
                    * because the bot create a new embed message before sending it, all arrays will only have one element
                    * and the "url" must exist in order to retrieve the comment ID inside of it
                    */
                && message.embeds[0].url
                && message.embeds[0].url === (data.review ? data.review.html_url : data.comment.html_url))
        })
    return retrievedMessage

}

