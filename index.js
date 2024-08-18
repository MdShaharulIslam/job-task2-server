const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;
const uri = process.env.DB_url;

// MongoDB Connection
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Product Schema and Model
const productSchema = new mongoose.Schema({
  productName: String,
  productImage: String,
  description: String,
  price: Number,
  category: String,
  ratings: Number,
  createdAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);

// API Endpoints
app.get('/products', async (req, res) => {
  const { page = 1, search = '', sort = '', brand = '', category = '', minimum = 0, maximum = Number.MAX_VALUE } = req.query;

  const query = {};
  if (search) query.productName = { $regex: search, $options: 'i' };
  if (brand) query.brand = { $regex: brand, $options: 'i' };
  if (category) query.category = { $regex: category, $options: 'i' };
  if (minimum || maximum) query.price = { $gte: parseFloat(minimum), $lte: parseFloat(maximum) };

  const limit = 10;
  const skip = (page - 1) * limit;

  const products = await Product.find(query)
    .sort(sort === 'Low to High' ? { price: 1 } : sort === 'High to Low' ? { price: -1 } : { createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalProducts = await Product.countDocuments(query);

  res.json({ products, totalProducts, currentPage: parseInt(page), totalPages: Math.ceil(totalProducts / limit) });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
