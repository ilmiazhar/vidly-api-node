const express = require("express");
const app = express();

require("./startup/validation")();
require("./startup/logging")();
require("./startup/routes")(app);
require("./startup/db")();
require("./startup/config")();
require("./startup/prod")(app);

const port = process.env.PORT || 3200;
const server = app.listen(port, () => console.log("Listening on port " + port));

module.exports = server;
