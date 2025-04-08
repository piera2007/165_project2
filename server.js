// server.js
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const app = express();
app.use(bodyParser.json());

// Verbindung zu MongoDB Atlas (ersetze ggf. den Datenbanknamen "ecommerce")
const dbURI = 'mongodb+srv://dbAdmin:SaAtAm4hdMAv3bDY@cluster0.msdl4hm.mongodb.net/ecommerce?retryWrites=true&w=majority';
mongoose.connect(dbURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB verbunden!'))
.catch(err => console.error('Verbindungsfehler:', err));

// --- Datenmodell Definition ---

// Schema für Reviews (eingebettet im Produkt)
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
  reviews: [reviewSchema]
});

// Modell erstellen
const Product = mongoose.model('Product', productSchema);

// --- Bonus: Textindex für Full-Text-Search ---
Product.collection.createIndex({ name: "text", description: "text" });

// --- REST-API Endpunkte ---

// GET: Alle Produkte abrufen
app.get('/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: Neues Produkt erstellen
app.post('/products', async (req, res) => {
  try {
    const product = new Product(req.body);
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT: Produkt aktualisieren (nach ID)
app.put('/products/:id', async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedProduct);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE: Produkt löschen (nach ID)
app.delete('/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Produkt gelöscht' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Aggregation: Durchschnittliche Bewertung pro Produkt
app.get('/products/average-rating', async (req, res) => {
    try {
      const result = await Product.aggregate([
        { $unwind: "$reviews" },
        {
          $group: {
            _id: "$name",  // Gruppierung auf den Produktnamen
            avgRating: { $avg: "$reviews.rating" }
          }
        }
      ]);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });  

// Full-Text-Search: Produkte anhand eines Suchbegriffs finden
app.get('/products/search', async (req, res) => {
  try {
    const { q } = req.query;
    const result = await Product.find({ $text: { $search: q } });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/products/mapreduce', async (req, res) => {
  try {
    // Map als String
    const mapFunction = function() {
      if (this.reviews && this.reviews.length > 0) {
        this.reviews.forEach(review => {
          emit(this._id, review.rating);
        });
      }
    }.toString();

    // Reduce als String
    const reduceFunction = function(key, values) {
      return Array.sum(values) / values.length;
    }.toString();

    // Der eigentliche Befehl
    const result = await mongoose.connection.db.command({
      mapReduce: 'products',
      map: mapFunction,
      reduce: reduceFunction,
      out: { inline: 1 }
    });

    // result.results enthält Array von { _id, value }
    res.json(result.results);

  } catch (err) {
    console.error('Fehler beim MapReduce:', err);
    res.status(500).json({ error: err.message });
  }
});




// Statische Dateien (z.B. Dashboard)
app.use(express.static('public'));

// Server starten
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server läuft auf Port ${PORT}`));
