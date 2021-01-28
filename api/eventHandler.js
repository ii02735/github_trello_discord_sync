module.exports = (req, res) => {
    console.log(req, res)
    res.status(200).send(`Event fired ! Check logs from Vercel !`)
}