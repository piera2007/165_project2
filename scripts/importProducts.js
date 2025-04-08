const fs = require('fs');
const csv = require('csv-parser');
const mongoose = require('mongoose');
const Product = require('../models/product');

// Verbindung zur DB (verwende denselben Verbindungsstring wie in deinem Config)
mongoose.connect('mongodb+srv://dbAdmin:SaAtAm4hdMAv3bDY@cluster0.msdl4hm.mongodb.net/ecommerce?retryWrites=true&w=majority', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const results = [];

fs.createReadStream('products.csv')
  .pipe(csv())
  .on('data', (data) => {
    // Konvertiere das Feld "reviews" von String zu JSON, falls vorhanden.
    if (data.reviews) {
      try {
        data.reviews = JSON.parse(data.reviews);
      } catch (e) {
        data.reviews = [];
      }
    }
    results.push(data);
  })
  .on('end', async () => {
    try {
      for (let productData of results) {
        const product = new Product(productData);
        await product.save();
      }
      console.log('Datenimport abgeschlossen!');
      process.exit(0);
    } catch (error) {
      console.error('Fehler beim Import:', error);
      process.exit(1);
    }
  });
