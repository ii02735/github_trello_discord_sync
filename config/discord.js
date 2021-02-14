require('dotenv')
const Discord = require('discord.js')
const discordClient = new Discord.Client()

discordClient.on('ready', () => console.log("discord client is ready"))

discordClient.login(process.env.DISCORD_BOT_TOKEN)

module.exports.Discord = Discord
module.exports.discordClient = discordClient