const mongoose = require('mongoose');

// Schema für Reviews (eingebettet)
const reviewSchema = new mongoose.Schema({
  reviewer: String,
  rating: Number,
  comment: String,
  date: { type: Date, default: Date.now }
});

// Produktschema
const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  price: Number,
  category: String,
  reviews: [reviewSchema] // eingebettete Reviews als Array
});

module.exports = mongoose.model('Product', productSchema);
