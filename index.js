const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// Midleware
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Hello PC House");
});

app.listen(port, () => {
  console.log(`PC House listening on port ${port}`);
});
