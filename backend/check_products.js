const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect('mongodb://localhost:27017/casaviva', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connesso');
    return Product.find().limit(10);
  })
  .then(products => {
    console.log('Esempi di prodotti:');
    products.forEach((p, i) => {
      console.log(`${i+1}. Nome: ${p.name}`);
      console.log(`   Descrizione: ${p.description}`);
      console.log(`   Categoria: ${p.category}`);
      console.log('   ---');
    });
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Errore:', err);
    mongoose.disconnect();
  });
