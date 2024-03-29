const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
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

// Verify Token Function
function verifyJWT(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    console.log("database connected");
    await client.connect();
    const partCollection = client.db("pc-house").collection("parts");
    const orderCollection = client.db("pc-house").collection("order");
    const userCollection = client.db("pc-house").collection("user");
    const reviewCollection = client.db("pc-house").collection("review");
    const paymentCollection = client.db("pc-house").collection("payment");
    const profileCollection = client.db("pc-house").collection("profile");

    // Verify Admin Function
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await userCollection.findOne({
        email: requester,
      });
      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "Forbidden Access" });
      }
    };

    // Payment
    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const { price } = req.body;
      const amount = price * 100;

      // Create a PaymentIntent with the order amount and currency
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount,
        currency: "usd",
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    // LOAD MULTIPLE DATA FOR PART
    app.get("/part", async (req, res) => {
      const query = {};
      const cursor = partCollection.find(query);
      const parts = await cursor.toArray();
      res.send(parts);
    });
    // LOAD MULTIPLE DATA FOR REVIEWS
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query);
      const reviews = await cursor.toArray();
      res.send(reviews);
    });
    // LOAD MANAGE PRODUCTS API
    app.get("/part", verifyJWT, async (req, res) => {
      const parts = await partCollection.find().toArray();
      res.send(parts);
    });
    // LOAD ORDERS PRODUCTS API
    app.get("/orders", verifyJWT, async (req, res) => {
      const orders = await orderCollection.find().toArray();
      res.send(orders);
    });
    // DELETE PRODUCTS API
    app.delete("/part/:id", verifyJWT, verifyAdmin, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const parts = await partCollection.deleteOne(query);
      res.send(parts);
    });
    // DELETE ORDERS API
    app.delete("/orders/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const orders = await orderCollection.deleteOne(query);
      res.send(orders);
    });
    // DELETE USERS API
    app.delete("/user/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const user = await userCollection.deleteOne(query);
      res.send(user);
    });

    // LOAD SINGLE DATA
    app.get("/part/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const part = await partCollection.findOne(query);
      res.send(part);
    });
    // POST DATA FOR PARTS
    app.post("/part", verifyJWT, verifyAdmin, async (req, res) => {
      const part = req.body;
      const result = partCollection.insertOne(part);
      res.send(result);
    });
    // POST DATA FOR REVIEWS
    app.post("/review", verifyJWT, async (req, res) => {
      const review = req.body;
      const reviews = reviewCollection.insertOne(review);
      res.send(reviews);
    });

    // Profile Collection API
    // LOAD SINGLE DATA
    app.get("/profile/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const profile = await profileCollection.findOne(query);
      res.send(profile);
    });
    app.post("/profile", verifyJWT, async (req, res) => {
      const profile = req.body;
      const result = profileCollection.insertOne(profile);
      res.send(result);
    });
    // Order Collection API
    app.post("/order", async (req, res) => {
      const order = req.body;
      const result = orderCollection.insertOne(order);
      res.send(result);
    });
    app.get("/order", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const orders = await orderCollection.find(query).toArray();
        return res.send(orders);
      } else {
        return res.status(403).send({ message: "Forbidden Access" });
      }
    });

    app.patch("/order/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const updateDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const result = await paymentCollection.insertOne(payment);
      const updatedOrder = await orderCollection.updateOne(filter, updateDoc);

      res.send(updateDoc);
    });

    app.get("/order/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const order = await orderCollection.findOne(query);
      res.send(order);
    });

    // USER COLLECTION API
    // User Get Api
    app.get("/user", verifyJWT, async (req, res) => {
      const users = await userCollection.find().toArray();
      res.send(users);
    });

    // Admin Get Api
    app.get("/admin/:email", async (req, res) => {
      const email = req.params.email;
      const user = await userCollection.findOne({ email: email });
      const isAdmin = user.role === "admin";
      res.send({ admin: isAdmin });
    });

    // User Put Api
    app.put("/user/admin/:email", verifyJWT, verifyAdmin, async (req, res) => {
      const email = req.params.email;

      const filter = { email: email };
      const updateDoc = {
        $set: { role: "admin" },
      };
      const result = await userCollection.updateOne(filter, updateDoc);
      res.send(result);
    });

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const user = req.body;
      const filter = { email: email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      const token = jwt.sign(
        { email: email },
        process.env.ACCESS_TOKEN_SECRET,
        { expiresIn: "12d" }
      );
      res.send({ result, token });
    });
  } finally {
  }
}

run().catch(console.dir);

// root
app.get("/", (req, res) => {
  res.send("Hello PC House...Hi");
});

app.listen(port, () => {
  console.log(`PC House listening on port ${port}`);
});
