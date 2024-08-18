const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: 'https://job-task2-client.web.app', // Allow this origin
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Specify allowed methods
    allowedHeaders: ['Content-Type', 'Authorization'], // Specify allowed headers
    optionsSuccessStatus: 200,
  })
);
app.use(express.json());

const uri = process.env.DB_url;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect(); // Ensure the MongoClient is connected before making any requests

    const productCollection = client.db("Products").collection("product");

    app.get("/product", async (req, res) => {
      const page = parseInt(req.query.page) || 1;
      const search = req.query.search || "";
      const sortValue = req.query.sort || "";
      const brand = req.query.brand || "";
      const category = req.query.category || "";
      const minimum = parseFloat(req.query.minimum) || 0;
      const maximum = parseFloat(req.query.maximum) || Number.MAX_VALUE;
      const limit = 11;

      const query = {};

      if (search) {
        query.productName = { $regex: search, $options: "i" };
      }

      if (brand) {
        query.brand = { $regex: brand, $options: "i" };
      }

      if (category) {
        query.category = { $regex: category, $options: "i" };
      }

      if (!isNaN(minimum) || !isNaN(maximum)) {
        query.price = {
          $gte: minimum,
          $lte: maximum,
        };
      }

      let sort = { createdAt: -1 };
      if (sortValue === "Low to High") {
        sort = { price: 1, createdAt: -1 };
      } else if (sortValue === "High to Low") {
        sort = { price: -1, createdAt: -1 };
      }

      const skip = (page - 1) * limit;
      const result = await productCollection
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray();
      const totalProducts = await productCollection.countDocuments(query);

      res.send({
        data: result,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts,
      });
    });

    console.log("Successfully connected to MongoDB!");
  } catch (error) {
    console.error("Failed to connect to MongoDB", error);
    process.exit(1); // Exit the process with a failure code
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Close the MongoDB connection when the Node.js process is terminated
process.on("SIGINT", async () => {
  await client.close();
  console.log("MongoDB connection closed");
  process.exit(0);
});
