const config = require("config");

module.exports = function() {
  if (!config.get("jwtPrivateKey")) {
    throw new Error(
      "Fatal Error: jwtPrivateKey is not defined. See the configuration file to set new environment."
    );
  }
}