require('dotenv').config()
const fetch = require('node-fetch') // for Trello API
const fs = require('fs')
const octokit = require('@octokit/rest')
const Octokit = new octokit.Octokit({
    auth: process.env.GITHUB_PAT
});

const owner = process.env.GITHUB_REPOSITORY_OWNER;
const repo = process.env.GITHUB_REPOSITORY;
const head = process.env.GITHUB_REPOSITORY_HEAD_BRANCH
const base = process.env.GITHUB_REPOSITORY_BASE_BRANCH

module.exports = (data, res) => (async function (data, res) {
    try {
        const pull_requests = await Octokit.pulls.list({
            owner,
            repo
        })
        let pull_request_to_prod = pull_requests.data.find((pr) => (pr.state === 'open') && (pr.head.ref === head) && (pr.base.ref === base))
        const current_datetime = new Date()
        const title = `MEP ${appendLeadingZeroes(current_datetime.getDate())}-${appendLeadingZeroes(current_datetime.getMonth() + 1)}-${current_datetime.getFullYear()}`
        const fetch_data = await fetch(`https://api.trello.com/1/lists/${data.model.id}/cards?key=${process.env.APP_KEY}&token=${process.env.USER_TOKEN}`)
        const cards = await fetch_data.json()
        const cards_markdown_list = cards.map((card) => `- [${card.name}](${card.url})`)
        let body = process.env.GITHUB_PR_BODY
        body = body + cards_markdown_list.join('\r\n')
        if (!pull_request_to_prod) {
            console.log(`No pull requests ${head}:${base}`)
            try {
                await Octokit.pulls.create({
                    owner,
                    repo,
                    head,
                    base,
                    title,
                    body
                })
            } catch (e) {
                console.log(e)
            }
        } else {
            console.log(`Pull request detected for ${head}:${base}`)
            try {
                await Octokit.pulls.update({
                    owner,
                    repo,
                    body,
                    pull_number: pull_request_to_prod.number
                })
            } catch (e) {
                console.log(e)
            }
        }
    } catch (e) {
        console.log(e)
    }
    res.status(200).send({ "message": "ok" })

})(data, res)

const appendLeadingZeroes = (n) => {
    if (n <= 9) {
        return "0" + n;
    }
    return n
}