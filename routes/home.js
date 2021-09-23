const express = require("express");
const router = express.Router();

router.get("/", (res) =>
  res.render("index", {
    title: "Vidly App",
    message: "Welcome to the Vidly API.",
  })
);

module.exports = router;
