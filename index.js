require("dotenv").config()
const express = require("express")
const bodyParser = require("body-parser")
const app = express();
const port = process.env.PORT || 3000;

const userRoutes = require("./routes/userManagement");
const eventRoutes = require("./routes/eventHandler");

app.use(bodyParser.json())

app.use("/users", userRoutes)
app.use("/events", eventRoutes)

app.listen(port, () => console.log(`listening to ${port}`));







