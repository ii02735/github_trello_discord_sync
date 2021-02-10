require("dotenv").config()
const constants = require("./constants")
const Discord = require("discord.js")
const client = new Discord.Client()
const validAddresses = [
    '107.23.104.115',
    '107.23.149.70',
    '54.152.166.250',
    '54.209.149.230',
    '18.234.32.2',
    '192.168.0.254' //local
];



client.once('ready', () => {
    console.log("client discord ready")
})

module.exports = (req, res) => {
    let body = ''
    req.on('data', (data) => body += data)
    req.on('end', () => {
        const data = JSON.parse(body)
        const actionFromTrello = data.action
        const eventName = actionFromTrello.type
        switch (eventName) {

            case constants.ADD_LABEL_TO_CARD:
                if (actionFromTrello.data.text === "Bug") //if label name is equal to Bug -> dispatch to Discord
                {
                    const embed = new Discord.MessageEmbed()
                        .setColor('#EB5A46')
                        .setTitle(actionFromTrello.data.card.name)
                        .setURL(`https://trello.com/${actionFromTrello.data.card.shortLink}`)
                        .setAuthor(actionFromTrello.data.board.name, 'https://www.dropbox.com/s/4uedurjpi5igbos/Trello%20logo%20-%20Imgur.png?raw=1', 'https://discord.js.org')
                        .setThumbnail('https://trello-backgrounds.s3.amazonaws.com/SharedBackground/140x93/c3b3405cfa3055a1f67d306d52eb5007/photo-1542779283-429940ce8336.jpg')
                        .setFooter(`Par ${actionFromTrello.memberCreator.username}`)
                        .setTimestamp()
                    client.channels.cache.get(process.env.DISCORD_CHANNEL).send(embed)
                }
        }
    })

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write('<p>Event fired with success !</p>')
    res.end()

}



client.login(process.env.DISCORD_BOT_TOKEN)