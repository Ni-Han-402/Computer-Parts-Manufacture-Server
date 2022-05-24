const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

// Midleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.raleo.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    console.log("database connected");
    await client.connect();
    const partCollection = client.db("pc-house").collection("parts");

    app.get("/parts", async (req, res) => {
      const query = {};
      const cursor = partCollection.find(query);
      const parts = await cursor.toArray();

      res.send(parts);
    });
  } finally {
  }
}

run().catch(console.dir);

// root
app.get("/", (req, res) => {
  res.send("Hello PC House");
});

app.listen(port, () => {
  console.log(`PC House listening on port ${port}`);
});
