const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
require("dotenv").config();


const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: ["http://localhost:5173"],
    
  })
);
app.use(express.json());




const uri = process.env.DB_url;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {

    const productCollection = client.db('Products').collection('product')



    
    app.get('/product', async (req, res) => {
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
          $lte: maximum
        };
      }
    
      let sort = { createdAt: -1 }; 
      if (sortValue === 'Low to High') {
        sort = { price: 1, createdAt: -1 };
      } else if (sortValue === 'High to Low') {
        sort = { price: -1, createdAt: -1 };
      }
    
     
      const skip = (page - 1) * limit;
      const result = await productCollection.find(query).sort(sort).skip(skip).limit(limit).toArray();
      const totalProducts = await productCollection.countDocuments(query);
    
      res.send({
        data: result,
        currentPage: page,
        totalPages: Math.ceil(totalProducts / limit),
        totalProducts
      });
    });
    






    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);



app.get("/", (req, res) => {
    res.send("server is running");
  });
  
  app.listen(port, () => {
    console.log(`server is running on ${port}`);
  });