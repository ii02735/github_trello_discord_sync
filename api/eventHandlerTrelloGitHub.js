require('dotenv').config()
const constants = require('./constants')
const octokit = require('@octokit/rest')
const Octokit = new octokit.Octokit({
    auth: process.env.GITHUB_PAT
});

const owner = process.env.GITHUB_REPOSITORY_OWNER;
const repo = process.env.GITHUB_REPOSITORY;

(async function () {

    try {
        const pull_requests = await Octokit.pulls.list({
            owner,
            repo
        })
        console.log(pull_requests)
    } catch (e) {
        console.log(e)
    }

})