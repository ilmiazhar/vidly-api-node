require("express-async-errors");
// require("winston-mongodb");
const winston = require("winston");

module.exports = function () {
  new winston.ExceptionHandler(
    new winston.transports.Console({
      colorize: true,
      prettyPrint: true,
    }),
    new winston.transports.File({
      filename: "uncaughtException.log",
      level: "info",
    })
  );

  process.on("unhandledRejection", (err) => {
    throw err;
  });

  winston.add(
    new winston.transports.File({
      filename: "logfile.log",
    })
  );

  /* winston.add(
    new winston.transports.MongoDB({
      db: "mongodb://localhost/vidly-node",
      collection: "log",
      level: "info",
      options: {
        useUnifiedTopology: true,
      },
      metaKey: "metadata",
    })
  ); */
};
