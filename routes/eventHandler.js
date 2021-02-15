require("dotenv").config()
const Router = require("express-promise-router");
const router = new Router()
const mergedColumn = require('../handlers/mergedColumn')
const discordActions = require('../handlers/discordNotification')
const githubPRActions = require('../handlers/pullRequest');
const { Discord, discordClient } = require("../config/discord");

router.post("/mergedColumn", async (req, res) => {
    if (req.body.action && checkIfListHasChanged(req.body.action))
        await mergedColumn(req.body, res)
    else
        res.status(200).send({ "error": `action ${req.body.action} cannot be handled` })
})


router.get("/mergedColumn", (req, res) => {
    res.send({ "message": "ping ok" })
})

router.post("/discord", async (req, res) => {
    await discordActions(res, req.body.action, Discord, discordClient)
})

/**
 * For Trello usage only
 * Trello will ask a response when the webhook will be attached
 */
router.get("/discord", (req, res) => {
    res.send({ "message": "ping ok" })
})


router.post("/pullRequest", (req, res) => {
    githubPRActions(res, req.body, Discord, discordClient)
})
/**
 * For Trello usage only
 * Trello will ask a response when the webhook will be attached
 */
router.get("/pullRequest", (req, res) => {
    res.send({ "message": "ping ok" })
})



const checkIfListHasChanged = (actionFromTrello) => {
    return actionFromTrello && (actionFromTrello.data.hasOwnProperty('listBefore')
        && actionFromTrello.data.hasOwnProperty('listAfter')) ?
        (actionFromTrello.data.listBefore.name === process.env.TRELLO_COLUMN)
        || (actionFromTrello.data.listAfter.name === process.env.TRELLO_COLUMN) : false
}

module.exports = router;